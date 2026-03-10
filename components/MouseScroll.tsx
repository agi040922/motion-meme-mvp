"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const FRAME_COUNT = 80;

type MouseScrollProps = {
  ctaHref: string;
  ctaLabel: string;
};

export default function MouseScroll({ ctaHref, ctaLabel }: MouseScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 1],
    ["#050505", "#1a1a2e"],
  );

  const [loading, setLoading] = useState(true);

  // 프레임을 캔버스에 그리는 함수 (ref로 접근하므로 항상 최신)
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const img = imagesRef.current[frameIndex];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(
      canvas.width / img.width,
      canvas.height / img.height,
    );
    const x = canvas.width / 2 - (img.width / 2) * scale;
    const y = canvas.height / 2 - (img.height / 2) * scale;

    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  }, []);

  // 이미지 프리로드
  useEffect(() => {
    let loadedCount = 0;
    const loadedImages: HTMLImageElement[] = [];

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      const indexStr = (i + 1).toString().padStart(3, "0");
      img.src = `/video-split/ffout${indexStr}.gif`;

      const handleLoad = () => {
        loadedCount++;
        if (loadedCount === FRAME_COUNT) {
          imagesRef.current = loadedImages;
          setLoading(false);
        }
      };

      img.onload = handleLoad;
      img.onerror = handleLoad;
      loadedImages.push(img);
    }
  }, []);

  // 캔버스 리사이즈 + 초기 프레임 그리기
  useEffect(() => {
    if (loading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeAndDraw = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const currentScroll = scrollYProgress.get();
      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.floor(currentScroll * FRAME_COUNT),
      );
      // requestAnimationFrame 없이 직접 호출
      drawFrame(frameIndex);
    };

    window.addEventListener("resize", resizeAndDraw);
    resizeAndDraw();

    const unsubscribe = scrollYProgress.on("change", (latest) => {
      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.floor(latest * FRAME_COUNT),
      );
      drawFrame(frameIndex);
    });

    return () => {
      window.removeEventListener("resize", resizeAndDraw);
      unsubscribe();
    };
  }, [scrollYProgress, loading, drawFrame]);

  // 텍스트 오버레이 투명도
  const opacity1 = useTransform(scrollYProgress, [0, 0.1, 0.2], [1, 1, 0]);
  const opacity2 = useTransform(
    scrollYProgress,
    [0.2, 0.3, 0.4, 0.5],
    [0, 1, 1, 0],
  );
  const opacity3 = useTransform(
    scrollYProgress,
    [0.5, 0.6, 0.7, 0.8],
    [0, 1, 1, 0],
  );
  const opacity4 = useTransform(scrollYProgress, [0.8, 0.9, 1], [0, 1, 1]);

  return (
    <motion.div
      ref={containerRef}
      className="relative h-[400vh] w-full"
      style={{ backgroundColor }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="w-10 h-10 border-4 border-white/10 border-t-white/80 rounded-full animate-spin" />
            <span className="sr-only">Loading assets...</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-10"
        />

        <div className="absolute inset-0 z-20 pointer-events-none">
          <motion.div
            style={{ opacity: opacity1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white/90 mb-6 drop-shadow-2xl">
              Motion Meme
            </h1>
            <p className="text-xl md:text-2xl text-white/60 font-medium tracking-tight">
              당신의 몸동작이 곧 콘텐츠가 됩니다.
            </p>
          </motion.div>

          <motion.div
            style={{ opacity: opacity2 }}
            className="absolute inset-0 flex flex-col justify-center items-start px-8 md:px-24"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white/90 mb-4">
              카메라만 켜세요.
            </h2>
            <p className="text-lg md:text-2xl text-white/60 max-w-lg">
              앱 설치 없이 바로 접속.
              <br />
              브라우저에서 당신을 추적하고, 무대를 준비합니다.
            </p>
          </motion.div>

          <motion.div
            style={{ opacity: opacity3 }}
            className="absolute inset-0 flex flex-col justify-center items-end text-right px-8 md:px-24"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white/90 mb-4">
              압도적인 모션 판정.
            </h2>
            <p className="text-lg md:text-2xl text-white/60 max-w-lg">
              포즈를 맞추는 순간 터지는 이펙트와 밈 오버레이.
              <br />
              직관적이고 과장된 피드백을 경험하세요.
            </p>
          </motion.div>

          <motion.div
            style={{ opacity: opacity4 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
          >
            <div className="inline-block px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-semibold mb-8 uppercase tracking-widest shadow-xl">
              The Ultimate SNS
            </div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white/90 mb-6 drop-shadow-2xl">
              반응을 공유하세요.
            </h2>
            <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-12">
              15초 결과 영상을 피드에 업로드하고,
              <br />
              수많은 유저들과 서로의 밈을 즐기며 소통하세요.
            </p>
            <Link
              href={ctaHref}
              className="pointer-events-auto rounded-full bg-white px-10 py-5 text-lg font-bold text-black transition-transform duration-300 hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              {ctaLabel}
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
