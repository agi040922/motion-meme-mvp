import { NextResponse } from "next/server";
import {
  AUTH_LOGIN_PATH,
  DEFAULT_AUTH_REDIRECT_PATH,
  getSafeRedirectPath,
} from "@/lib/supabase/shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(
    requestUrl.searchParams.get("next") ?? DEFAULT_AUTH_REDIRECT_PATH,
  );

  if (!code) {
    const loginUrl = new URL(AUTH_LOGIN_PATH, requestUrl.origin);
    loginUrl.searchParams.set("error", "Missing OAuth authorization code.");
    loginUrl.searchParams.set("next", next);

    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL(AUTH_LOGIN_PATH, requestUrl.origin);
    loginUrl.searchParams.set("error", error.message);
    loginUrl.searchParams.set("next", next);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
