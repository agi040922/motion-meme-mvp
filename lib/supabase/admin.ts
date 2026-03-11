import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const getServiceRoleKey = () => {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }
  return value;
};

export const createAdminSupabaseClient = () =>
  createClient(env.NEXT_PUBLIC_SUPABASE_URL, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
