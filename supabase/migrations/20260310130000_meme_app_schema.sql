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
  ('post-media', 'post-media', true, 52428800, array['image/png', 'image/jpeg', 'image/webp', 'video/webm', 'video/mp4'])
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
