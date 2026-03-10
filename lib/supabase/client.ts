"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

let browserClient: SupabaseClient | undefined;

export const createBrowserSupabaseClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }

  return browserClient;
};
