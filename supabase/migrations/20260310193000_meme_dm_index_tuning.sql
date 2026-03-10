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
