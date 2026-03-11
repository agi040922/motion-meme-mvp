import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendDmNotificationEmail } from '@/features/email/server';

export async function POST(request: NextRequest) {
  try {
    const { messageId } = (await request.json()) as { messageId?: string };

    if (!messageId) {
      return NextResponse.json({ error: 'Missing messageId' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient().schema('meme');
    const { data, error } = await supabase.rpc('get_dm_email_notification_payload', {
      p_message_id: messageId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const payload = Array.isArray(data) ? data[0] : data;
    if (!payload?.recipient_email) {
      return NextResponse.json({ skipped: true });
    }

    await sendDmNotificationEmail({
      recipientUserId: payload.recipient_user_id,
      recipientEmail: payload.recipient_email,
      recipientDisplayName: payload.recipient_display_name ?? '',
      senderDisplayName: payload.sender_display_name ?? 'Someone',
      senderHandle: payload.sender_handle ?? 'player',
      conversationId: payload.conversation_id,
      messageId: payload.message_id,
      messageBody: payload.message_body ?? '',
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send DM notification',
      },
      { status: 500 },
    );
  }
}
