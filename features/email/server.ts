import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resend } from '@/lib/email/resend';
import { emailConfig } from '@/lib/email/config';
import {
  commentNotificationEmail,
  dmNotificationEmail,
  unpublishedRunReminderEmail,
  weeklyDigestEmail,
} from '@/lib/email/templates';

const getMemeServerClient = () => createServerSupabaseClient().schema('meme');

const buildAppUrl = (path: string) =>
  new URL(path, emailConfig.appBaseUrl).toString();

type EmailNotificationLogInsert = {
  notification_type: string;
  notification_key: string;
  user_id: string | null;
  recipient_email: string;
  payload: Record<string, unknown>;
};

const createNotificationLog = async (input: EmailNotificationLogInsert) => {
  const supabase = getMemeServerClient();
  const { data, error } = await supabase
    .from('email_notifications')
    .insert({
      notification_type: input.notification_type,
      notification_key: input.notification_key,
      user_id: input.user_id,
      recipient_email: input.recipient_email,
      payload: input.payload,
    })
    .select('id')
    .maybeSingle();

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return null;
    }
    throw error;
  }

  return data?.id ?? null;
};

const finalizeNotificationLog = async (
  notificationId: string,
  status: 'sent' | 'failed',
  providerMessageId?: string | null,
  errorMessage?: string | null,
) => {
  const supabase = getMemeServerClient();
  await supabase
    .from('email_notifications')
    .update({
      status,
      provider_message_id: providerMessageId ?? null,
      error_message: errorMessage ?? null,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId);
};

const sendEmail = async (params: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
}) => {
  const response = await resend.emails.send({
    from: emailConfig.fromEmail,
    to: [params.to],
    subject: params.subject,
    html: params.html,
    headers: {
      'Idempotency-Key': params.idempotencyKey,
    },
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.id ?? null;
};

export const sendDmNotificationEmail = async (payload: {
  recipientUserId: string;
  recipientEmail: string;
  recipientDisplayName: string;
  senderDisplayName: string;
  senderHandle: string;
  conversationId: string;
  messageId: string;
  messageBody: string;
}) => {
  const notificationKey = `new-dm/${payload.conversationId}/${payload.messageId}`;
  const notificationId = await createNotificationLog({
    notification_type: 'new_dm',
    notification_key: notificationKey,
    user_id: payload.recipientUserId,
    recipient_email: payload.recipientEmail,
    payload,
  });

  if (!notificationId) {
    return { skipped: true as const };
  }

  try {
    const providerMessageId = await sendEmail({
      to: payload.recipientEmail,
      subject: `${payload.senderDisplayName} sent you a DM`,
      html: dmNotificationEmail({
        recipientDisplayName: payload.recipientDisplayName,
        senderDisplayName: payload.senderDisplayName,
        senderHandle: payload.senderHandle,
        messageBody: payload.messageBody,
        conversationUrl: buildAppUrl(`/messages/${payload.conversationId}`),
      }),
      idempotencyKey: notificationKey,
    });

    await finalizeNotificationLog(notificationId, 'sent', providerMessageId, null);
    return { skipped: false as const };
  } catch (error) {
    await finalizeNotificationLog(
      notificationId,
      'failed',
      null,
      error instanceof Error ? error.message : 'DM notification send failed',
    );
    throw error;
  }
};

export const sendCommentNotificationEmail = async (payload: {
  recipientUserId: string;
  recipientEmail: string;
  recipientDisplayName: string;
  commenterDisplayName: string;
  commenterHandle: string;
  commentId: string;
  postId: string;
  commentBody: string;
}) => {
  const notificationKey = `new-comment/${payload.commentId}`;
  const notificationId = await createNotificationLog({
    notification_type: 'new_comment',
    notification_key: notificationKey,
    user_id: payload.recipientUserId,
    recipient_email: payload.recipientEmail,
    payload,
  });

  if (!notificationId) {
    return { skipped: true as const };
  }

  try {
    const providerMessageId = await sendEmail({
      to: payload.recipientEmail,
      subject: `${payload.commenterDisplayName} commented on your post`,
      html: commentNotificationEmail({
        recipientDisplayName: payload.recipientDisplayName,
        commenterDisplayName: payload.commenterDisplayName,
        commenterHandle: payload.commenterHandle,
        commentBody: payload.commentBody,
        postUrl: buildAppUrl(`/feed#post-${payload.postId}`),
      }),
      idempotencyKey: notificationKey,
    });

    await finalizeNotificationLog(notificationId, 'sent', providerMessageId, null);
    return { skipped: false as const };
  } catch (error) {
    await finalizeNotificationLog(
      notificationId,
      'failed',
      null,
      error instanceof Error ? error.message : 'Comment notification send failed',
    );
    throw error;
  }
};

export const sendUnpublishedRunReminderEmail = async (payload: {
  recipientUserId: string;
  recipientEmail: string;
  recipientDisplayName: string;
  playSessionId: string;
  stageTitle: string;
  score: number;
}) => {
  const notificationKey = `unpublished-run-reminder/${payload.playSessionId}`;
  const notificationId = await createNotificationLog({
    notification_type: 'unuploaded_success_reminder',
    notification_key: notificationKey,
    user_id: payload.recipientUserId,
    recipient_email: payload.recipientEmail,
    payload,
  });

  if (!notificationId) {
    return { skipped: true as const };
  }

  try {
    const providerMessageId = await sendEmail({
      to: payload.recipientEmail,
      subject: `Your ${payload.stageTitle} run is ready to post`,
      html: unpublishedRunReminderEmail({
        recipientDisplayName: payload.recipientDisplayName,
        stageTitle: payload.stageTitle,
        score: payload.score,
        playUrl: buildAppUrl('/play'),
      }),
      idempotencyKey: notificationKey,
    });

    await finalizeNotificationLog(notificationId, 'sent', providerMessageId, null);
    return { skipped: false as const };
  } catch (error) {
    await finalizeNotificationLog(
      notificationId,
      'failed',
      null,
      error instanceof Error ? error.message : 'Reminder send failed',
    );
    throw error;
  }
};

export const sendWeeklyDigestEmail = async (payload: {
  recipientUserId: string;
  recipientEmail: string;
  recipientDisplayName: string;
  digestKey: string;
  dmCount: number;
  commentCount: number;
  uploadedRunCount: number;
  bestScore: number;
}) => {
  const notificationId = await createNotificationLog({
    notification_type: 'weekly_digest',
    notification_key: payload.digestKey,
    user_id: payload.recipientUserId,
    recipient_email: payload.recipientEmail,
    payload,
  });

  if (!notificationId) {
    return { skipped: true as const };
  }

  try {
    const providerMessageId = await sendEmail({
      to: payload.recipientEmail,
      subject: 'Your Motion Meme weekly recap',
      html: weeklyDigestEmail({
        recipientDisplayName: payload.recipientDisplayName,
        dmCount: payload.dmCount,
        commentCount: payload.commentCount,
        uploadedRunCount: payload.uploadedRunCount,
        bestScore: payload.bestScore,
        dashboardUrl: buildAppUrl('/feed'),
      }),
      idempotencyKey: payload.digestKey,
    });

    await finalizeNotificationLog(notificationId, 'sent', providerMessageId, null);
    return { skipped: false as const };
  } catch (error) {
    await finalizeNotificationLog(
      notificationId,
      'failed',
      null,
      error instanceof Error ? error.message : 'Weekly digest send failed',
    );
    throw error;
  }
};
