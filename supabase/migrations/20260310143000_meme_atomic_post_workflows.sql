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
