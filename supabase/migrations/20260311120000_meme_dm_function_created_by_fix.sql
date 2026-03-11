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
