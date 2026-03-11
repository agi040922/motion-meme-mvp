import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendUnpublishedRunReminderEmail } from '@/features/email/server';

export async function POST() {
  try {
    const supabase = createServerSupabaseClient().schema('meme');
    const { data, error } = await supabase.rpc('list_unuploaded_success_reminders');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const reminders = Array.isArray(data) ? data : [];
    for (const reminder of reminders) {
      if (!reminder.recipient_email) {
        continue;
      }

      await sendUnpublishedRunReminderEmail({
        recipientUserId: reminder.recipient_user_id,
        recipientEmail: reminder.recipient_email,
        recipientDisplayName: reminder.recipient_display_name ?? '',
        playSessionId: reminder.play_session_id,
        stageTitle: reminder.stage_title ?? 'Stage run',
        score: reminder.score ?? 0,
      });
    }

    return NextResponse.json({ processed: reminders.length });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process unpublished run reminders',
      },
      { status: 500 },
    );
  }
}
