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

create index if not exists email_notifications_user_recent_idx
  on meme.email_notifications (user_id, created_at desc);

create index if not exists email_notifications_status_recent_idx
  on meme.email_notifications (status, created_at desc);

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
