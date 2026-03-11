"use server";

import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  sendCommentNotificationEmail,
  sendDmNotificationEmail,
  sendUnpublishedRunReminderEmail,
  sendWeeklyDigestEmail,
} from "@/features/email/server";

type EmailTestUser = {
  userId: string;
  handle: string;
  displayName: string;
  email: string;
};

const EMAIL_TEST_REDIRECT = "/test/email";

const loadEmailTestUsers = async () => {
  const admin = createAdminSupabaseClient();
  const meme = admin.schema("meme");

  const profilesResult = await meme
    .from("profiles")
    .select("user_id, handle, display_name")
    .in("handle", ["jkh040922-74d897", "gyeonghun-jeong-a6e3e9"]);

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  const profiles = profilesResult.data ?? [];
  const usersResult = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersResult.error) {
    throw usersResult.error;
  }

  const authUsers = usersResult.data.users as Array<{ id: string; email?: string | null }>;
  const emailByUserId = new Map<string, string>(
    authUsers
      .filter((user) => Boolean(user.email))
      .map((user) => [user.id, user.email as string]),
  );

  const mapped = profiles
    .map((profile) => ({
      userId: profile.user_id,
      handle: profile.handle,
      displayName: profile.display_name,
      email: emailByUserId.get(profile.user_id) ?? "",
    }))
    .filter((profile) => profile.email) as EmailTestUser[];

  const primary = mapped.find((profile) => profile.handle === "jkh040922-74d897");
  const counterpart = mapped.find((profile) => profile.handle === "gyeonghun-jeong-a6e3e9");

  if (!primary || !counterpart) {
    throw new Error("Email test users could not be loaded.");
  }

  return {
    primary,
    counterpart,
  };
};

export const sendTestDmEmailAction = async () => {
  const { primary, counterpart } = await loadEmailTestUsers();
  const stamp = Date.now();

  await sendDmNotificationEmail({
    recipientUserId: primary.userId,
    recipientEmail: primary.email,
    recipientDisplayName: primary.displayName,
    senderDisplayName: counterpart.displayName,
    senderHandle: counterpart.handle,
    conversationId: `test-conversation-${stamp}`,
    messageId: `test-message-${stamp}`,
    messageBody: "This is a DM notification test from the local email harness.",
  });

  redirect(`${EMAIL_TEST_REDIRECT}?status=dm-sent`);
};

export const sendTestCommentEmailAction = async () => {
  const { primary, counterpart } = await loadEmailTestUsers();
  const stamp = Date.now();

  await sendCommentNotificationEmail({
    recipientUserId: primary.userId,
    recipientEmail: primary.email,
    recipientDisplayName: primary.displayName,
    commenterDisplayName: counterpart.displayName,
    commenterHandle: counterpart.handle,
    commentId: `test-comment-${stamp}`,
    postId: `test-post-${stamp}`,
    commentBody: "This is a comment notification test from /test/email.",
  });

  redirect(`${EMAIL_TEST_REDIRECT}?status=comment-sent`);
};

export const sendTestReminderEmailAction = async () => {
  const { primary } = await loadEmailTestUsers();
  const stamp = Date.now();

  await sendUnpublishedRunReminderEmail({
    recipientUserId: primary.userId,
    recipientEmail: primary.email,
    recipientDisplayName: primary.displayName,
    playSessionId: `test-play-session-${stamp}`,
    stageTitle: "Warmup Hype",
    score: 82,
  });

  redirect(`${EMAIL_TEST_REDIRECT}?status=reminder-sent`);
};

export const sendTestWeeklyDigestEmailAction = async () => {
  const { primary } = await loadEmailTestUsers();
  const stamp = Date.now();

  await sendWeeklyDigestEmail({
    recipientUserId: primary.userId,
    recipientEmail: primary.email,
    recipientDisplayName: primary.displayName,
    digestKey: `test-weekly-digest-${stamp}`,
    dmCount: 3,
    commentCount: 5,
    uploadedRunCount: 2,
    bestScore: 91,
  });

  redirect(`${EMAIL_TEST_REDIRECT}?status=digest-sent`);
};
