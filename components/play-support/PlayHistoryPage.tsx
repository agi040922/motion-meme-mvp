import Link from "next/link";
import type { SocialIdentity } from "@/components/layout/socialUi";
import type { PlayHistoryData } from "@/features/meme/types";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { PlaySupportShell } from "@/components/play-support/PlaySupportShell";

const tierLabel = {
  perfect: "Perfect",
  success: "Success",
  close: "Close",
  fail: "Retry",
} as const;

export const PlayHistoryPage = ({
  currentUser,
  history,
}: {
  currentUser?: SocialIdentity | null;
  history: PlayHistoryData;
}) => (
  <PlaySupportShell
    currentUser={currentUser}
    eyebrow="History"
    title="이전 기록과 업로드 클립을 먼저 보여줘서 재도전 이유를 만든다."
    description="스테이지별 최고 점수, 최근 플레이, 업로드 완료 영상만 따로 묶어 보여준다. `/play` 본체를 바꾸지 않고도 보조 제품 흐름을 완성하는 목적이다."
    actions={[
      { href: "/play", label: "다시 플레이" },
      { href: "/play/permissions", label: "카메라 체크", variant: "secondary" },
      { href: "/play/tutorial", label: "튜토리얼", variant: "secondary" },
    ]}
  >
    <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
      <div className="space-y-4">
        <div className="rounded-[28px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-950">Uploaded Highlights</p>
              <p className="mt-1 text-xs text-zinc-500">
                업로드 완료된 플레이만 따로 보여준다.
              </p>
            </div>
            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-600">
              {history.uploadedSessions.length} clips
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {history.uploadedSessions.length > 0 ? (
              history.uploadedSessions.slice(0, 4).map((session) => (
                <div
                  key={session.id}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50"
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
                      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                        Upload processing
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div>
                        <p className="font-semibold text-zinc-950">
                          Stage {session.stageNumber} · {session.stageTitle}
                        </p>
                        <p className="mt-1 text-zinc-500">
                        {tierLabel[session.resultTier]} · Score {session.score}
                      </p>
                    </div>
                    <RelativeTime dateString={session.attemptFinishedAt} className="text-zinc-500" />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-5 text-sm text-zinc-500">
                아직 업로드한 플레이가 없다. 먼저 성공 연출을 만들고 공개 피드로 보내면 여기에 쌓인다.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-zinc-950">Recent Attempts</p>
          <div className="mt-4 space-y-3">
            {history.recentSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-950">
                      Stage {session.stageNumber} · {session.stageTitle}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {tierLabel[session.resultTier]} · Score {session.score} · {session.durationSeconds}s
                    </p>
                  </div>
                  <RelativeTime dateString={session.attemptFinishedAt} className="text-zinc-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-950">Stage Progress</p>
            <p className="mt-1 text-xs text-zinc-500">
              stage별 최고 점수와 최근 시도, 다음 보강 포인트를 한 번에 본다.
            </p>
          </div>
          <Link
            href={`/profile/${history.profile.handle}?tab=videos`}
            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            Profile videos
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {history.stageSummaries.map((stage) => (
            <div
              key={stage.stageId}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold text-zinc-950">
                    Stage {stage.stageNumber} · {stage.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {stage.isUnlocked
                      ? stage.isCleared
                        ? "클리어 완료. 최고 기록을 더 올릴 수 있다."
                        : "해금됨. 최고 점수를 더 끌어올릴 차례다."
                      : "이전 스테이지를 클리어하면 해금된다."}
                  </p>
                </div>
                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
                  Best {stage.bestScore}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Attempts
                  </p>
                  <p className="mt-2 text-2xl font-black text-zinc-950">{stage.attemptCount}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Recent
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-950">
                    {stage.recentSession
                      ? `${tierLabel[stage.recentSession.resultTier]} · ${stage.recentSession.score}`
                      : "No runs yet"}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Last Played
                  </p>
                  {stage.lastAttemptedAt ? (
                    <RelativeTime dateString={stage.lastAttemptedAt} className="mt-2 text-sm font-semibold text-zinc-950" />
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-zinc-500">Not yet</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </PlaySupportShell>
);
