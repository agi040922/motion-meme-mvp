import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import {
  sendTestCommentEmailAction,
  sendTestDmEmailAction,
  sendTestReminderEmailAction,
  sendTestWeeklyDigestEmailAction,
} from "./actions";

const statusLabels: Record<string, string> = {
  "dm-sent": "DM notification sent.",
  "comment-sent": "Comment notification sent.",
  "reminder-sent": "Unpublished run reminder sent.",
  "digest-sent": "Weekly digest sent.",
};

export const metadata = {
  title: "Motion Meme - Email Test",
  description: "Manual Resend test harness for live email templates",
};

export default async function EmailTestPage({
  searchParams,
}: {
  searchParams?: {
    status?: string;
  };
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const admin = createAdminSupabaseClient();
  const meme = admin.schema("meme");

  const profilesResult = await meme
    .from("profiles")
    .select("user_id, handle, display_name")
    .in("handle", ["jkh040922-74d897", "gyeonghun-jeong-a6e3e9"]);

  const usersResult = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  if (usersResult.error) {
    throw usersResult.error;
  }

  const authUsers = usersResult.data.users as Array<{ id: string; email?: string | null }>;
  const emailByUserId = new Map<string, string>(
    authUsers
      .filter((user) => Boolean(user.email))
      .map((user) => [user.id, user.email as string]),
  );

  const people = (profilesResult.data ?? []).map((profile) => ({
    userId: profile.user_id,
    handle: profile.handle,
    displayName: profile.display_name,
    email: emailByUserId.get(profile.user_id) ?? "",
  }));

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Test / Email
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-900">
            Resend template harness
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            This page sends the same live email helpers used by the product, using the existing users 정경훈 and 정경훈_1.
          </p>
          {searchParams?.status && statusLabels[searchParams.status] ? (
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {statusLabels[searchParams.status]}
            </p>
          ) : null}
        </header>

        <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Target users
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {people.map((person) => (
              <div key={person.userId} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                <p className="font-semibold text-zinc-900">{person.displayName}</p>
                <p className="mt-1 text-sm text-zinc-500">@{person.handle}</p>
                <p className="mt-1 text-sm text-zinc-500">{person.email || "No email found"}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <form action={sendTestDmEmailAction} className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-bold text-zinc-900">Send DM email</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Sends the live DM template from 정경훈_1 to 정경훈.
            </p>
            <button
              type="submit"
              className="mt-5 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Send DM test
            </button>
          </form>

          <form action={sendTestCommentEmailAction} className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-bold text-zinc-900">Send comment email</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Sends the live comment template from 정경훈_1 to 정경훈.
            </p>
            <button
              type="submit"
              className="mt-5 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Send comment test
            </button>
          </form>

          <form action={sendTestReminderEmailAction} className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-bold text-zinc-900">Send unpublished run reminder</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Sends the live reminder template to 정경훈 for a sample Warmup Hype run.
            </p>
            <button
              type="submit"
              className="mt-5 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Send reminder test
            </button>
          </form>

          <form action={sendTestWeeklyDigestEmailAction} className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-bold text-zinc-900">Send weekly digest</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Sends the live weekly digest template to 정경훈 with sample counts.
            </p>
            <button
              type="submit"
              className="mt-5 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Send digest test
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
