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
