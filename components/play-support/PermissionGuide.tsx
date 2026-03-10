import Link from "next/link";
import type { SocialIdentity } from "@/components/layout/socialUi";
import { PlaySupportShell } from "@/components/play-support/PlaySupportShell";

const CHECKLIST = [
  {
    title: "카메라가 얼굴과 상체를 같이 잡도록 맞추기",
    body: "무릎과 손이 프레임 안에 보일수록 판정이 안정적이다. 화면과 1.5m 안팎 거리를 먼저 확보한다.",
  },
  {
    title: "밝은 정면광 확보",
    body: "역광이면 포즈 인식 점수가 크게 흔들린다. 창문 뒤보다는 화면 앞 조명을 권장한다.",
  },
  {
    title: "브라우저 권한 재시도 위치 확인",
    body: "권한을 거부했다면 주소창 카메라 아이콘에서 허용으로 바꾼 뒤 페이지를 새로고침한다.",
  },
];

const RETRY_STEPS = [
  "브라우저 주소창 오른쪽의 카메라 아이콘을 연다.",
  "이 사이트에 대한 카메라 권한을 '허용'으로 변경한다.",
  "탭을 새로고침한 뒤 다시 시작한다.",
];

export const PermissionGuide = ({
  currentUser,
}: {
  currentUser?: SocialIdentity | null;
}) => (
  <PlaySupportShell
    currentUser={currentUser}
    eyebrow="Camera Check"
    title="카메라 권한을 먼저 정리하고 들어가면 이탈이 줄어든다."
    description="Motion Meme은 브라우저 안에서 바로 판정하기 때문에 서버 업로드보다 브라우저 권한과 촬영 환경이 먼저 안정적이어야 한다."
    actions={[
      { href: "/play", label: "권한 확인 후 바로 플레이" },
      { href: "/play/tutorial", label: "튜토리얼 보기", variant: "secondary" },
      { href: "/history", label: "이전 기록 보기", variant: "secondary" },
    ]}
  >
    <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold text-white">플레이 전에 맞출 것</p>
        <div className="mt-4 space-y-3">
          {CHECKLIST.map((item, index) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a3ff00]">
                Step {index + 1}
              </p>
              <p className="mt-2 text-lg font-bold text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{item.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[28px] border border-amber-400/20 bg-amber-300/10 p-5">
          <p className="text-sm font-semibold text-amber-100">권한 거부 시 재시도</p>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-amber-50">
            {RETRY_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-xs font-bold text-amber-100">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold text-white">빠른 진입 동선</p>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <Link
              href="/play/tutorial"
              className="block rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-medium text-white transition-colors hover:bg-black/30"
            >
              포즈 예시와 판정 기준 먼저 보기
            </Link>
            <Link
              href="/history"
              className="block rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-medium text-white transition-colors hover:bg-black/30"
            >
              이전 최고 점수와 업로드 클립 확인하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  </PlaySupportShell>
);
