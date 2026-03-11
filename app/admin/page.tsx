import { unlockAdminAction, hasAdminAccess } from "@/app/admin/actions";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { getAdminDashboardData } from "@/features/admin/server";

export const metadata = {
  title: "Motion Meme - Admin",
  description: "Local password gated admin dashboard",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: {
    error?: string;
  };
}) {
  const isUnlocked = hasAdminAccess();

  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16">
        <div className="w-full max-w-md rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Admin Gate
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900">
            Enter admin password
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            This is a local dashboard gate. It does not use DB auth and is intentionally isolated from the public app flows.
          </p>

          <form action={unlockAdminAction} className="mt-8 space-y-4">
            <input
              name="password"
              type="password"
              placeholder="admin1234"
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none"
            />
            {searchParams?.error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                Wrong password.
              </p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Unlock admin
            </button>
          </form>
        </div>
      </main>
    );
  }

  const dashboardData = await getAdminDashboardData();
  return <AdminDashboard data={dashboardData} />;
}
