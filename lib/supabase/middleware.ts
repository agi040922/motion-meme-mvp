import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  AUTH_LOGIN_PATH,
  getSafeRedirectPath,
} from "@/lib/supabase/shared";

const PROTECTED_PATH_PREFIXES: string[] = [];

const matchesPath = (pathname: string, prefix: string) => {
  if (prefix === "/") {
    return pathname === "/";
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`);
};

export const isProtectedPath = (pathname: string) =>
  PROTECTED_PATH_PREFIXES.some((prefix) => matchesPath(pathname, prefix));

export const updateSession = async (request: NextRequest) => {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtectedPath(request.nextUrl.pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = AUTH_LOGIN_PATH;
    loginUrl.searchParams.set(
      "next",
      getSafeRedirectPath(request.nextUrl.pathname),
    );

    return NextResponse.redirect(loginUrl);
  }

  return response;
};
