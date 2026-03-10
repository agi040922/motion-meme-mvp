import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  AUTH_LOGIN_PATH,
  getSafeRedirectPath,
} from "@/lib/supabase/shared";

export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

export const getCurrentSession = async () => {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
};

export const requireUser = async (next?: string) => {
  const user = await getCurrentUser();

  if (!user) {
    const target = getSafeRedirectPath(next);
    redirect(`${AUTH_LOGIN_PATH}?next=${encodeURIComponent(target)}`);
  }

  return user;
};
