create schema if not exists meme;

create or replace function meme.set_updated_at()
returns trigger
language plpgsql
set search_path = meme, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists meme.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  handle text,
  display_name text not null,
  bio text not null default '',
  avatar_url text,
  featured_post_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_length check (handle is null or char_length(handle) between 3 and 24)
);

create unique index if not exists profiles_handle_unique_idx
  on meme.profiles (lower(handle))
  where handle is not null;

create table if not exists meme.meme_assets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  asset_type text not null,
  storage_path text not null,
  overlay_preset jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meme_assets_type_check check (asset_type in ('image', 'animated_image', 'video', 'sticker'))
);

create table if not exists meme.stages (
  id uuid primary key default gen_random_uuid(),
  stage_number integer not null unique,
  slug text not null unique,
  title text not null,
  description text not null default '',
  instruction_text text not null default '',
  time_limit_seconds smallint not null default 15,
  min_score_to_clear smallint not null default 75,
  rule_config jsonb not null default '{}'::jsonb,
  success_meme_asset_id uuid references meme.meme_assets (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stages_stage_number_check check (stage_number > 0),
  constraint stages_time_limit_check check (time_limit_seconds between 1 and 15),
  constraint stages_min_score_check check (min_score_to_clear between 0 and 100)
);

create table if not exists meme.stage_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stage_id uuid not null references meme.stages (id) on delete cascade,
  best_score smallint not null default 0,
  attempt_count integer not null default 0,
  unlocked_at timestamptz not null default now(),
  cleared_at timestamptz,
  last_attempted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stage_progress_best_score_check check (best_score between 0 and 100),
  constraint stage_progress_unique_user_stage unique (user_id, stage_id)
);

create table if not exists meme.play_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stage_id uuid not null references meme.stages (id) on delete restrict,
  score smallint not null,
  result_tier text not null,
  success boolean not null,
  attempt_started_at timestamptz not null default now(),
  attempt_finished_at timestamptz not null default now(),
  duration_seconds smallint not null default 15,
  similarity_breakdown jsonb not null default '{}'::jsonb,
  uploaded_video_path text,
  uploaded_thumbnail_path text,
  uploaded_at timestamptz,
  created_post_id uuid,
  created_at timestamptz not null default now(),
  constraint play_sessions_score_check check (score between 0 and 100),
  constraint play_sessions_duration_check check (duration_seconds between 1 and 15),
  constraint play_sessions_result_tier_check check (result_tier in ('perfect', 'success', 'close', 'fail'))
);

create table if not exists meme.posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users (id) on delete cascade,
  post_type text not null,
  source_play_session_id uuid unique references meme.play_sessions (id) on delete set null,
  caption text not null default '',
  like_count integer not null default 0,
  comment_count integer not null default 0,
  published_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_type_check check (post_type in ('text', 'image', 'play_video')),
  constraint posts_caption_length_check check (char_length(caption) <= 2000),
  constraint posts_like_count_check check (like_count >= 0),
  constraint posts_comment_count_check check (comment_count >= 0)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_featured_post_fk'
  ) then
    alter table meme.profiles
      add constraint profiles_featured_post_fk
      foreign key (featured_post_id)
      references meme.posts (id)
      on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'play_sessions_created_post_fk'
  ) then
    alter table meme.play_sessions
      add constraint play_sessions_created_post_fk
      foreign key (created_post_id)
      references meme.posts (id)
      on delete set null;
  end if;
end
$$;

create table if not exists meme.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references meme.posts (id) on delete cascade,
  media_type text not null,
  storage_path text not null,
  mime_type text not null,
  width integer,
  height integer,
  duration_seconds integer,
  poster_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint post_media_type_check check (media_type in ('image', 'video')),
  constraint post_media_dimensions_check check (
    (width is null or width > 0) and
    (height is null or height > 0)
  ),
  constraint post_media_duration_check check (duration_seconds is null or duration_seconds > 0)
);

create table if not exists meme.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references meme.posts (id) on delete cascade,
  author_user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_comments_content_length_check check (char_length(content) between 1 and 1000)
);

create table if not exists meme.comment_media (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references meme.post_comments (id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  width integer,
  height integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint comment_media_mime_type_check check (
    mime_type in ('image/png', 'image/jpeg', 'image/webp')
  ),
  constraint comment_media_dimensions_check check (
    (width is null or width > 0) and
    (height is null or height > 0)
  )
);

create table if not exists meme.post_likes (
  post_id uuid not null references meme.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists meme.follows (
  follower_user_id uuid not null references auth.users (id) on delete cascade,
  following_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_user_id, following_user_id),
  constraint follows_no_self_follow check (follower_user_id <> following_user_id)
);

create index if not exists stage_progress_user_recent_idx
  on meme.stage_progress (user_id, unlocked_at desc);

create index if not exists play_sessions_user_recent_idx
  on meme.play_sessions (user_id, created_at desc);

create index if not exists play_sessions_stage_score_idx
  on meme.play_sessions (stage_id, score desc, created_at desc);

create index if not exists posts_author_recent_idx
  on meme.posts (author_user_id, published_at desc)
  where deleted_at is null;

create index if not exists posts_latest_feed_idx
  on meme.posts (published_at desc)
  where deleted_at is null;

create index if not exists posts_popular_feed_idx
  on meme.posts (like_count desc, comment_count desc, published_at desc)
  where deleted_at is null;

create index if not exists post_media_post_sort_idx
  on meme.post_media (post_id, sort_order);

create index if not exists post_comments_post_recent_idx
  on meme.post_comments (post_id, created_at desc)
  where deleted_at is null;

create index if not exists comment_media_comment_sort_idx
  on meme.comment_media (comment_id, sort_order);

create index if not exists follows_following_idx
  on meme.follows (following_user_id, follower_user_id);

create or replace function meme.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  stage_one_id uuid;
  candidate_name text;
  candidate_handle text;
begin
  candidate_name :=
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1),
      'player'
    );

  candidate_handle :=
    left(
      concat(
        coalesce(
          nullif(
            regexp_replace(
              lower(
                coalesce(
                  split_part(new.email, '@', 1),
                  candidate_name
                )
              ),
              '[^a-z0-9]+',
              '-',
              'g'
            ),
            ''
          ),
          'player'
        ),
        '-',
        right(replace(new.id::text, '-', ''), 6)
      ),
      24
    );

  insert into meme.profiles (
    user_id,
    handle,
    display_name,
    avatar_url
  )
  values (
    new.id,
    candidate_handle,
    left(candidate_name, 40),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do nothing;

  select id
    into stage_one_id
  from meme.stages
  where stage_number = 1
  limit 1;

  if stage_one_id is not null then
    insert into meme.stage_progress (
      user_id,
      stage_id,
      unlocked_at
    )
    values (
      new.id,
      stage_one_id,
      now()
    )
    on conflict (user_id, stage_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure meme.handle_new_user();

create or replace function meme.refresh_post_counters()
returns trigger
language plpgsql
set search_path = meme, public
as $$
begin
  if tg_table_name = 'post_likes' then
    update meme.posts
    set like_count = (
      select count(*)
      from meme.post_likes
      where post_id = coalesce(new.post_id, old.post_id)
    ),
    updated_at = now()
    where id = coalesce(new.post_id, old.post_id);
  elsif tg_table_name = 'post_comments' then
    update meme.posts
    set comment_count = (
      select count(*)
      from meme.post_comments
      where post_id = coalesce(new.post_id, old.post_id)
        and deleted_at is null
    ),
    updated_at = now()
    where id = coalesce(new.post_id, old.post_id);
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists refresh_post_like_counters on meme.post_likes;
create trigger refresh_post_like_counters
  after insert or delete on meme.post_likes
  for each row execute procedure meme.refresh_post_counters();

drop trigger if exists refresh_post_comment_counters on meme.post_comments;
create trigger refresh_post_comment_counters
  after insert or update or delete on meme.post_comments
  for each row execute procedure meme.refresh_post_counters();

create or replace function meme.sync_stage_progress_from_play_session()
returns trigger
language plpgsql
set search_path = meme, public
as $$
declare
  clear_score smallint;
  next_stage_id uuid;
  current_stage_number integer;
begin
  insert into meme.stage_progress (
    user_id,
    stage_id,
    best_score,
    attempt_count,
    unlocked_at,
    last_attempted_at
  )
  values (
    new.user_id,
    new.stage_id,
    new.score,
    1,
    now(),
    new.attempt_finished_at
  )
  on conflict (user_id, stage_id) do update
    set best_score = greatest(meme.stage_progress.best_score, excluded.best_score),
        attempt_count = meme.stage_progress.attempt_count + 1,
        last_attempted_at = excluded.last_attempted_at,
        updated_at = now();

  select min_score_to_clear, stage_number
    into clear_score, current_stage_number
  from meme.stages
  where id = new.stage_id;

  if new.score >= clear_score then
    update meme.stage_progress
    set cleared_at = coalesce(cleared_at, new.attempt_finished_at),
        updated_at = now()
    where user_id = new.user_id
      and stage_id = new.stage_id;

    select id
      into next_stage_id
    from meme.stages
    where stage_number = current_stage_number + 1
      and is_active = true
    limit 1;

    if next_stage_id is not null then
      insert into meme.stage_progress (
        user_id,
        stage_id,
        unlocked_at
      )
      values (
        new.user_id,
        next_stage_id,
        now()
      )
      on conflict (user_id, stage_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

create or replace function meme.create_post_with_media(
  p_post_type text,
  p_caption text default '',
  p_storage_path text default null,
  p_media_type text default null,
  p_mime_type text default null,
  p_poster_path text default null
)
returns uuid
language plpgsql
set search_path = meme, public
as $$
declare
  v_user_id uuid;
  v_post_id uuid := gen_random_uuid();
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into meme.posts (
    id,
    author_user_id,
    post_type,
    caption
  )
  values (
    v_post_id,
    v_user_id,
    p_post_type,
    coalesce(p_caption, '')
  );

  if p_storage_path is not null and p_media_type is not null and p_mime_type is not null then
    insert into meme.post_media (
      post_id,
      media_type,
      storage_path,
      mime_type,
      poster_path,
      sort_order
    )
    values (
      v_post_id,
      p_media_type,
      p_storage_path,
      p_mime_type,
      p_poster_path,
      0
    );
  end if;

  return v_post_id;
end;
$$;

create or replace function meme.publish_play_session(
  p_session_id uuid,
  p_caption text,
  p_video_path text,
  p_video_mime_type text,
  p_poster_path text default null
)
returns uuid
language plpgsql
set search_path = meme, public
as $$
declare
  v_user_id uuid;
  v_post_id uuid := gen_random_uuid();
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from meme.play_sessions
    where id = p_session_id
      and user_id = v_user_id
  ) then
    raise exception 'Play session not found for current user';
  end if;

  insert into meme.posts (
    id,
    author_user_id,
    post_type,
    source_play_session_id,
    caption
  )
  values (
    v_post_id,
    v_user_id,
    'play_video',
    p_session_id,
    coalesce(p_caption, '')
  );

  insert into meme.post_media (
    post_id,
    media_type,
    storage_path,
    mime_type,
    poster_path,
    sort_order
  )
  values (
    v_post_id,
    'video',
    p_video_path,
    p_video_mime_type,
    p_poster_path,
    0
  );

  update meme.play_sessions
  set uploaded_video_path = p_video_path,
      uploaded_thumbnail_path = p_poster_path,
      uploaded_at = now(),
      created_post_id = v_post_id
  where id = p_session_id
    and user_id = v_user_id;

  return v_post_id;
end;
$$;

drop trigger if exists sync_stage_progress_after_play on meme.play_sessions;
create trigger sync_stage_progress_after_play
  after insert on meme.play_sessions
  for each row execute procedure meme.sync_stage_progress_from_play_session();

drop trigger if exists set_profiles_updated_at on meme.profiles;
create trigger set_profiles_updated_at
  before update on meme.profiles
  for each row execute procedure meme.set_updated_at();

drop trigger if exists set_meme_assets_updated_at on meme.meme_assets;
create trigger set_meme_assets_updated_at
  before update on meme.meme_assets
  for each row execute procedure meme.set_updated_at();

drop trigger if exists set_stages_updated_at on meme.stages;
create trigger set_stages_updated_at
  before update on meme.stages
  for each row execute procedure meme.set_updated_at();

drop trigger if exists set_stage_progress_updated_at on meme.stage_progress;
create trigger set_stage_progress_updated_at
  before update on meme.stage_progress
  for each row execute procedure meme.set_updated_at();

drop trigger if exists set_posts_updated_at on meme.posts;
create trigger set_posts_updated_at
  before update on meme.posts
  for each row execute procedure meme.set_updated_at();

drop trigger if exists set_post_comments_updated_at on meme.post_comments;
create trigger set_post_comments_updated_at
  before update on meme.post_comments
  for each row execute procedure meme.set_updated_at();

create or replace view meme.profile_stats
with (security_invoker = true) as
select
  p.user_id,
  count(distinct po.id) filter (where po.deleted_at is null) as post_count,
  count(distinct f1.follower_user_id) as follower_count,
  count(distinct f2.following_user_id) as following_count,
  coalesce(max(ps.score), 0) as best_score,
  count(distinct ps.id) as total_play_count,
  count(distinct ps.id) filter (where ps.uploaded_at is not null) as uploaded_play_count,
  max(ps.attempt_finished_at) as last_played_at
from meme.profiles p
left join meme.posts po
  on po.author_user_id = p.user_id
left join meme.follows f1
  on f1.following_user_id = p.user_id
left join meme.follows f2
  on f2.follower_user_id = p.user_id
left join meme.play_sessions ps
  on ps.user_id = p.user_id
group by p.user_id;

create or replace function meme.list_public_profile_stats(p_user_ids uuid[])
returns table (
  user_id uuid,
  post_count bigint,
  follower_count bigint,
  following_count bigint,
  best_score integer,
  total_play_count bigint,
  uploaded_play_count bigint,
  last_played_at timestamptz
)
language sql
security definer
set search_path = meme, public
as $$
  select
    p.user_id,
    count(distinct po.id) filter (where po.deleted_at is null) as post_count,
    count(distinct f1.follower_user_id) as follower_count,
    count(distinct f2.following_user_id) as following_count,
    coalesce(max(ps.score), 0) as best_score,
    count(distinct ps.id) as total_play_count,
    count(distinct ps.id) filter (where ps.uploaded_at is not null) as uploaded_play_count,
    max(ps.attempt_finished_at) as last_played_at
  from meme.profiles p
  left join meme.posts po
    on po.author_user_id = p.user_id
  left join meme.follows f1
    on f1.following_user_id = p.user_id
  left join meme.follows f2
    on f2.follower_user_id = p.user_id
  left join meme.play_sessions ps
    on ps.user_id = p.user_id
  where p.user_id = any(p_user_ids)
  group by p.user_id;
$$;

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
  st.title as stage_title
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

grant usage on schema meme to anon, authenticated, service_role;
grant select on all tables in schema meme to anon, authenticated, service_role;
grant insert, update, delete on all tables in schema meme to authenticated, service_role;
alter default privileges in schema meme grant select on tables to anon, authenticated, service_role;
alter default privileges in schema meme grant insert, update, delete on tables to authenticated, service_role;
alter role authenticator set pgrst.db_schemas = 'public,graphql_public,meme';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';

alter table meme.profiles enable row level security;
alter table meme.meme_assets enable row level security;
alter table meme.stages enable row level security;
alter table meme.stage_progress enable row level security;
alter table meme.play_sessions enable row level security;
alter table meme.posts enable row level security;
alter table meme.post_media enable row level security;
alter table meme.post_comments enable row level security;
alter table meme.comment_media enable row level security;
alter table meme.post_likes enable row level security;
alter table meme.follows enable row level security;

drop policy if exists profiles_public_read on meme.profiles;
create policy profiles_public_read
  on meme.profiles
  for select
  using (true);

drop policy if exists profiles_insert_own on meme.profiles;
create policy profiles_insert_own
  on meme.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists profiles_update_own on meme.profiles;
create policy profiles_update_own
  on meme.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists meme_assets_public_read on meme.meme_assets;
create policy meme_assets_public_read
  on meme.meme_assets
  for select
  using (is_active = true);

drop policy if exists stages_public_read on meme.stages;
create policy stages_public_read
  on meme.stages
  for select
  using (is_active = true);

drop policy if exists stage_progress_select_own on meme.stage_progress;
create policy stage_progress_select_own
  on meme.stage_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists stage_progress_insert_own on meme.stage_progress;
create policy stage_progress_insert_own
  on meme.stage_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists stage_progress_update_own on meme.stage_progress;
create policy stage_progress_update_own
  on meme.stage_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists play_sessions_select_own on meme.play_sessions;
create policy play_sessions_select_own
  on meme.play_sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists play_sessions_insert_own on meme.play_sessions;
create policy play_sessions_insert_own
  on meme.play_sessions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists play_sessions_update_own on meme.play_sessions;
create policy play_sessions_update_own
  on meme.play_sessions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists posts_public_read on meme.posts;
create policy posts_public_read
  on meme.posts
  for select
  using (deleted_at is null);

drop policy if exists posts_insert_own on meme.posts;
create policy posts_insert_own
  on meme.posts
  for insert
  to authenticated
  with check ((select auth.uid()) = author_user_id);

drop policy if exists posts_update_own on meme.posts;
create policy posts_update_own
  on meme.posts
  for update
  to authenticated
  using ((select auth.uid()) = author_user_id)
  with check ((select auth.uid()) = author_user_id);

drop policy if exists posts_delete_own on meme.posts;
create policy posts_delete_own
  on meme.posts
  for delete
  to authenticated
  using ((select auth.uid()) = author_user_id);

drop policy if exists post_media_public_read on meme.post_media;
create policy post_media_public_read
  on meme.post_media
  for select
  using (
    exists (
      select 1
      from meme.posts po
      where po.id = post_id
        and po.deleted_at is null
    )
  );

drop policy if exists post_media_insert_own_post on meme.post_media;
create policy post_media_insert_own_post
  on meme.post_media
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from meme.posts po
      where po.id = post_id
        and po.author_user_id = (select auth.uid())
    )
  );

drop policy if exists post_media_update_own_post on meme.post_media;
create policy post_media_update_own_post
  on meme.post_media
  for update
  to authenticated
  using (
    exists (
      select 1
      from meme.posts po
      where po.id = post_id
        and po.author_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from meme.posts po
      where po.id = post_id
        and po.author_user_id = (select auth.uid())
    )
  );

drop policy if exists post_media_delete_own_post on meme.post_media;
create policy post_media_delete_own_post
  on meme.post_media
  for delete
  to authenticated
  using (
    exists (
      select 1
      from meme.posts po
      where po.id = post_id
        and po.author_user_id = (select auth.uid())
    )
  );

drop policy if exists post_comments_public_read on meme.post_comments;
create policy post_comments_public_read
  on meme.post_comments
  for select
  using (deleted_at is null);

drop policy if exists post_comments_insert_own on meme.post_comments;
create policy post_comments_insert_own
  on meme.post_comments
  for insert
  to authenticated
  with check ((select auth.uid()) = author_user_id);

drop policy if exists post_comments_update_own on meme.post_comments;
create policy post_comments_update_own
  on meme.post_comments
  for update
  to authenticated
  using ((select auth.uid()) = author_user_id)
  with check ((select auth.uid()) = author_user_id);

drop policy if exists post_comments_delete_own on meme.post_comments;
create policy post_comments_delete_own
  on meme.post_comments
  for delete
  to authenticated
  using ((select auth.uid()) = author_user_id);

drop policy if exists comment_media_public_read on meme.comment_media;
create policy comment_media_public_read
  on meme.comment_media
  for select
  using (
    exists (
      select 1
      from meme.post_comments pc
      where pc.id = comment_id
        and pc.deleted_at is null
    )
  );

drop policy if exists comment_media_insert_own_comment on meme.comment_media;
create policy comment_media_insert_own_comment
  on meme.comment_media
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from meme.post_comments pc
      where pc.id = comment_id
        and pc.author_user_id = (select auth.uid())
        and pc.deleted_at is null
    )
  );

drop policy if exists comment_media_update_own_comment on meme.comment_media;
create policy comment_media_update_own_comment
  on meme.comment_media
  for update
  to authenticated
  using (
    exists (
      select 1
      from meme.post_comments pc
      where pc.id = comment_id
        and pc.author_user_id = (select auth.uid())
        and pc.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from meme.post_comments pc
      where pc.id = comment_id
        and pc.author_user_id = (select auth.uid())
        and pc.deleted_at is null
    )
  );

drop policy if exists comment_media_delete_own_comment on meme.comment_media;
create policy comment_media_delete_own_comment
  on meme.comment_media
  for delete
  to authenticated
  using (
    exists (
      select 1
      from meme.post_comments pc
      where pc.id = comment_id
        and pc.author_user_id = (select auth.uid())
        and pc.deleted_at is null
    )
  );

drop policy if exists post_likes_public_read on meme.post_likes;
create policy post_likes_public_read
  on meme.post_likes
  for select
  using (true);

drop policy if exists post_likes_insert_own on meme.post_likes;
create policy post_likes_insert_own
  on meme.post_likes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists post_likes_delete_own on meme.post_likes;
create policy post_likes_delete_own
  on meme.post_likes
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists follows_public_read on meme.follows;
create policy follows_public_read
  on meme.follows
  for select
  using (true);

drop policy if exists follows_insert_own on meme.follows;
create policy follows_insert_own
  on meme.follows
  for insert
  to authenticated
  with check ((select auth.uid()) = follower_user_id);

drop policy if exists follows_delete_own on meme.follows;
create policy follows_delete_own
  on meme.follows
  for delete
  to authenticated
  using ((select auth.uid()) = follower_user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('meme-assets', 'meme-assets', true, 20971520, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/webm', 'video/mp4']),
  ('post-media', 'post-media', true, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'video/webm', 'video/mp4']),
  ('dm-media', 'dm-media', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read
  on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists meme_assets_public_read on storage.objects;
create policy meme_assets_public_read
  on storage.objects
  for select
  using (bucket_id = 'meme-assets');

drop policy if exists meme_assets_write_service_role on storage.objects;
create policy meme_assets_write_service_role
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'meme-assets')
  with check (bucket_id = 'meme-assets');

drop policy if exists post_media_public_read on storage.objects;
create policy post_media_public_read
  on storage.objects
  for select
  using (bucket_id = 'post-media');

drop policy if exists post_media_insert_own on storage.objects;
create policy post_media_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists post_media_update_own on storage.objects;
create policy post_media_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists post_media_delete_own on storage.objects;
create policy post_media_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create or replace function meme.dm_media_conversation_id(storage_path text)
returns uuid
language sql
immutable
set search_path = meme, public
as $$
  select case
    when split_part(coalesce(storage_path, ''), '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(storage_path, '/', 1)::uuid
    else null
  end;
$$;

create or replace function meme.can_access_dm_media(storage_path text)
returns boolean
language sql
stable
security definer
set search_path = meme, public
as $$
  select coalesce(
    meme.is_conversation_participant(meme.dm_media_conversation_id(storage_path)),
    false
  );
$$;

drop policy if exists dm_media_select_participants on storage.objects;
create policy dm_media_select_participants
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'dm-media'
    and meme.can_access_dm_media(name)
  );

drop policy if exists dm_media_insert_own on storage.objects;
create policy dm_media_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'dm-media'
    and meme.can_access_dm_media(name)
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

drop policy if exists dm_media_update_own on storage.objects;
create policy dm_media_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'dm-media'
    and meme.can_access_dm_media(name)
    and (storage.foldername(name))[2] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'dm-media'
    and meme.can_access_dm_media(name)
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

drop policy if exists dm_media_delete_own on storage.objects;
create policy dm_media_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'dm-media'
    and meme.can_access_dm_media(name)
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );

insert into meme.meme_assets (
  slug,
  title,
  asset_type,
  storage_path,
  overlay_preset,
  sort_order,
  is_active
)
values
  (
    'spotlight-burst',
    'Spotlight Burst',
    'image',
    'meme-assets/spotlight-burst/v1/spotlight-burst.png',
    '{"anchor":"upper_body","scale":1.1,"offsetX":0,"offsetY":-18}'::jsonb,
    1,
    true
  ),
  (
    'comic-freeze',
    'Comic Freeze',
    'image',
    'meme-assets/comic-freeze/v1/comic-freeze.png',
    '{"anchor":"head","scale":0.9,"offsetX":6,"offsetY":-10}'::jsonb,
    2,
    true
  ),
  (
    'glitch-crown',
    'Glitch Crown',
    'image',
    'meme-assets/glitch-crown/v1/glitch-crown.png',
    '{"anchor":"head","scale":0.75,"offsetX":0,"offsetY":-32}'::jsonb,
    3,
    true
  ),
  (
    'laser-hands',
    'Laser Hands',
    'image',
    'meme-assets/laser-hands/v1/laser-hands.png',
    '{"anchor":"hands","scale":1.2,"offsetX":0,"offsetY":0}'::jsonb,
    4,
    true
  ),
  (
    'arcade-shock',
    'Arcade Shock',
    'image',
    'meme-assets/arcade-shock/v1/arcade-shock.png',
    '{"anchor":"torso","scale":1.0,"offsetX":0,"offsetY":0}'::jsonb,
    5,
    true
  ),
  (
    'winner-mask',
    'Winner Mask',
    'image',
    'meme-assets/winner-mask/v1/winner-mask.png',
    '{"anchor":"face","scale":0.85,"offsetX":0,"offsetY":0}'::jsonb,
    6,
    true
  ),
  (
    'combo-rain',
    'Combo Rain',
    'animated_image',
    'meme-assets/combo-rain/v1/combo-rain.gif',
    '{"anchor":"full_body","scale":1.15,"offsetX":0,"offsetY":0}'::jsonb,
    7,
    true
  ),
  (
    'sticker-siren',
    'Sticker Siren',
    'sticker',
    'meme-assets/sticker-siren/v1/sticker-siren.webp',
    '{"anchor":"upper_body","scale":1.0,"offsetX":-12,"offsetY":-8}'::jsonb,
    8,
    true
  ),
  (
    'flash-grid',
    'Flash Grid',
    'image',
    'meme-assets/flash-grid/v1/flash-grid.png',
    '{"anchor":"full_body","scale":1.05,"offsetX":0,"offsetY":0}'::jsonb,
    9,
    true
  ),
  (
    'final-boss',
    'Final Boss',
    'image',
    'meme-assets/final-boss/v1/final-boss.png',
    '{"anchor":"full_body","scale":1.2,"offsetX":0,"offsetY":0}'::jsonb,
    10,
    true
  )
on conflict (slug) do update
set title = excluded.title,
    asset_type = excluded.asset_type,
    storage_path = excluded.storage_path,
    overlay_preset = excluded.overlay_preset,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = now();

with seeded_stages as (
  select *
  from (
    values
      (1, 'warmup-hype', 'Warmup Hype', 'Open your chest and raise both hands into the spotlight.', 'Raise both arms above your shoulders and hold the pose.', 12, 68, 'spotlight-burst', '{"targetPoseKey":"arms_up","holdMs":650,"weights":{"arms":40,"torso":25,"balance":15,"hold":20}}'::jsonb),
      (2, 'side-pop', 'Side Pop', 'Lean left with one arm out for a quick meme snap.', 'Shift your torso left and extend your right arm.', 12, 70, 'comic-freeze', '{"targetPoseKey":"side_pop_left","holdMs":700,"weights":{"arms":30,"torso":35,"legs":15,"hold":20}}'::jsonb),
      (3, 'crown-lock', 'Crown Lock', 'Stack your wrists near your head like a frozen victory crown.', 'Bring both wrists near your head and stay centered.', 12, 72, 'glitch-crown', '{"targetPoseKey":"crown_lock","holdMs":750,"weights":{"arms":35,"torso":20,"center":20,"hold":25}}'::jsonb),
      (4, 'laser-point', 'Laser Point', 'Point hard to the right while staying low.', 'Bend your knees slightly and point your arm to the right.', 13, 74, 'laser-hands', '{"targetPoseKey":"laser_point","holdMs":800,"weights":{"arms":35,"legs":20,"torso":20,"hold":25}}'::jsonb),
      (5, 'shock-freeze', 'Shock Freeze', 'Hands to cheeks, elbows out, hold the meme reaction.', 'Lift both hands to cheek level and widen elbows.', 13, 76, 'arcade-shock', '{"targetPoseKey":"shock_face","holdMs":850,"weights":{"arms":30,"head":20,"torso":20,"hold":30}}'::jsonb),
      (6, 'winner-frame', 'Winner Frame', 'Make a frame around your face and stand tall.', 'Raise both hands to frame your face with a straight torso.', 13, 78, 'winner-mask', '{"targetPoseKey":"winner_frame","holdMs":900,"weights":{"arms":40,"head":15,"balance":15,"hold":30}}'::jsonb),
      (7, 'combo-drop', 'Combo Drop', 'Drop into a low stance and flare your arms.', 'Lower your hips, widen your stance, and flare both arms.', 14, 80, 'combo-rain', '{"targetPoseKey":"combo_drop","holdMs":950,"weights":{"legs":35,"arms":25,"torso":15,"hold":25}}'::jsonb),
      (8, 'siren-twist', 'Siren Twist', 'Twist your shoulders while keeping one hand high.', 'Rotate your torso and keep one arm lifted above shoulder height.', 14, 82, 'sticker-siren', '{"targetPoseKey":"siren_twist","holdMs":1000,"weights":{"torso":35,"arms":25,"balance":15,"hold":25}}'::jsonb),
      (9, 'flash-cross', 'Flash Cross', 'Cross your arms in front of your body and lock the stance.', 'Cross both arms over your torso and stay centered.', 15, 84, 'flash-grid', '{"targetPoseKey":"flash_cross","holdMs":1100,"weights":{"arms":35,"torso":25,"center":10,"hold":30}}'::jsonb),
      (10, 'boss-finish', 'Boss Finish', 'Hit the full-body finale pose and own the frame.', 'Extend one arm high, one arm low, and lock your stance.', 15, 88, 'final-boss', '{"targetPoseKey":"boss_finish","holdMs":1200,"weights":{"arms":30,"legs":20,"torso":15,"hold":35}}'::jsonb)
  ) as s(stage_number, slug, title, description, instruction_text, time_limit_seconds, min_score_to_clear, success_meme_slug, rule_config)
)
insert into meme.stages (
  stage_number,
  slug,
  title,
  description,
  instruction_text,
  time_limit_seconds,
  min_score_to_clear,
  rule_config,
  success_meme_asset_id,
  is_active
)
select
  s.stage_number,
  s.slug,
  s.title,
  s.description,
  s.instruction_text,
  s.time_limit_seconds,
  s.min_score_to_clear,
  s.rule_config,
  ma.id,
  true
from seeded_stages s
join meme.meme_assets ma
  on ma.slug = s.success_meme_slug
on conflict (slug) do update
set stage_number = excluded.stage_number,
    title = excluded.title,
    description = excluded.description,
    instruction_text = excluded.instruction_text,
    time_limit_seconds = excluded.time_limit_seconds,
    min_score_to_clear = excluded.min_score_to_clear,
    rule_config = excluded.rule_config,
    success_meme_asset_id = excluded.success_meme_asset_id,
    is_active = excluded.is_active,
    updated_at = now();

insert into meme.profiles (
  user_id,
  handle,
  display_name,
  avatar_url
)
select
  u.id,
  left(
    concat(
      coalesce(
        nullif(
          regexp_replace(
            lower(split_part(u.email, '@', 1)),
            '[^a-z0-9]+',
            '-',
            'g'
          ),
          ''
        ),
        'player'
      ),
      '-',
      right(replace(u.id::text, '-', ''), 6)
    ),
    24
  ),
  left(
    coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name',
      split_part(u.email, '@', 1),
      'player'
    ),
    40
  ),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (user_id) do update
set handle = coalesce(meme.profiles.handle, excluded.handle),
    avatar_url = coalesce(excluded.avatar_url, meme.profiles.avatar_url);

insert into meme.stage_progress (
  user_id,
  stage_id,
  unlocked_at
)
select
  u.id,
  s.id,
  now()
from auth.users u
cross join lateral (
  select id
  from meme.stages
  where stage_number = 1
  limit 1
) s
on conflict (user_id, stage_id) do nothing;

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
  body text not null default '',
  media_storage_path text,
  media_mime_type text,
  media_width integer,
  media_height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint messages_type_check check (message_type in ('text', 'image')),
  constraint messages_body_length_check check (
    (
      message_type = 'text'
      and char_length(trim(body)) between 1 and 4000
    )
    or (
      message_type = 'image'
      and char_length(trim(body)) <= 4000
    )
  ),
  constraint messages_media_requirements_check check (
    (
      message_type = 'text'
      and media_storage_path is null
      and media_mime_type is null
      and media_width is null
      and media_height is null
    )
    or (
      message_type = 'image'
      and media_storage_path is not null
      and media_mime_type in ('image/png', 'image/jpeg', 'image/webp')
    )
  )
);

create table if not exists meme.credit_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_wallets_balance_check check (balance >= 0)
);

create table if not exists meme.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  balance_after integer not null,
  reason text not null,
  reference_type text not null default 'manual',
  reference_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint credit_ledger_balance_after_check check (balance_after >= 0)
);

create table if not exists meme.conversation_requests (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references meme.conversations (id) on delete cascade,
  requester_user_id uuid not null references auth.users (id) on delete cascade,
  target_user_id uuid not null references auth.users (id) on delete cascade,
  intent text not null,
  theme text not null default 'default',
  credits_spent integer not null default 0,
  opening_message text not null default '',
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversation_requests_intent_check check (intent in ('dating_intro', 'brand_collab')),
  constraint conversation_requests_status_check check (status in ('sent', 'accepted', 'rejected', 'expired', 'refunded')),
  constraint conversation_requests_credits_spent_check check (credits_spent >= 0)
);

create index if not exists credit_ledger_user_recent_idx
  on meme.credit_ledger (user_id, created_at desc);

create index if not exists conversation_requests_requester_recent_idx
  on meme.conversation_requests (requester_user_id, created_at desc);

create index if not exists conversation_requests_target_recent_idx
  on meme.conversation_requests (target_user_id, created_at desc);

create index if not exists conversation_requests_conversation_recent_idx
  on meme.conversation_requests (conversation_id, created_at desc);

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

create table if not exists meme.email_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null,
  notification_key text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  recipient_email text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_notifications_status_check check (status in ('queued', 'sent', 'failed'))
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

create index if not exists email_notifications_user_recent_idx
  on meme.email_notifications (user_id, created_at desc);

create index if not exists email_notifications_status_recent_idx
  on meme.email_notifications (status, created_at desc);

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
  preview_text text;
begin
  target_conversation_id := coalesce(new.conversation_id, old.conversation_id);

  select id, body, created_at, message_type
    into latest_message
  from meme.messages
  where conversation_id = target_conversation_id
    and deleted_at is null
  order by created_at desc
  limit 1;

  preview_text := case
    when latest_message.id is null then ''
    when latest_message.message_type = 'image' and char_length(trim(coalesce(latest_message.body, ''))) = 0
      then 'Photo'
    when latest_message.message_type = 'image'
      then left(trim(latest_message.body), 160)
    else coalesce(left(latest_message.body, 160), '')
  end;

  update meme.conversations
  set last_message_id = latest_message.id,
      last_message_preview = preview_text,
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

create or replace function meme.get_viewer_credit_balance()
returns integer
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_user_id uuid;
  v_balance integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into meme.credit_wallets (user_id, balance)
  values (v_user_id, 0)
  on conflict (user_id) do nothing;

  select balance
    into v_balance
  from meme.credit_wallets
  where user_id = v_user_id;

  return coalesce(v_balance, 0);
end;
$$;

create or replace function meme.purchase_mock_credits(
  p_credits integer,
  p_package_id text default null
)
returns integer
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_user_id uuid;
  v_balance integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_credits is null or p_credits <= 0 then
    raise exception 'A positive credit amount is required';
  end if;

  insert into meme.credit_wallets (user_id, balance)
  values (v_user_id, 0)
  on conflict (user_id) do nothing;

  update meme.credit_wallets
  set balance = balance + p_credits,
      updated_at = now()
  where user_id = v_user_id
  returning balance into v_balance;

  insert into meme.credit_ledger (
    user_id,
    delta,
    balance_after,
    reason,
    reference_type,
    metadata
  )
  values (
    v_user_id,
    p_credits,
    v_balance,
    'mock_purchase',
    'credit_package',
    jsonb_build_object(
      'package_id', p_package_id,
      'credits', p_credits
    )
  );

  return v_balance;
end;
$$;

create or replace function meme.start_special_conversation(
  p_other_user_id uuid,
  p_intent text,
  p_theme text default null,
  p_opening_message text default ''
)
returns table (
  conversation_id uuid,
  request_id uuid,
  balance integer
)
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_user_id uuid;
  v_conversation_id uuid;
  v_request_id uuid;
  v_current_balance integer;
  v_cost integer;
  v_theme text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_other_user_id is null or p_other_user_id = v_user_id then
    raise exception 'A different recipient is required';
  end if;

  if p_intent not in ('dating_intro', 'brand_collab') then
    raise exception 'Unsupported special DM intent';
  end if;

  v_cost := case
    when p_intent = 'dating_intro' then 20
    when p_intent = 'brand_collab' then 50
    else 0
  end;

  v_theme := case
    when p_theme is not null and char_length(trim(p_theme)) > 0 then trim(p_theme)
    when p_intent = 'dating_intro' then 'blossom'
    when p_intent = 'brand_collab' then 'brand-dark'
    else 'default'
  end;

  insert into meme.credit_wallets (user_id, balance)
  values (v_user_id, 0)
  on conflict (user_id) do nothing;

  select cw.balance
    into v_current_balance
  from meme.credit_wallets cw
  where cw.user_id = v_user_id
  for update;

  if coalesce(v_current_balance, 0) < v_cost then
    raise exception 'Not enough credits';
  end if;

  v_conversation_id := meme.get_or_create_direct_conversation(p_other_user_id);

  select id
    into v_request_id
  from meme.conversation_requests cr
  where cr.conversation_id = v_conversation_id
    and cr.requester_user_id = v_user_id
    and cr.target_user_id = p_other_user_id
    and cr.intent = p_intent
    and cr.status = 'sent'
  order by cr.created_at desc
  limit 1;

  if v_request_id is null then
    update meme.credit_wallets cw
    set balance = cw.balance - v_cost,
        updated_at = now()
    where cw.user_id = v_user_id
    returning cw.balance into v_current_balance;

    insert into meme.credit_ledger (
      user_id,
      delta,
      balance_after,
      reason,
      reference_type,
      metadata
    )
    values (
      v_user_id,
      -v_cost,
      v_current_balance,
      p_intent || '_send',
      'conversation_request',
      jsonb_build_object(
        'intent', p_intent,
        'target_user_id', p_other_user_id,
        'conversation_id', v_conversation_id
      )
    );

    insert into meme.conversation_requests (
      conversation_id,
      requester_user_id,
      target_user_id,
      intent,
      theme,
      credits_spent,
      opening_message,
      status
    )
    values (
      v_conversation_id,
      v_user_id,
      p_other_user_id,
      p_intent,
      v_theme,
      v_cost,
      coalesce(trim(p_opening_message), ''),
      'sent'
    )
    returning id into v_request_id;
  end if;

  return query
  select v_conversation_id, v_request_id, v_current_balance;
end;
$$;

create or replace function meme.soft_delete_own_post(p_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update meme.posts
  set deleted_at = now()
  where id = p_post_id
    and author_user_id = v_user_id
    and deleted_at is null;

  if not found then
    raise exception 'Post not available';
  end if;

  return true;
end;
$$;

create or replace function meme.soft_delete_own_comment(p_comment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update meme.post_comments
  set deleted_at = now()
  where id = p_comment_id
    and author_user_id = v_user_id
    and deleted_at is null;

  if not found then
    raise exception 'Comment not available';
  end if;

  return true;
end;
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

create or replace function meme.get_dm_email_notification_payload(p_message_id uuid)
returns table (
  recipient_user_id uuid,
  recipient_email text,
  recipient_display_name text,
  sender_display_name text,
  sender_handle text,
  conversation_id uuid,
  message_id uuid,
  message_body text
)
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_requester uuid := auth.uid();
begin
  if v_requester is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    recipient_member.user_id as recipient_user_id,
    recipient_user.email::text as recipient_email,
    recipient_profile.display_name as recipient_display_name,
    sender_profile.display_name as sender_display_name,
    sender_profile.handle as sender_handle,
    message_row.conversation_id,
    message_row.id as message_id,
    message_row.body as message_body
  from meme.messages message_row
  join meme.conversation_members sender_member
    on sender_member.conversation_id = message_row.conversation_id
   and sender_member.user_id = message_row.sender_user_id
  join meme.conversation_members recipient_member
    on recipient_member.conversation_id = message_row.conversation_id
   and recipient_member.user_id <> message_row.sender_user_id
  join auth.users recipient_user
    on recipient_user.id = recipient_member.user_id
  join meme.profiles sender_profile
    on sender_profile.user_id = message_row.sender_user_id
  left join meme.profiles recipient_profile
    on recipient_profile.user_id = recipient_member.user_id
  where message_row.id = p_message_id
    and message_row.sender_user_id = v_requester
    and message_row.deleted_at is null;
end;
$$;

create or replace function meme.get_comment_email_notification_payload(p_comment_id uuid)
returns table (
  recipient_user_id uuid,
  recipient_email text,
  recipient_display_name text,
  commenter_display_name text,
  commenter_handle text,
  comment_id uuid,
  post_id uuid,
  comment_body text
)
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_requester uuid := auth.uid();
begin
  if v_requester is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    post_owner.id as recipient_user_id,
    post_owner.email::text as recipient_email,
    recipient_profile.display_name as recipient_display_name,
    commenter_profile.display_name as commenter_display_name,
    commenter_profile.handle as commenter_handle,
    comment_row.id as comment_id,
    comment_row.post_id,
    comment_row.content as comment_body
  from meme.post_comments comment_row
  join meme.posts post_row
    on post_row.id = comment_row.post_id
  join auth.users post_owner
    on post_owner.id = post_row.author_user_id
  join meme.profiles commenter_profile
    on commenter_profile.user_id = comment_row.author_user_id
  left join meme.profiles recipient_profile
    on recipient_profile.user_id = post_row.author_user_id
  where comment_row.id = p_comment_id
    and comment_row.author_user_id = v_requester
    and comment_row.author_user_id <> post_row.author_user_id
    and comment_row.deleted_at is null
    and post_row.deleted_at is null;
end;
$$;

create or replace function meme.list_unuploaded_success_reminders()
returns table (
  recipient_user_id uuid,
  recipient_email text,
  recipient_display_name text,
  play_session_id uuid,
  stage_title text,
  score smallint
)
language plpgsql
security definer
set search_path = meme, public
as $$
begin
  return query
  select
    owner_user.id as recipient_user_id,
    owner_user.email::text as recipient_email,
    profile_row.display_name as recipient_display_name,
    session_row.id as play_session_id,
    stage_row.title as stage_title,
    session_row.score
  from meme.play_sessions session_row
  join auth.users owner_user
    on owner_user.id = session_row.user_id
  left join meme.profiles profile_row
    on profile_row.user_id = session_row.user_id
  join meme.stages stage_row
    on stage_row.id = session_row.stage_id
  where session_row.success = true
    and session_row.uploaded_at is null
    and session_row.attempt_finished_at < now() - interval '30 minutes'
    and not exists (
      select 1
      from meme.email_notifications log_row
      where log_row.notification_key = 'unpublished-run-reminder/' || session_row.id::text
    );
end;
$$;

create or replace function meme.list_weekly_digest_candidates()
returns table (
  recipient_user_id uuid,
  recipient_email text,
  recipient_display_name text,
  digest_key text,
  dm_count bigint,
  comment_count bigint,
  uploaded_run_count bigint,
  best_score smallint
)
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_week_key text := to_char(now() at time zone 'Asia/Seoul', 'IYYY-IW');
begin
  return query
  with recent_messages as (
    select member.user_id, count(*)::bigint as dm_count
    from meme.messages message_row
    join meme.conversation_members member
      on member.conversation_id = message_row.conversation_id
    where message_row.created_at >= now() - interval '7 days'
      and member.user_id <> message_row.sender_user_id
    group by member.user_id
  ),
  recent_comments as (
    select post_row.author_user_id as user_id, count(*)::bigint as comment_count
    from meme.post_comments comment_row
    join meme.posts post_row
      on post_row.id = comment_row.post_id
    where comment_row.created_at >= now() - interval '7 days'
      and comment_row.deleted_at is null
      and comment_row.author_user_id <> post_row.author_user_id
    group by post_row.author_user_id
  ),
  recent_uploads as (
    select session_row.user_id, count(*)::bigint as uploaded_run_count, max(session_row.score)::smallint as best_score
    from meme.play_sessions session_row
    where session_row.uploaded_at >= now() - interval '7 days'
    group by session_row.user_id
  )
  select
    auth_user.id as recipient_user_id,
    auth_user.email::text as recipient_email,
    profile_row.display_name as recipient_display_name,
    'weekly-digest/' || auth_user.id::text || '/' || v_week_key as digest_key,
    coalesce(recent_messages.dm_count, 0) as dm_count,
    coalesce(recent_comments.comment_count, 0) as comment_count,
    coalesce(recent_uploads.uploaded_run_count, 0) as uploaded_run_count,
    coalesce(recent_uploads.best_score, 0)::smallint as best_score
  from auth.users auth_user
  left join meme.profiles profile_row
    on profile_row.user_id = auth_user.id
  left join recent_messages
    on recent_messages.user_id = auth_user.id
  left join recent_comments
    on recent_comments.user_id = auth_user.id
  left join recent_uploads
    on recent_uploads.user_id = auth_user.id
  where (
    coalesce(recent_messages.dm_count, 0) > 0
    or coalesce(recent_comments.comment_count, 0) > 0
    or coalesce(recent_uploads.uploaded_run_count, 0) > 0
  )
    and not exists (
      select 1
      from meme.email_notifications log_row
      where log_row.notification_key = 'weekly-digest/' || auth_user.id::text || '/' || v_week_key
    );
end;
$$;

create or replace function meme.get_public_play_reference(p_post_id uuid)
returns table (
  post_id uuid,
  author_user_id uuid,
  author_handle text,
  author_display_name text,
  author_avatar_url text,
  caption text,
  video_path text,
  poster_path text,
  stage_id uuid,
  stage_number integer,
  stage_title text
)
language sql
security definer
set search_path = meme, public
as $$
  select
    po.id as post_id,
    po.author_user_id,
    pr.handle as author_handle,
    pr.display_name as author_display_name,
    pr.avatar_url as author_avatar_url,
    po.caption,
    pm.storage_path as video_path,
    pm.poster_path,
    st.id as stage_id,
    st.stage_number,
    st.title as stage_title
  from meme.posts po
  join meme.profiles pr
    on pr.user_id = po.author_user_id
  join meme.play_sessions ps
    on ps.id = po.source_play_session_id
  join meme.stages st
    on st.id = ps.stage_id
  left join lateral (
    select storage_path, poster_path
    from meme.post_media pm
    where pm.post_id = po.id
      and pm.media_type = 'video'
    order by pm.created_at asc
    limit 1
  ) pm on true
  where po.id = p_post_id
    and po.deleted_at is null
    and po.post_type = 'play_video'
  limit 1
$$;

grant execute on function meme.get_public_play_reference(uuid) to anon, authenticated, service_role;

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

drop trigger if exists set_credit_wallets_updated_at on meme.credit_wallets;
create trigger set_credit_wallets_updated_at
  before update on meme.credit_wallets
  for each row execute procedure meme.set_updated_at();

drop trigger if exists set_conversation_requests_updated_at on meme.conversation_requests;
create trigger set_conversation_requests_updated_at
  before update on meme.conversation_requests
  for each row execute procedure meme.set_updated_at();

drop trigger if exists set_post_reports_updated_at on meme.post_reports;
create trigger set_post_reports_updated_at
  before update on meme.post_reports
  for each row execute procedure meme.set_updated_at();

grant execute on function meme.get_or_create_direct_conversation(uuid) to authenticated, service_role;
grant execute on function meme.ensure_direct_conversation(uuid) to authenticated, service_role;
grant execute on function meme.get_viewer_credit_balance() to authenticated, service_role;
grant execute on function meme.purchase_mock_credits(integer, text) to authenticated, service_role;
grant execute on function meme.start_special_conversation(uuid, text, text, text) to authenticated, service_role;
grant execute on function meme.soft_delete_own_post(uuid) to authenticated, service_role;
grant execute on function meme.soft_delete_own_comment(uuid) to authenticated, service_role;
grant execute on function meme.list_public_profile_stats(uuid[]) to anon, authenticated, service_role;
grant execute on function meme.mark_conversation_read(uuid, uuid) to authenticated, service_role;
grant execute on function meme.get_dm_email_notification_payload(uuid) to authenticated, service_role;
grant execute on function meme.get_comment_email_notification_payload(uuid) to authenticated, service_role;
grant execute on function meme.list_unuploaded_success_reminders() to anon, authenticated, service_role;
grant execute on function meme.list_weekly_digest_candidates() to anon, authenticated, service_role;

alter table meme.conversations enable row level security;
alter table meme.conversation_members enable row level security;
alter table meme.messages enable row level security;
alter table meme.credit_wallets enable row level security;
alter table meme.credit_ledger enable row level security;
alter table meme.conversation_requests enable row level security;
alter table meme.post_bookmarks enable row level security;
alter table meme.post_reports enable row level security;
alter table meme.user_blocks enable row level security;
alter table meme.hidden_posts enable row level security;
alter table meme.email_notifications enable row level security;

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

drop policy if exists credit_wallets_select_own on meme.credit_wallets;
create policy credit_wallets_select_own
  on meme.credit_wallets
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists credit_ledger_select_own on meme.credit_ledger;
create policy credit_ledger_select_own
  on meme.credit_ledger
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists conversation_requests_select_participants on meme.conversation_requests;
create policy conversation_requests_select_participants
  on meme.conversation_requests
  for select
  to authenticated
  using (
    requester_user_id = (select auth.uid())
    or target_user_id = (select auth.uid())
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

drop policy if exists email_notifications_internal_all on meme.email_notifications;
create policy email_notifications_internal_all
  on meme.email_notifications
  for all
  using (true)
  with check (true);

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

create index if not exists conversations_created_by_idx
  on meme.conversations (created_by);

create index if not exists conversations_last_message_id_idx
  on meme.conversations (last_message_id);

create index if not exists messages_sender_recent_idx
  on meme.messages (sender_user_id, created_at desc);

create index if not exists conversation_members_last_read_message_idx
  on meme.conversation_members (last_read_message_id);

drop policy if exists conversation_members_update_own_read_state on meme.conversation_members;
drop policy if exists user_blocks_select_related on meme.user_blocks;

create or replace function meme.is_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = meme, public
as $$
  select exists (
    select 1
    from meme.conversation_members
    where conversation_id = target_conversation_id
      and user_id = auth.uid()
  );
$$;

drop policy if exists conversations_select_participant on meme.conversations;
drop policy if exists conversations_select_participants on meme.conversations;
create policy conversations_select_participants
  on meme.conversations
  for select
  to authenticated
  using (meme.is_conversation_participant(id));

drop policy if exists conversation_members_select_participant on meme.conversation_members;
drop policy if exists conversation_members_select_participants on meme.conversation_members;
create policy conversation_members_select_participants
  on meme.conversation_members
  for select
  to authenticated
  using (meme.is_conversation_participant(conversation_id));

drop policy if exists messages_select_participant on meme.messages;
drop policy if exists messages_select_participants on meme.messages;
create policy messages_select_participants
  on meme.messages
  for select
  to authenticated
  using (
    deleted_at is null
    and meme.is_conversation_participant(conversation_id)
  );

drop policy if exists messages_insert_participant on meme.messages;
drop policy if exists messages_insert_participants on meme.messages;
create policy messages_insert_participants
  on meme.messages
  for insert
  to authenticated
  with check (
    sender_user_id = (select auth.uid())
    and meme.is_conversation_participant(conversation_id)
  );

drop policy if exists messages_update_sender on meme.messages;
create policy messages_update_sender
  on meme.messages
  for update
  to authenticated
  using (
    sender_user_id = (select auth.uid())
    and meme.is_conversation_participant(conversation_id)
  )
  with check (
    sender_user_id = (select auth.uid())
    and meme.is_conversation_participant(conversation_id)
  );
