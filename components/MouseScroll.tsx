"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const FRAME_COUNT = 80;
const WATERMARK_MASK_WIDTH = 200;
const WATERMARK_MASK_HEIGHT = 92;
const FRAME_PROGRESS_STOPS = [
  { scroll: 0, frame: 0 },
  { scroll: 0.2, frame: 0.04 },
  { scroll: 0.32, frame: 0.08 },
  { scroll: 0.52, frame: 0.16 },
  { scroll: 0.66, frame: 0.24 },
  { scroll: 0.82, frame: 0.34 },
  { scroll: 0.9, frame: 0.42 },
  { scroll: 0.96, frame: 0.58 },
  { scroll: 0.99, frame: 0.8 },
  { scroll: 1, frame: 1 },
];

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

  const mapScrollToFrameProgress = useCallback((progress: number) => {
    const clampedProgress = Math.max(0, Math.min(1, progress));

    for (let index = 0; index < FRAME_PROGRESS_STOPS.length - 1; index++) {
      const currentStop = FRAME_PROGRESS_STOPS[index];
      const nextStop = FRAME_PROGRESS_STOPS[index + 1];

      if (clampedProgress <= nextStop.scroll) {
        const segmentProgress =
          (clampedProgress - currentStop.scroll) /
          (nextStop.scroll - currentStop.scroll);

        return (
          currentStop.frame +
          (nextStop.frame - currentStop.frame) * segmentProgress
        );
      }
    }

    return 1;
  }, []);

  const maskVeoWatermark = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const overlayWidth = Math.min(
        Math.max(WATERMARK_MASK_WIDTH, canvas.width * 0.18),
        canvas.width * 0.28,
      );
      const overlayHeight = Math.min(
        Math.max(WATERMARK_MASK_HEIGHT, canvas.height * 0.12),
        canvas.height * 0.22,
      );
      const overlayX = canvas.width - overlayWidth;
      const overlayY = canvas.height - overlayHeight;

      const horizontalGradient = ctx.createLinearGradient(
        overlayX,
        overlayY,
        canvas.width,
        overlayY,
      );
      horizontalGradient.addColorStop(0, "rgba(5, 5, 5, 0)");
      horizontalGradient.addColorStop(0.45, "rgba(5, 5, 5, 0.72)");
      horizontalGradient.addColorStop(1, "rgba(5, 5, 5, 0.98)");
      ctx.fillStyle = horizontalGradient;
      ctx.fillRect(overlayX, overlayY, overlayWidth, overlayHeight);

      const verticalGradient = ctx.createLinearGradient(
        overlayX,
        overlayY,
        overlayX,
        canvas.height,
      );
      verticalGradient.addColorStop(0, "rgba(5, 5, 5, 0)");
      verticalGradient.addColorStop(0.55, "rgba(5, 5, 5, 0.65)");
      verticalGradient.addColorStop(1, "rgba(5, 5, 5, 0.98)");
      ctx.fillStyle = verticalGradient;
      ctx.fillRect(overlayX, overlayY, overlayWidth, overlayHeight);
    },
    [],
  );

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
    maskVeoWatermark(ctx, canvas);
  }, [maskVeoWatermark]);

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

      const currentScroll = mapScrollToFrameProgress(scrollYProgress.get());
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
      const frameProgress = mapScrollToFrameProgress(latest);
      const frameIndex = Math.min(
        FRAME_COUNT - 1,
        Math.floor(frameProgress * FRAME_COUNT),
      );
      drawFrame(frameIndex);
    });

    return () => {
      window.removeEventListener("resize", resizeAndDraw);
      unsubscribe();
    };
  }, [scrollYProgress, loading, drawFrame, mapScrollToFrameProgress]);

  // 텍스트 오버레이 투명도
  const opacity1 = useTransform(
    scrollYProgress,
    [0, 0.08, 0.24, 0.28, 0.3],
    [1, 1, 1, 0.18, 0],
  );
  const opacity2 = useTransform(
    scrollYProgress,
    [0.31, 0.34, 0.52, 0.56, 0.58],
    [0, 1, 1, 0.18, 0],
  );
  const opacity3 = useTransform(
    scrollYProgress,
    [0.59, 0.62, 0.8, 0.84, 0.86],
    [0, 1, 1, 0.18, 0],
  );
  const opacity4 = useTransform(
    scrollYProgress,
    [0.87, 0.9, 0.98, 1],
    [0, 1, 1, 1],
  );

  return (
    <motion.div
      ref={containerRef}
      className="relative h-[1100vh] w-full"
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
        <div className="absolute inset-0 z-[15] bg-[radial-gradient(circle_at_top,rgba(125,76,255,0.12),transparent_38%),linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.38)_100%)]" />

        <div className="absolute inset-0 z-20 pointer-events-none">
          <motion.div
            style={{ opacity: opacity1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white/90 mb-6 drop-shadow-2xl">
              Motion Meme
            </h1>
            <p className="text-xl md:text-2xl text-white/60 font-medium tracking-tight">
              A camera-first social playground where your body becomes the post.
            </p>
          </motion.div>

          <motion.div
            style={{ opacity: opacity2 }}
            className="absolute inset-0 flex flex-col justify-center items-start px-8 md:px-24"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white/90 mb-4">
              Clear the pose. Steal the spotlight.
            </h2>
            <p className="text-lg md:text-2xl text-white/60 max-w-lg">
              Jump into sequential stage challenges in the browser,
              <br />
              lock in your motion score, and trigger the meme overlay live.
            </p>
          </motion.div>

          <motion.div
            style={{ opacity: opacity3 }}
            className="absolute inset-0 flex flex-col justify-center items-end text-right px-8 md:px-24"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white/90 mb-4">
              Keep the clip. Post it when it hits.
            </h2>
            <p className="text-lg md:text-2xl text-white/60 max-w-lg">
              Result videos stay local until you choose to publish,
              <br />
              then land in a social feed with captions, reactions, and follows.
            </p>
          </motion.div>

          <motion.div
            style={{ opacity: opacity4 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
          >
            <div className="inline-block px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm font-semibold mb-8 uppercase tracking-widest shadow-xl">
              Camera-first social network
            </div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-white/90 mb-6 drop-shadow-2xl">
              Play a challenge. Publish the reaction.
            </h2>
            <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-12">
              Build your stage streak, upload a 15-second result clip,
              <br />
              and keep the momentum going with comments, saves, and DMs.
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
