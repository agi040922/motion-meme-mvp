"use server";

import { redirect } from "next/navigation";
import {
  DEFAULT_AUTH_REDIRECT_PATH,
  getSafeRedirectPath,
} from "@/lib/supabase/shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const signOutAction = async (redirectTo?: string) => {
  const supabase = createServerSupabaseClient();
  await supabase.auth.signOut();

  redirect(getSafeRedirectPath(redirectTo ?? DEFAULT_AUTH_REDIRECT_PATH));
};
