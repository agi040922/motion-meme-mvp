import 'server-only';

const shell = (title: string, body: string) => `
  <div style="font-family:Inter,Helvetica,Arial,sans-serif;background:#f5f5f4;padding:32px;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:24px;padding:32px;">
      <p style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#71717a;margin:0 0 16px;">Motion Meme</p>
      <h1 style="font-size:28px;line-height:1.15;color:#09090b;margin:0 0 16px;">${title}</h1>
      <div style="font-size:15px;line-height:1.7;color:#3f3f46;">${body}</div>
    </div>
  </div>
`;

export const dmNotificationEmail = (params: {
  recipientDisplayName: string;
  senderDisplayName: string;
  senderHandle: string;
  messageBody: string;
  conversationUrl: string;
}) =>
  shell(
    `${params.senderDisplayName} sent you a message`,
    `
      <p style="margin:0 0 12px;">Hi ${params.recipientDisplayName || 'there'},</p>
      <p style="margin:0 0 12px;"><strong>${params.senderDisplayName}</strong> (@${params.senderHandle}) sent you a new DM on Motion Meme.</p>
      <div style="margin:16px 0;padding:16px;border-radius:18px;background:#f4f4f5;border:1px solid #e4e4e7;">
        ${params.messageBody}
      </div>
      <p style="margin:20px 0 0;">
        <a href="${params.conversationUrl}" style="display:inline-block;border-radius:999px;background:#09090b;color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:600;">Open conversation</a>
      </p>
    `,
  );

export const commentNotificationEmail = (params: {
  recipientDisplayName: string;
  commenterDisplayName: string;
  commenterHandle: string;
  commentBody: string;
  postUrl: string;
}) =>
  shell(
    `${params.commenterDisplayName} commented on your post`,
    `
      <p style="margin:0 0 12px;">Hi ${params.recipientDisplayName || 'there'},</p>
      <p style="margin:0 0 12px;"><strong>${params.commenterDisplayName}</strong> (@${params.commenterHandle}) left a new comment on your Motion Meme post.</p>
      <div style="margin:16px 0;padding:16px;border-radius:18px;background:#f4f4f5;border:1px solid #e4e4e7;">
        ${params.commentBody}
      </div>
      <p style="margin:20px 0 0;">
        <a href="${params.postUrl}" style="display:inline-block;border-radius:999px;background:#09090b;color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:600;">View post</a>
      </p>
    `,
  );

export const unpublishedRunReminderEmail = (params: {
  recipientDisplayName: string;
  stageTitle: string;
  score: number;
  playUrl: string;
}) =>
  shell(
    `Your ${params.stageTitle} run is still waiting`,
    `
      <p style="margin:0 0 12px;">Hi ${params.recipientDisplayName || 'there'},</p>
      <p style="margin:0 0 12px;">You cleared <strong>${params.stageTitle}</strong> with a score of <strong>${params.score}</strong>, but you have not uploaded the result clip yet.</p>
      <p style="margin:0 0 12px;">Publish it before the momentum fades.</p>
      <p style="margin:20px 0 0;">
        <a href="${params.playUrl}" style="display:inline-block;border-radius:999px;background:#09090b;color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:600;">Return to Play</a>
      </p>
    `,
  );

export const weeklyDigestEmail = (params: {
  recipientDisplayName: string;
  dmCount: number;
  commentCount: number;
  uploadedRunCount: number;
  bestScore: number;
  dashboardUrl: string;
}) =>
  shell(
    `Your Motion Meme weekly recap`,
    `
      <p style="margin:0 0 12px;">Hi ${params.recipientDisplayName || 'there'},</p>
      <p style="margin:0 0 12px;">Here is what happened in your last 7 days:</p>
      <ul style="padding-left:18px;margin:0 0 12px;">
        <li>${params.dmCount} new DM${params.dmCount === 1 ? '' : 's'}</li>
        <li>${params.commentCount} new comment${params.commentCount === 1 ? '' : 's'}</li>
        <li>${params.uploadedRunCount} uploaded run${params.uploadedRunCount === 1 ? '' : 's'}</li>
        <li>Best score: ${params.bestScore}</li>
      </ul>
      <p style="margin:20px 0 0;">
        <a href="${params.dashboardUrl}" style="display:inline-block;border-radius:999px;background:#09090b;color:#ffffff;padding:12px 18px;text-decoration:none;font-weight:600;">Open Motion Meme</a>
      </p>
    `,
  );
