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

grant execute on function meme.soft_delete_own_post(uuid) to authenticated, service_role;
