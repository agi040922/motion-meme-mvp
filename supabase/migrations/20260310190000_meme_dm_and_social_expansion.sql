create table if not exists meme.conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text not null default 'direct',
  direct_key text unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  last_message_id uuid,
  last_message_preview text not null default '',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_type_check check (conversation_type in ('direct'))
);

create table if not exists meme.conversation_members (
  conversation_id uuid not null references meme.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_message_id uuid,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists meme.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references meme.conversations (id) on delete cascade,
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  message_type text not null default 'text',
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint messages_type_check check (message_type in ('text')),
  constraint messages_body_length_check check (char_length(trim(body)) between 1 and 4000)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversations_last_message_fk'
  ) then
    alter table meme.conversations
      add constraint conversations_last_message_fk
      foreign key (last_message_id)
      references meme.messages (id)
      on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'conversation_members_last_read_message_fk'
  ) then
    alter table meme.conversation_members
      add constraint conversation_members_last_read_message_fk
      foreign key (last_read_message_id)
      references meme.messages (id)
      on delete set null;
  end if;
end
$$;

create table if not exists meme.post_bookmarks (
  post_id uuid not null references meme.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists meme.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references meme.posts (id) on delete cascade,
  reporter_user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  details text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_reports_reason_length_check check (char_length(trim(reason)) between 2 and 120),
  constraint post_reports_status_check check (status in ('open', 'reviewing', 'resolved', 'dismissed'))
);

create table if not exists meme.user_blocks (
  blocker_user_id uuid not null references auth.users (id) on delete cascade,
  blocked_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id),
  constraint user_blocks_no_self check (blocker_user_id <> blocked_user_id)
);

create table if not exists meme.hidden_posts (
  post_id uuid not null references meme.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists conversations_last_message_idx
  on meme.conversations (last_message_at desc nulls last, updated_at desc);

create index if not exists conversation_members_user_recent_idx
  on meme.conversation_members (user_id, updated_at desc);

create index if not exists messages_conversation_recent_idx
  on meme.messages (conversation_id, created_at desc)
  where deleted_at is null;

create index if not exists post_bookmarks_user_recent_idx
  on meme.post_bookmarks (user_id, created_at desc);

create index if not exists post_reports_post_recent_idx
  on meme.post_reports (post_id, created_at desc);

create index if not exists post_reports_reporter_recent_idx
  on meme.post_reports (reporter_user_id, created_at desc);

create index if not exists user_blocks_blocked_idx
  on meme.user_blocks (blocked_user_id, blocker_user_id);

create index if not exists hidden_posts_user_recent_idx
  on meme.hidden_posts (user_id, created_at desc);

create or replace function meme.build_direct_conversation_key(user_a uuid, user_b uuid)
returns text
language sql
immutable
set search_path = meme, public
as $$
  select case
    when user_a < user_b then user_a::text || ':' || user_b::text
    else user_b::text || ':' || user_a::text
  end;
$$;

create or replace function meme.touch_conversation_from_message()
returns trigger
language plpgsql
set search_path = meme, public
as $$
declare
  latest_message record;
  target_conversation_id uuid;
begin
  target_conversation_id := coalesce(new.conversation_id, old.conversation_id);

  select id, body, created_at
    into latest_message
  from meme.messages
  where conversation_id = target_conversation_id
    and deleted_at is null
  order by created_at desc
  limit 1;

  update meme.conversations
  set last_message_id = latest_message.id,
      last_message_preview = coalesce(left(latest_message.body, 160), ''),
      last_message_at = latest_message.created_at,
      updated_at = now()
  where id = target_conversation_id;

  if latest_message.id is null then
    update meme.conversations
    set last_message_id = null,
        last_message_preview = '',
        last_message_at = null,
        updated_at = now()
    where id = target_conversation_id;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function meme.mark_sender_message_read()
returns trigger
language plpgsql
set search_path = meme, public
as $$
begin
  update meme.conversation_members
  set last_read_message_id = new.id,
      last_read_at = new.created_at,
      updated_at = now()
  where conversation_id = new.conversation_id
    and user_id = new.sender_user_id;

  return new;
end;
$$;

create or replace function meme.get_or_create_direct_conversation(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_user_id uuid;
  v_conversation_id uuid;
  v_direct_key text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_other_user_id is null or p_other_user_id = v_user_id then
    raise exception 'A different recipient is required';
  end if;

  if exists (
    select 1
    from meme.user_blocks
    where (blocker_user_id = v_user_id and blocked_user_id = p_other_user_id)
       or (blocker_user_id = p_other_user_id and blocked_user_id = v_user_id)
  ) then
    raise exception 'Conversation unavailable';
  end if;

  v_direct_key := meme.build_direct_conversation_key(v_user_id, p_other_user_id);

  select id
    into v_conversation_id
  from meme.conversations
  where direct_key = v_direct_key
  limit 1;

  if v_conversation_id is null then
    insert into meme.conversations (
      conversation_type,
      direct_key,
      created_by
    )
    values (
      'direct',
      v_direct_key,
      v_user_id
    )
    on conflict (direct_key) do update
      set updated_at = now()
    returning id into v_conversation_id;

    insert into meme.conversation_members (
      conversation_id,
      user_id
    )
    values
      (v_conversation_id, v_user_id),
      (v_conversation_id, p_other_user_id)
    on conflict (conversation_id, user_id) do nothing;
  else
    insert into meme.conversation_members (
      conversation_id,
      user_id
    )
    values
      (v_conversation_id, v_user_id),
      (v_conversation_id, p_other_user_id)
    on conflict (conversation_id, user_id) do nothing;
  end if;

  return v_conversation_id;
end;
$$;

create or replace function meme.ensure_direct_conversation(p_other_user_id uuid)
returns uuid
language sql
security definer
set search_path = meme, public
as $$
  select meme.get_or_create_direct_conversation(p_other_user_id);
$$;

create or replace function meme.mark_conversation_read(
  p_conversation_id uuid,
  p_message_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_user_id uuid;
  v_target_message_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from meme.conversation_members
    where conversation_id = p_conversation_id
      and user_id = v_user_id
  ) then
    raise exception 'Conversation not available';
  end if;

  if p_message_id is not null then
    v_target_message_id := p_message_id;
  else
    select id
      into v_target_message_id
    from meme.messages
    where conversation_id = p_conversation_id
      and deleted_at is null
    order by created_at desc
    limit 1;
  end if;

  update meme.conversation_members
  set last_read_message_id = v_target_message_id,
      last_read_at = case when v_target_message_id is null then last_read_at else now() end,
      updated_at = now()
  where conversation_id = p_conversation_id
    and user_id = v_user_id;
end;
$$;

drop trigger if exists touch_conversation_after_message_insert on meme.messages;
create trigger touch_conversation_after_message_insert
  after insert or update or delete on meme.messages
  for each row execute procedure meme.touch_conversation_from_message();

drop trigger if exists mark_sender_message_read_after_insert on meme.messages;
create trigger mark_sender_message_read_after_insert
  after insert on meme.messages
  for each row execute procedure meme.mark_sender_message_read();

drop trigger if exists set_conversations_updated_at on meme.conversations;
create trigger set_conversations_updated_at
  before update on meme.conversations
  for each row execute procedure meme.set_updated_at();

drop trigger if exists set_conversation_members_updated_at on meme.conversation_members;
create trigger set_conversation_members_updated_at
  before update on meme.conversation_members
  for each row execute procedure meme.set_updated_at();

drop trigger if exists set_messages_updated_at on meme.messages;
create trigger set_messages_updated_at
  before update on meme.messages
  for each row execute procedure meme.set_updated_at();

drop trigger if exists set_post_reports_updated_at on meme.post_reports;
create trigger set_post_reports_updated_at
  before update on meme.post_reports
  for each row execute procedure meme.set_updated_at();

grant execute on function meme.get_or_create_direct_conversation(uuid) to authenticated, service_role;
grant execute on function meme.ensure_direct_conversation(uuid) to authenticated, service_role;
grant execute on function meme.mark_conversation_read(uuid, uuid) to authenticated, service_role;

alter table meme.conversations enable row level security;
alter table meme.conversation_members enable row level security;
alter table meme.messages enable row level security;
alter table meme.post_bookmarks enable row level security;
alter table meme.post_reports enable row level security;
alter table meme.user_blocks enable row level security;
alter table meme.hidden_posts enable row level security;

drop policy if exists conversations_select_participants on meme.conversations;
create policy conversations_select_participants
  on meme.conversations
  for select
  to authenticated
  using (
    exists (
      select 1
      from meme.conversation_members cm
      where cm.conversation_id = id
        and cm.user_id = (select auth.uid())
    )
  );

drop policy if exists conversation_members_select_participants on meme.conversation_members;
create policy conversation_members_select_participants
  on meme.conversation_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from meme.conversation_members viewer_member
      where viewer_member.conversation_id = conversation_id
        and viewer_member.user_id = (select auth.uid())
    )
  );

drop policy if exists conversation_members_update_own on meme.conversation_members;
create policy conversation_members_update_own
  on meme.conversation_members
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists messages_select_participants on meme.messages;
create policy messages_select_participants
  on meme.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from meme.conversation_members cm
      where cm.conversation_id = conversation_id
        and cm.user_id = (select auth.uid())
    )
  );

drop policy if exists messages_insert_participants on meme.messages;
create policy messages_insert_participants
  on meme.messages
  for insert
  to authenticated
  with check (
    sender_user_id = (select auth.uid())
    and exists (
      select 1
      from meme.conversation_members cm
      where cm.conversation_id = conversation_id
        and cm.user_id = (select auth.uid())
    )
  );

drop policy if exists messages_update_sender on meme.messages;
create policy messages_update_sender
  on meme.messages
  for update
  to authenticated
  using (
    sender_user_id = (select auth.uid())
    and exists (
      select 1
      from meme.conversation_members cm
      where cm.conversation_id = conversation_id
        and cm.user_id = (select auth.uid())
    )
  )
  with check (
    sender_user_id = (select auth.uid())
    and exists (
      select 1
      from meme.conversation_members cm
      where cm.conversation_id = conversation_id
        and cm.user_id = (select auth.uid())
    )
  );

drop policy if exists post_bookmarks_select_own on meme.post_bookmarks;
create policy post_bookmarks_select_own
  on meme.post_bookmarks
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists post_bookmarks_insert_own on meme.post_bookmarks;
create policy post_bookmarks_insert_own
  on meme.post_bookmarks
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists post_bookmarks_delete_own on meme.post_bookmarks;
create policy post_bookmarks_delete_own
  on meme.post_bookmarks
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists post_reports_select_own on meme.post_reports;
create policy post_reports_select_own
  on meme.post_reports
  for select
  to authenticated
  using ((select auth.uid()) = reporter_user_id);

drop policy if exists post_reports_insert_own on meme.post_reports;
create policy post_reports_insert_own
  on meme.post_reports
  for insert
  to authenticated
  with check ((select auth.uid()) = reporter_user_id);

drop policy if exists user_blocks_select_own on meme.user_blocks;
create policy user_blocks_select_own
  on meme.user_blocks
  for select
  to authenticated
  using ((select auth.uid()) = blocker_user_id);

drop policy if exists user_blocks_insert_own on meme.user_blocks;
create policy user_blocks_insert_own
  on meme.user_blocks
  for insert
  to authenticated
  with check ((select auth.uid()) = blocker_user_id);

drop policy if exists user_blocks_delete_own on meme.user_blocks;
create policy user_blocks_delete_own
  on meme.user_blocks
  for delete
  to authenticated
  using ((select auth.uid()) = blocker_user_id);

drop policy if exists hidden_posts_select_own on meme.hidden_posts;
create policy hidden_posts_select_own
  on meme.hidden_posts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists hidden_posts_insert_own on meme.hidden_posts;
create policy hidden_posts_insert_own
  on meme.hidden_posts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists hidden_posts_delete_own on meme.hidden_posts;
create policy hidden_posts_delete_own
  on meme.hidden_posts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace view meme.direct_inbox
with (security_invoker = true) as
select
  self.conversation_id,
  self.user_id as viewer_user_id,
  other.user_id as partner_user_id,
  partner.handle as partner_handle,
  partner.display_name as partner_display_name,
  partner.avatar_url as partner_avatar_url,
  convo.last_message_id,
  convo.last_message_preview,
  convo.last_message_at,
  last_message.sender_user_id as last_message_sender_user_id,
  coalesce(
    (
      select count(*)
      from meme.messages unread
      where unread.conversation_id = self.conversation_id
        and unread.deleted_at is null
        and unread.sender_user_id <> self.user_id
        and (
          self.last_read_at is null
          or unread.created_at > self.last_read_at
        )
    ),
    0
  )::integer as unread_count
from meme.conversation_members self
join meme.conversation_members other
  on other.conversation_id = self.conversation_id
 and other.user_id <> self.user_id
join meme.conversations convo
  on convo.id = self.conversation_id
join meme.profiles partner
  on partner.user_id = other.user_id
left join meme.messages last_message
  on last_message.id = convo.last_message_id;

create or replace view meme.feed_posts
with (security_invoker = true) as
select
  po.id,
  po.post_type,
  po.caption,
  po.like_count,
  po.comment_count,
  po.published_at,
  pr.user_id as author_user_id,
  pr.handle,
  pr.display_name,
  pr.avatar_url,
  pm.storage_path as primary_media_path,
  pm.media_type as primary_media_type,
  pm.poster_path as primary_media_poster_path,
  ps.score as play_score,
  st.stage_number,
  st.title as stage_title,
  (
    (
      (po.like_count * 1.5)::numeric +
      (po.comment_count * 2.5)::numeric +
      (case when po.post_type = 'play_video' then 2 else 0 end)::numeric +
      (coalesce(ps.score, 0) / 40.0)
    ) / greatest(
      extract(epoch from (now() - po.published_at)) / 3600 + 2,
      1
    )::numeric
  ) as popularity_score
from meme.posts po
join meme.profiles pr
  on pr.user_id = po.author_user_id
left join lateral (
  select m.*
  from meme.post_media m
  where m.post_id = po.id
  order by m.sort_order asc, m.created_at asc
  limit 1
) pm on true
left join meme.play_sessions ps
  on ps.id = po.source_play_session_id
left join meme.stages st
  on st.id = ps.stage_id
where po.deleted_at is null;

grant select on meme.direct_inbox to authenticated, service_role;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table
        meme.conversations,
        meme.conversation_members,
        meme.messages;
    exception
      when duplicate_object then null;
    end;
  end if;
end
$$;
