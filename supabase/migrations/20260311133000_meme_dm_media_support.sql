alter table meme.messages
  add column if not exists media_storage_path text,
  add column if not exists media_mime_type text,
  add column if not exists media_width integer,
  add column if not exists media_height integer;

alter table meme.messages
  alter column body set default '';

alter table meme.messages
  drop constraint if exists messages_type_check;

alter table meme.messages
  add constraint messages_type_check
  check (message_type in ('text', 'image'));

alter table meme.messages
  drop constraint if exists messages_body_length_check;

alter table meme.messages
  add constraint messages_body_length_check
  check (
    (
      message_type = 'text'
      and char_length(trim(body)) between 1 and 4000
    )
    or (
      message_type = 'image'
      and char_length(trim(body)) <= 4000
    )
  );

alter table meme.messages
  drop constraint if exists messages_media_requirements_check;

alter table meme.messages
  add constraint messages_media_requirements_check
  check (
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
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dm-media',
  'dm-media',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

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
