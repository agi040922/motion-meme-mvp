import Link from "next/link";
import type { SocialIdentity } from "@/components/layout/socialUi";
import type { PlayDashboardData } from "@/features/meme/types";
import { PlaySupportShell } from "@/components/play-support/PlaySupportShell";

const TUTORIAL_STEPS = [
  {
    title: "준비",
    body: "카메라를 켜면 스테이지 설명과 목표 포즈가 먼저 보인다. 서두르지 말고 팔, 다리, 중심축을 먼저 맞춘다.",
  },
  {
    title: "인식",
    body: "점수가 오르기 시작하면 포즈가 읽히는 중이다. 팔과 무릎 각도가 크게 흔들리지 않도록 0.5초 이상 유지한다.",
  },
  {
    title: "성공 연출",
    body: "성공하면 밈 오버레이와 결과 클립이 생성된다. 바로 업로드하지 않아도 기록에는 남는다.",
  },
];

export const TutorialGuide = ({
  currentUser,
  dashboard,
}: {
  currentUser?: SocialIdentity | null;
  dashboard: PlayDashboardData;
}) => {
  const unlockedCount = Object.keys(dashboard.progressByStageId).length;

  return (
    <PlaySupportShell
      currentUser={currentUser}
      eyebrow="Tutorial"
      title="포즈 판정은 복잡하지 않다. 몸을 크게 맞추고 잠깐 유지하면 된다."
      description="튜토리얼은 `/play` 본체 대신 준비 흐름을 분리해서 보여준다. 지금 해금된 스테이지 수와 최근 흐름을 보고 바로 플레이에 들어갈 수 있다."
    >
      <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
              Status
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Unlocked
                </p>
                <p className="mt-2 text-3xl font-black text-zinc-950">{unlockedCount}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Best Score
                </p>
                <p className="mt-2 text-3xl font-black text-[#a3ff00]">
                  {dashboard.profile.bestScore}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-200 bg-white p-5">
            <p className="text-sm font-semibold text-zinc-950">지금 바로 해볼 수 있는 스테이지</p>
            <div className="mt-4 space-y-3">
              {dashboard.stages.slice(0, 4).map((stage) => {
                const progress = dashboard.progressByStageId[stage.id];
                return (
                  <div
                    key={stage.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-zinc-950">
                          Stage {stage.stageNumber} · {stage.title}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{stage.instructionText}</p>
                      </div>
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
                        {progress ? `Best ${progress.bestScore}` : "Locked"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-white p-5">
          <p className="text-sm font-semibold text-zinc-950">플레이 3단계 흐름</p>
          <div className="mt-4 space-y-3">
            {TUTORIAL_STEPS.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Phase {index + 1}
                </p>
                <p className="mt-2 text-xl font-bold text-zinc-950">{step.title}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
            성공 연출과 업로드 루프를 바로 보려면 <Link href="/play" className="font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-4">플레이</Link>,
            이전 최고 점수와 최근 클립을 먼저 보고 들어가려면 <Link href="/history" className="font-semibold text-zinc-950 underline decoration-zinc-300 underline-offset-4">기록</Link>으로 이동한다.
          </div>
        </div>
      </div>
    </PlaySupportShell>
  );
};
