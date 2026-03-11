import { lockAdminAction, grantCreditsAction } from "@/app/admin/actions";
import type { AdminDashboardData } from "@/features/admin/server";

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const summaryCards = [
    { label: "Members", value: data.summary.memberCount },
    { label: "Wallets", value: data.summary.walletCount },
    { label: "Total Credits", value: data.summary.totalCredits },
    { label: "Special Requests", value: data.summary.specialRequestCount },
    { label: "Pending Requests", value: data.summary.pendingRequestCount },
    { label: "DM Rooms", value: data.summary.dmConversationCount },
  ];

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Motion Meme Admin
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-900">
              Credits / Members / Special DM
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Local password gate only. This dashboard reads real Supabase data and keeps credit-related tooling out of the public product surface.
            </p>
          </div>
          <form action={lockAdminAction}>
            <button
              type="submit"
              className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              Lock admin
            </button>
          </form>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {card.label}
              </p>
              <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">
                {card.value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Members
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                  Credit balances
                </h2>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-100 text-left text-sm">
                <thead>
                  <tr className="text-zinc-500">
                    <th className="pb-3 font-semibold">Member</th>
                    <th className="pb-3 font-semibold">Handle</th>
                    <th className="pb-3 font-semibold">Credits</th>
                    <th className="pb-3 font-semibold">Grant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.members.map((member) => (
                    <tr key={member.userId}>
                      <td className="py-3 pr-4">
                        <div>
                          <p className="font-semibold text-zinc-900">{member.displayName}</p>
                          <p className="mt-1 text-xs text-zinc-500 line-clamp-1">
                            {member.bio || "No bio yet"}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-zinc-500">@{member.handle}</td>
                      <td className="py-3 pr-4 font-semibold text-zinc-900">{member.credits}</td>
                      <td className="py-3">
                        <form action={grantCreditsAction} className="flex items-center gap-2">
                          <input type="hidden" name="userId" value={member.userId} />
                          <input
                            type="number"
                            name="credits"
                            min={1}
                            defaultValue={20}
                            className="w-20 rounded-full border border-zinc-200 px-3 py-2 text-sm outline-none"
                          />
                          <button
                            type="submit"
                            className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800"
                          >
                            Grant
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Special Requests
              </p>
              <div className="mt-4 space-y-3">
                {data.requests.length > 0 ? (
                  data.requests.map((request) => (
                    <div key={request.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-zinc-900">
                          {request.intent === "dating_intro" ? "Dating intro" : "Brand / collab"}
                        </p>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-500">
                        {request.requester?.displayName ?? "Unknown"} → {request.target?.displayName ?? "Unknown"}
                      </p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {request.creditsSpent} credits · {request.theme}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No special requests yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Recent Ledger
              </p>
              <div className="mt-4 space-y-3">
                {data.recentLedger.length > 0 ? (
                  data.recentLedger.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-zinc-900">{entry.reason}</p>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            entry.delta >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-500">
                        {entry.user?.displayName ?? "Unknown"} · balance {entry.balanceAfter}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No credit ledger rows yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
