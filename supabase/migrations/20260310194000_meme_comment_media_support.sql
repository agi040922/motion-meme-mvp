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

create index if not exists comment_media_comment_sort_idx
  on meme.comment_media (comment_id, sort_order);

alter table meme.comment_media enable row level security;

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
