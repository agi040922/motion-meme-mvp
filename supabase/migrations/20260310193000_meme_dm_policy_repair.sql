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
