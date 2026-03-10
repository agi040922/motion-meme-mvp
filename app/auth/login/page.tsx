import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  DEFAULT_AUTH_REDIRECT_PATH,
  getSafeRedirectPath,
} from "@/lib/supabase/shared";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = getSafeRedirectPath(
    searchParams?.next ?? DEFAULT_AUTH_REDIRECT_PATH,
  );
  const errorMessage = searchParams?.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-500">
            Motion Meme
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
            Sign in
          </h1>
          <p className="text-sm leading-6 text-zinc-600">
            Use Google to create a session for posting, profile edits, and other
            protected flows as they come online.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <GoogleSignInButton next={nextPath} />
          {errorMessage ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex items-center justify-between text-sm text-zinc-500">
          <span>Read-only browsing stays public.</span>
          <Link className="font-medium text-zinc-900" href={nextPath}>
            Continue without signing in
          </Link>
        </div>
      </div>
    </main>
  );
}
