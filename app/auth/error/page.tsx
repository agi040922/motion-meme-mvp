import Link from "next/link";
import { AUTH_LOGIN_PATH } from "@/lib/supabase/shared";

type AuthErrorPageProps = {
  searchParams?: {
    message?: string;
  };
};

export default function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-400">
          Authentication error
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          We couldn&apos;t finish signing you in.
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-300">
          {searchParams?.message ?? "Please try the sign-in flow again."}
        </p>
        <Link
          href={AUTH_LOGIN_PATH}
          className="mt-8 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}
