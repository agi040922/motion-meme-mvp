import Link from "next/link";
import { RelativeTime } from "@/components/ui/RelativeTime";
import type { PlayHistoryData } from "@/features/meme/types";

type PlayHistoryViewProps = {
  data: PlayHistoryData;
};

const scoreTone = (score: number) => {
  if (score >= 90) return "text-[#a3ff00]";
  if (score >= 75) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-zinc-400";
};

export function PlayHistoryView({ data }: PlayHistoryViewProps) {
  return (
    <div className="flex flex-col gap-8 px-4 py-6 md:px-6">
      <section className="overflow-hidden rounded-[28px] bg-black text-white shadow-[0_24px_80px_-40px_rgba(0,0,0,0.75)]">
        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,_rgba(163,255,0,0.3),_transparent_40%),linear-gradient(135deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0))] px-6 py-6 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a3ff00]">
            Play history
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Your stage ladder, recent runs, and upload highlights.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 md:text-base">
            Review what cleared, what stalled, and which clips are already ready to reuse on the feed.
          </p>
        </div>

        <div className="grid gap-4 px-6 py-6 md:grid-cols-3 md:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Best score
            </p>
            <p className="mt-3 text-4xl font-black text-[#a3ff00]">{data.profile.bestScore}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Total plays
            </p>
            <p className="mt-3 text-4xl font-black">{data.profile.totalPlayCount}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
              Uploaded clips
            </p>
            <p className="mt-3 text-4xl font-black">{data.uploadedSessions.length}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-950">Stage progress</h2>
            <p className="text-sm text-zinc-500">Best score and latest record for every unlocked stage.</p>
          </div>
          <Link
            href="/play"
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Back to play
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {data.stageSummaries.map((stage) => (
            <article
              key={stage.stageId}
              className={`rounded-[26px] border px-5 py-5 shadow-sm ${
                stage.isUnlocked
                  ? "border-zinc-200 bg-white"
                  : "border-zinc-100 bg-zinc-50 text-zinc-400"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Stage {stage.stageNumber}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-zinc-950">{stage.title}</h3>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    stage.isCleared
                      ? "bg-emerald-50 text-emerald-600"
                      : stage.isUnlocked
                        ? "bg-amber-50 text-amber-600"
                        : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {stage.isCleared ? "Cleared" : stage.isUnlocked ? "In progress" : "Locked"}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    Best
                  </p>
                  <p className={`mt-2 text-3xl font-black ${scoreTone(stage.bestScore)}`}>
                    {stage.bestScore}
                  </p>
                </div>
                <div className="rounded-2xl bg-zinc-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    Attempts
                  </p>
                  <p className="mt-2 text-3xl font-black text-zinc-950">{stage.attemptCount}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm">
                {stage.recentSession ? (
                  <>
                    <p className="font-semibold text-zinc-900">
                      Recent run: {stage.recentSession.score} · {stage.recentSession.stageTitle}
                    </p>
                    <RelativeTime
                      dateString={stage.recentSession.attemptFinishedAt}
                      className="mt-1 block text-zinc-500"
                    />
                  </>
                ) : (
                  <p className="text-zinc-500">No recorded attempts yet.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight text-zinc-950">Recent attempts</h2>
            <p className="text-sm text-zinc-500">Track the sessions you should improve or publish next.</p>
          </div>
          <div className="space-y-4">
            {data.recentSessions.map((session) => (
              <article
                key={session.id}
                className="rounded-[26px] border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                      Stage {session.stageNumber}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-zinc-950">{session.stageTitle}</h3>
                  </div>
                  <span className={`text-3xl font-black ${scoreTone(session.score)}`}>
                    {session.score}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                  <span>{session.resultTier.toUpperCase()}</span>
                  <span>·</span>
                  <span>{session.durationSeconds}s</span>
                  <span>·</span>
                  <RelativeTime dateString={session.attemptFinishedAt} />
                  {session.createdPostId ? (
                    <>
                      <span>·</span>
                      <Link
                        href={`/profile/${data.profile.handle}#post-${session.createdPostId}`}
                        className="font-semibold text-zinc-900 underline-offset-2 hover:underline"
                      >
                        View post
                      </Link>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight text-zinc-950">Uploaded clips</h2>
            <p className="text-sm text-zinc-500">Published or publish-ready sessions with media attached.</p>
          </div>
          <div className="space-y-4">
            {data.uploadedSessions.length > 0 ? (
              data.uploadedSessions.map((session) => (
                <article
                  key={session.id}
                  className="overflow-hidden rounded-[26px] border border-zinc-200 bg-white shadow-sm"
                >
                  <div className="aspect-video bg-black">
                    {session.videoUrl ? (
                      <video
                        src={session.videoUrl}
                        poster={session.thumbnailUrl ?? undefined}
                        controls
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                        Uploaded clip pending preview.
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                          Stage {session.stageNumber}
                        </p>
                        <h3 className="mt-2 font-bold text-zinc-950">{session.stageTitle}</h3>
                      </div>
                      <span className={`text-2xl font-black ${scoreTone(session.score)}`}>
                        {session.score}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-zinc-500">
                      {session.uploadedAt ? (
                        <RelativeTime dateString={session.uploadedAt} />
                      ) : (
                        "Uploaded media detected"
                      )}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[26px] border border-dashed border-zinc-200 bg-zinc-50 px-5 py-6 text-sm text-zinc-500">
                No uploaded play clips yet. Clear a stage, publish from the result screen, then come back here.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
