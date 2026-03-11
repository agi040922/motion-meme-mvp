import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendWeeklyDigestEmail } from '@/features/email/server';

export async function POST() {
  try {
    const supabase = createServerSupabaseClient().schema('meme');
    const { data, error } = await supabase.rpc('list_weekly_digest_candidates');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const digests = Array.isArray(data) ? data : [];
    for (const digest of digests) {
      if (!digest.recipient_email) {
        continue;
      }

      await sendWeeklyDigestEmail({
        recipientUserId: digest.recipient_user_id,
        recipientEmail: digest.recipient_email,
        recipientDisplayName: digest.recipient_display_name ?? '',
        digestKey: digest.digest_key,
        dmCount: digest.dm_count ?? 0,
        commentCount: digest.comment_count ?? 0,
        uploadedRunCount: digest.uploaded_run_count ?? 0,
        bestScore: digest.best_score ?? 0,
      });
    }

    return NextResponse.json({ processed: digests.length });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to process weekly digests',
      },
      { status: 500 },
    );
  }
}
