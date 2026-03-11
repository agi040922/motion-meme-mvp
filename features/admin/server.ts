import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type AdminProfileRow = {
  user_id: string;
  handle: string;
  display_name: string;
  bio: string;
  created_at: string;
};

type CreditWalletRow = {
  user_id: string;
  balance: number;
};

type ConversationRequestRow = {
  id: string;
  conversation_id: string;
  requester_user_id: string;
  target_user_id: string;
  intent: "dating_intro" | "brand_collab";
  theme: string;
  credits_spent: number;
  status: string;
  created_at: string;
};

type CreditLedgerRow = {
  id: string;
  user_id: string;
  delta: number;
  balance_after: number;
  reason: string;
  created_at: string;
};

type PostReportRow = {
  id: string;
  post_id: string;
  reporter_user_id: string;
  reason: string;
  details: string;
  created_at: string;
};

export type AdminDashboardData = {
  summary: {
    memberCount: number;
    walletCount: number;
    totalCredits: number;
    specialRequestCount: number;
    pendingRequestCount: number;
    dmConversationCount: number;
  };
  members: Array<{
    userId: string;
    handle: string;
    displayName: string;
    bio: string;
    createdAt: string;
    credits: number;
  }>;
  requests: Array<{
    id: string;
    createdAt: string;
    intent: "dating_intro" | "brand_collab";
    theme: string;
    status: string;
    creditsSpent: number;
    requester: {
      userId: string;
      handle: string;
      displayName: string;
    } | null;
    target: {
      userId: string;
      handle: string;
      displayName: string;
    } | null;
  }>;
  recentLedger: Array<{
    id: string;
    createdAt: string;
    user: {
      userId: string;
      handle: string;
      displayName: string;
    } | null;
    delta: number;
    balanceAfter: number;
    reason: string;
  }>;
  reports: Array<{
    id: string;
    createdAt: string;
    reason: string;
    details: string;
    postId: string;
    reporter: {
      userId: string;
      handle: string;
      displayName: string;
    } | null;
  }>;
};

export const getAdminDashboardData = async (): Promise<AdminDashboardData> => {
  const admin = createAdminSupabaseClient();
  const meme = admin.schema("meme");

  const [profilesResult, walletsResult, requestsResult, ledgerResult, conversationsResult, reportsResult] =
    await Promise.all([
      meme
        .from("profiles")
        .select("user_id, handle, display_name, bio, created_at")
        .order("created_at", { ascending: false }),
      meme
        .from("credit_wallets")
        .select("user_id, balance")
        .order("balance", { ascending: false }),
      meme
        .from("conversation_requests")
        .select("id, conversation_id, requester_user_id, target_user_id, intent, theme, credits_spent, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      meme
        .from("credit_ledger")
        .select("id, user_id, delta, balance_after, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      meme
        .from("conversations")
        .select("id", { count: "exact", head: true }),
      meme
        .from("post_reports")
        .select("id, post_id, reporter_user_id, reason, details, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (profilesResult.error) throw profilesResult.error;
  if (walletsResult.error) throw walletsResult.error;
  if (requestsResult.error) throw requestsResult.error;
  if (ledgerResult.error) throw ledgerResult.error;
  if (conversationsResult.error) throw conversationsResult.error;
  if (reportsResult.error) throw reportsResult.error;

  const profiles = (profilesResult.data ?? []) as AdminProfileRow[];
  const wallets = (walletsResult.data ?? []) as CreditWalletRow[];
  const requests = (requestsResult.data ?? []) as ConversationRequestRow[];
  const ledger = (ledgerResult.data ?? []) as CreditLedgerRow[];
  const reports = (reportsResult.data ?? []) as PostReportRow[];

  const profileMap = new Map(
    profiles.map((profile) => [profile.user_id, profile]),
  );
  const walletMap = new Map(
    wallets.map((wallet) => [wallet.user_id, Number(wallet.balance)]),
  );

  const totalCredits = wallets.reduce((sum, wallet) => sum + Number(wallet.balance), 0);
  const pendingRequestCount = requests.filter((request) => request.status === "sent").length;

  return {
    summary: {
      memberCount: profiles.length,
      walletCount: wallets.length,
      totalCredits,
      specialRequestCount: requests.length,
      pendingRequestCount,
      dmConversationCount: conversationsResult.count ?? 0,
    },
    members: profiles.map((profile) => ({
      userId: profile.user_id,
      handle: profile.handle,
      displayName: profile.display_name,
      bio: profile.bio,
      createdAt: profile.created_at,
      credits: walletMap.get(profile.user_id) ?? 0,
    })),
    requests: requests.map((request) => ({
      id: request.id,
      createdAt: request.created_at,
      intent: request.intent,
      theme: request.theme,
      status: request.status,
      creditsSpent: request.credits_spent,
      requester: profileMap.get(request.requester_user_id)
        ? {
            userId: request.requester_user_id,
            handle: profileMap.get(request.requester_user_id)!.handle,
            displayName: profileMap.get(request.requester_user_id)!.display_name,
          }
        : null,
      target: profileMap.get(request.target_user_id)
        ? {
            userId: request.target_user_id,
            handle: profileMap.get(request.target_user_id)!.handle,
            displayName: profileMap.get(request.target_user_id)!.display_name,
          }
        : null,
    })),
    recentLedger: ledger.map((entry) => ({
      id: entry.id,
      createdAt: entry.created_at,
      user: profileMap.get(entry.user_id)
        ? {
            userId: entry.user_id,
            handle: profileMap.get(entry.user_id)!.handle,
            displayName: profileMap.get(entry.user_id)!.display_name,
          }
        : null,
      delta: Number(entry.delta),
      balanceAfter: Number(entry.balance_after),
      reason: entry.reason,
    })),
    reports: reports.map((report) => ({
      id: report.id,
      createdAt: report.created_at,
      reason: report.reason,
      details: report.details,
      postId: report.post_id,
      reporter: profileMap.get(report.reporter_user_id)
        ? {
            userId: report.reporter_user_id,
            handle: profileMap.get(report.reporter_user_id)!.handle,
            displayName: profileMap.get(report.reporter_user_id)!.display_name,
          }
        : null,
    })),
  };
};
