import React from "react";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-[3px]",
  lg: "h-10 w-10 border-4",
};

/**
 * 공통 스피너 컴포넌트
 * - 브랜드 컬러(#b8ff41)를 기본 포인트 색상으로 사용
 * - sm: 버튼 내 인라인용 / md: 일반 로딩 / lg: 오버레이용
 */
export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin rounded-full border-white/20 border-t-[#b8ff41] ${sizeMap[size]} ${className}`}
    />
  );
}

/**
 * 전체 영역을 덮는 오버레이 스피너
 * - 모달이나 카드 위에 올릴 때 사용
 */
export function SpinnerOverlay({
  message,
  description,
}: {
  message: string;
  description?: string;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/72 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/90 px-8 py-7 text-center shadow-2xl">
        <Spinner size="lg" />
        <div>
          <p className="text-base font-bold text-white">{message}</p>
          {description ? (
            <p className="mt-1 text-sm text-zinc-400">{description}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
