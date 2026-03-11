"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const ADMIN_COOKIE = "motion_meme_admin_access";
const ADMIN_PASSWORD = "admin1234";

export const hasAdminAccess = () =>
  cookies().get(ADMIN_COOKIE)?.value === "granted";

export const unlockAdminAction = async (formData: FormData) => {
  const password = String(formData.get("password") ?? "");

  if (password !== ADMIN_PASSWORD) {
    redirect("/admin?error=wrong-password");
  }

  cookies().set(ADMIN_COOKIE, "granted", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/admin");
};

export const lockAdminAction = async () => {
  cookies().delete(ADMIN_COOKIE);
  redirect("/admin");
};

export const grantCreditsAction = async (formData: FormData) => {
  if (!hasAdminAccess()) {
    redirect("/admin");
  }

  const userId = String(formData.get("userId") ?? "");
  const credits = Number(formData.get("credits") ?? 0);

  if (!userId || !Number.isFinite(credits) || credits <= 0) {
    redirect("/admin?error=invalid-credit-request");
  }

  const admin = createAdminSupabaseClient();
  const meme = admin.schema("meme");

  const { data: wallet, error: walletError } = await meme
    .from("credit_wallets")
    .select("user_id, balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (walletError) {
    throw walletError;
  }

  const nextBalance = Number(wallet?.balance ?? 0) + credits;

  const { error: upsertError } = await meme
    .from("credit_wallets")
    .upsert(
      {
        user_id: userId,
        balance: nextBalance,
      },
      {
        onConflict: "user_id",
      },
    );

  if (upsertError) {
    throw upsertError;
  }

  const { error: ledgerError } = await meme.from("credit_ledger").insert({
    user_id: userId,
    delta: credits,
    balance_after: nextBalance,
    reason: "admin_grant",
    reference_type: "admin_dashboard",
    metadata: {
      source: "admin-dashboard",
      granted_credits: credits,
    },
  });

  if (ledgerError) {
    throw ledgerError;
  }

  revalidatePath("/admin");
  redirect("/admin");
};

export const updateRequestStatusAction = async (formData: FormData) => {
  if (!hasAdminAccess()) {
    redirect("/admin");
  }

  const requestId = String(formData.get("requestId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!requestId || !["accepted", "rejected", "expired", "refunded"].includes(status)) {
    redirect("/admin?error=invalid-request-status");
  }

  const admin = createAdminSupabaseClient();
  const meme = admin.schema("meme");

  const { error } = await meme
    .from("conversation_requests")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) {
    throw error;
  }

  revalidatePath("/admin");
  redirect("/admin");
};
