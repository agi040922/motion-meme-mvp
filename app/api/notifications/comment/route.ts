import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendCommentNotificationEmail } from '@/features/email/server';

export async function POST(request: NextRequest) {
  try {
    const { commentId } = (await request.json()) as { commentId?: string };

    if (!commentId) {
      return NextResponse.json({ error: 'Missing commentId' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient().schema('meme');
    const { data, error } = await supabase.rpc('get_comment_email_notification_payload', {
      p_comment_id: commentId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const payload = Array.isArray(data) ? data[0] : data;
    if (!payload?.recipient_email) {
      return NextResponse.json({ skipped: true });
    }

    await sendCommentNotificationEmail({
      recipientUserId: payload.recipient_user_id,
      recipientEmail: payload.recipient_email,
      recipientDisplayName: payload.recipient_display_name ?? '',
      commenterDisplayName: payload.commenter_display_name ?? 'Someone',
      commenterHandle: payload.commenter_handle ?? 'player',
      commentId: payload.comment_id,
      postId: payload.post_id,
      commentBody: payload.comment_body ?? '',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send comment notification',
      },
      { status: 500 },
    );
  }
}
