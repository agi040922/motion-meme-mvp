import Link from "next/link";
import { requireUser } from "@/lib/supabase/auth";
import { getPlayHistoryData, getViewerProfileSummary } from "@/features/meme/server";
import { adaptDomainProfile } from "@/components/layout/socialUi";
import { MainLayout } from "@/components/layout/MainLayout";
import { RelativeTime } from "@/components/ui/RelativeTime";

export const metadata = {
  title: "Motion Meme - History",
  description: "Review your best stage scores, uploaded videos, and latest attempts.",
};

export default async function HistoryPage() {
  const user = await requireUser("/history");
  const [viewerProfile, history] = await Promise.all([
    getViewerProfileSummary(),
    getPlayHistoryData(user.id),
  ]);
  const currentUser = viewerProfile ? adaptDomainProfile(viewerProfile) : null;

  return (
    <MainLayout currentUser={currentUser}>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-zinc-100 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Play History
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-950">
            Track the runs worth replaying
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
            Stage bests, uploaded clips, and your most recent attempts live here so you can jump
            back into the next run with context.
          </p>
        </header>

        <section className="px-5 py-6">
          <div className="grid gap-4 md:grid-cols-3">
            {history.stageSummaries.slice(0, 6).map((stage) => (
              <article
                key={stage.stageId}
                className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  Stage {stage.stageNumber}
                </p>
                <h2 className="mt-2 text-lg font-bold text-zinc-950">{stage.title}</h2>
                <p className="mt-4 text-3xl font-black tracking-tight text-zinc-950">
                  {stage.bestScore}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                  Best score
                </p>
                <p className="mt-4 text-sm text-zinc-600">
                  {stage.lastAttemptedAt ? (
                    <>
                      Last run <RelativeTime dateString={stage.lastAttemptedAt} />
                    </>
                  ) : (
                    "No attempts yet"
                  )}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-zinc-100 px-5 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-950">Recent uploads</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Highlight the clips that already made it into your profile and feed.
              </p>
            </div>
            <Link
              href="/play"
              className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              New Run
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {history.uploadedSessions.length > 0 ? (
              history.uploadedSessions.map((session) => (
                <article
                  key={session.id}
                  className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm"
                >
                  <div className="aspect-video bg-black">
                    {session.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.thumbnailUrl}
                        alt={session.stageTitle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm font-semibold text-zinc-400">
                        No thumbnail
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                      Stage {session.stageNumber}
                    </p>
                    <h3 className="text-lg font-bold text-zinc-950">{session.stageTitle}</h3>
                    <p className="text-sm text-zinc-600">
                      Score {session.score} · Uploaded{" "}
                      <RelativeTime dateString={session.uploadedAt ?? session.createdAt} />
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-zinc-200 px-5 py-10 text-center text-sm text-zinc-500 md:col-span-2">
                No uploaded clips yet. Clear a stage and publish a replay to surface it here.
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-zinc-100 px-5 py-6">
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">Latest attempts</h2>
          <div className="mt-4 space-y-3">
            {history.recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    Stage {session.stageNumber} · {session.stageTitle}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {session.success ? "Cleared" : "Retry"} · {session.score} pts ·{" "}
                    <RelativeTime dateString={session.attemptFinishedAt} />
                  </p>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                  {session.resultTier}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
