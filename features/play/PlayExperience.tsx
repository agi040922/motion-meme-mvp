"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { StartDmButton } from "@/components/messages/StartDmButton";
import { Button } from "@/components/ui/Button";
import { SpinnerOverlay } from "@/components/ui/Spinner";
import { createPlaySession, publishPlaySession } from "@/features/meme/browser";
import type {
  PlayDashboardData,
  PlaySessionRecord,
  ResultTier,
  StageProgressRecord,
  StageRecord,
} from "@/features/meme/types";
import {
  blobToFile,
  canvasToJpegFile,
  getSupportedRecorderMimeType,
  videoBlobToJpegFile,
} from "@/features/play/media";
import { getPoseGuide } from "@/features/play/poseGuides";
import { scorePose } from "@/features/play/scoring";
import { getResultTier } from "@/features/play/scoring";

type PlayExperienceProps = {
  initialData: PlayDashboardData;
};

type Phase = "idle" | "preparing" | "guiding" | "playing" | "celebrating" | "result";
type UploadVariant = "raw" | "overlay";

const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const WASM_BASE_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm";

const getInitialStage = (
  stages: StageRecord[],
  progressByStageId: Record<string, StageProgressRecord>,
) =>
  stages.find((stage) => progressByStageId[stage.id]) ?? stages[0] ?? null;

const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;

const GUIDE_PREVIEW_MS = 2200;
const SUCCESS_CELEBRATION_MS = 2200;
const SCORE_SMOOTHING = 0.24;
const GUIDE_CONNECTIONS: Array<[keyof ReturnType<typeof getPoseGuide>["points"], keyof ReturnType<typeof getPoseGuide>["points"]]> = [
  ["head", "leftShoulder"],
  ["head", "rightShoulder"],
  ["leftShoulder", "rightShoulder"],
  ["leftShoulder", "leftElbow"],
  ["leftElbow", "leftWrist"],
  ["rightShoulder", "rightElbow"],
  ["rightElbow", "rightWrist"],
  ["leftShoulder", "leftHip"],
  ["rightShoulder", "rightHip"],
  ["leftHip", "rightHip"],
  ["leftHip", "leftKnee"],
  ["leftKnee", "leftAnkle"],
  ["rightHip", "rightKnee"],
  ["rightKnee", "rightAnkle"],
];

type AttemptSnapshot = {
  score: number;
  tier: ResultTier;
  breakdown: Record<string, number>;
};

const drawPoseGuideOverlay = ({
  ctx,
  guide,
  height,
  remainingMs,
  stageTitle,
  width,
}: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  stageTitle: string;
  guide: ReturnType<typeof getPoseGuide>;
  remainingMs: number;
}) => {
  const panelWidth = Math.min(420, width * 0.42);
  const panelHeight = Math.min(420, height * 0.76);
  const panelX = 28;
  const panelY = Math.max(24, (height - panelHeight) / 2);
  const figureSize = Math.min(220, panelWidth - 64);
  const figureX = panelX + (panelWidth - figureSize) / 2;
  const figureY = panelY + 110;

  ctx.fillStyle = "rgba(8, 8, 10, 0.62)";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(12, 12, 14, 0.9)";
  ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

  ctx.strokeStyle = "#b8ff41";
  ctx.lineWidth = 4;
  ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

  ctx.fillStyle = "#b8ff41";
  ctx.font = '800 14px "Arial Black", Inter, sans-serif';
  ctx.fillText("POSE PREVIEW", panelX + 24, panelY + 34);

  ctx.fillStyle = "#ffffff";
  ctx.font = '900 28px "Arial Black", Inter, sans-serif';
  ctx.fillText(guide.label, panelX + 24, panelY + 74);

  ctx.font = "600 16px Inter, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.fillText(stageTitle, panelX + 24, panelY + panelHeight - 72);
  ctx.fillText(guide.cue, panelX + 24, panelY + panelHeight - 42, panelWidth - 48);

  ctx.strokeStyle = "rgba(184,255,65,0.95)";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";

  GUIDE_CONNECTIONS.forEach(([fromKey, toKey]) => {
    const from = guide.points[fromKey];
    const to = guide.points[toKey];
    ctx.beginPath();
    ctx.moveTo(figureX + from.x * figureSize, figureY + from.y * figureSize);
    ctx.lineTo(figureX + to.x * figureSize, figureY + to.y * figureSize);
    ctx.stroke();
  });

  Object.values(guide.points).forEach((point, index) => {
    const x = figureX + point.x * figureSize;
    const y = figureY + point.y * figureSize;
    ctx.fillStyle = index === 0 ? "#ffffff" : "#b8ff41";
    ctx.beginPath();
    ctx.arc(x, y, index === 0 ? 14 : 8, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#ffffff";
  ctx.font = '700 16px "Arial Black", Inter, sans-serif';
  ctx.fillText(`Starts in ${(remainingMs / 1000).toFixed(1)}s`, panelX + 24, panelY + panelHeight - 104);
};

const drawSuccessOverlay = ({
  ctx,
  height,
  memeAccent,
  memeImage,
  memeName,
  memeSticker,
  progress,
  score,
  stageTitle,
  width,
}: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  score: number;
  stageTitle: string;
  memeName: string;
  memeSticker: string;
  memeAccent: string;
  memeImage: HTMLImageElement | null;
  progress: number;
}) => {
  const pulse = 1 + 0.035 * Math.sin(progress * Math.PI * 5);
  const cardWidth = Math.min(320, width * 0.34);
  const cardHeight = Math.min(250, height * 0.42);
  const cardX = width - cardWidth - 28;
  const cardY = height - cardHeight - 28 - Math.sin(progress * Math.PI) * 18;

  ctx.fillStyle = "rgba(6, 6, 8, 0.2)";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = memeAccent;
  ctx.lineWidth = 10 + pulse * 2;
  ctx.strokeRect(18, 18, width - 36, height - 36);

  ctx.fillStyle = "rgba(10, 10, 12, 0.88)";
  ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

  if (memeImage?.complete && memeImage.naturalWidth > 0) {
    ctx.drawImage(memeImage, cardX + 16, cardY + 16, cardWidth - 32, cardHeight - 94);
  }

  ctx.fillStyle = memeAccent;
  ctx.font = '900 18px "Arial Black", Inter, sans-serif';
  ctx.fillText(memeSticker, cardX + 16, cardY + cardHeight - 50);

  ctx.fillStyle = "#ffffff";
  ctx.font = '700 24px "Arial Black", Inter, sans-serif';
  ctx.fillText(memeName, cardX + 16, cardY + cardHeight - 20);

  ctx.fillStyle = memeAccent;
  ctx.font = '900 54px "Arial Black", Inter, sans-serif';
  ctx.fillText("CLEAR", 34, height - 42);

  ctx.fillStyle = "#ffffff";
  ctx.font = '700 26px "Arial Black", Inter, sans-serif';
  ctx.fillText(stageTitle, 34, height - 84);

  ctx.font = '700 18px Inter, sans-serif';
  ctx.fillText(`${score} pts`, 36, 52);
  ctx.fillText("Hold locked. Enjoy the hit.", 36, 78);
};

const drawDuetSuccessOverlay = ({
  ctx,
  height,
  memeAccent,
  score,
  width,
}: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  score: number;
  memeAccent: string;
}) => {
  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(10, 10, 12, 0.88)";
  ctx.fillRect(width / 2 - 170, 24, 340, 76);
  ctx.strokeStyle = memeAccent;
  ctx.lineWidth = 4;
  ctx.strokeRect(width / 2 - 170, 24, 340, 76);

  ctx.fillStyle = memeAccent;
  ctx.font = '900 18px "Arial Black", Inter, sans-serif';
  ctx.fillText("DUET CLEAR", width / 2 - 146, 54);
  ctx.fillStyle = "#ffffff";
  ctx.font = '700 16px "Arial Black", Inter, sans-serif';
  ctx.fillText(`${score} pts · keep both sides in frame`, width / 2 - 146, 78);
};

const drawCountdownOverlay = ({
  ctx,
  remainingSeconds,
  width,
}: {
  ctx: CanvasRenderingContext2D;
  remainingSeconds: number;
  width: number;
}) => {
  const isCritical = remainingSeconds <= 5;
  const label = `${remainingSeconds}s`;
  const badgeWidth = isCritical ? 118 : 104;
  const badgeHeight = isCritical ? 68 : 60;
  const badgeX = width - badgeWidth - 24;
  const badgeY = 120;

  ctx.fillStyle = isCritical ? "rgba(255, 123, 107, 0.94)" : "rgba(9, 9, 11, 0.76)";
  ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
  ctx.strokeStyle = isCritical ? "#ffb2a8" : "rgba(255,255,255,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);

  ctx.fillStyle = "#ffffff";
  ctx.font = '700 11px Inter, sans-serif';
  ctx.fillText("TIME LEFT", badgeX + 14, badgeY + 18);
  ctx.font = isCritical ? '900 34px "Arial Black", Inter, sans-serif' : '800 30px "Arial Black", Inter, sans-serif';
  ctx.fillText(label, badgeX + 14, badgeY + 50);
};

const getVideoDrawRect = ({
  containerHeight,
  containerWidth,
  video,
  x,
  y,
}: {
  x: number;
  y: number;
  containerWidth: number;
  containerHeight: number;
  video: HTMLVideoElement | null;
}) => {
  if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
    return {
      drawX: x,
      drawY: y,
      drawWidth: containerWidth,
      drawHeight: containerHeight,
    };
  }

  const scale = Math.min(
    containerWidth / video.videoWidth,
    containerHeight / video.videoHeight,
  );
  const drawWidth = video.videoWidth * scale;
  const drawHeight = video.videoHeight * scale;

  return {
    drawX: x + (containerWidth - drawWidth) / 2,
    drawY: y + (containerHeight - drawHeight) / 2,
    drawWidth,
    drawHeight,
  };
};

const drawVideoPanel = ({
  ctx,
  height,
  label,
  video,
  width,
  x,
  y,
  mirrored = false,
}: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  width: number;
  height: number;
  video: HTMLVideoElement | null;
  label: string;
  mirrored?: boolean;
}) => {
  ctx.fillStyle = "rgba(15, 15, 18, 0.96)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
    const { drawX, drawY, drawWidth, drawHeight } = getVideoDrawRect({
      x,
      y,
      containerWidth: width,
      containerHeight: height,
      video,
    });

    ctx.save();
    if (mirrored) {
      ctx.translate(drawX + drawWidth, drawY);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, drawWidth, drawHeight);
    } else {
      ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
    }
    ctx.restore();
  }

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(x + 12, y + 12, Math.min(180, width - 24), 30);
  ctx.fillStyle = "#ffffff";
  ctx.font = '700 13px Inter, sans-serif';
  ctx.fillText(label, x + 24, y + 31);
};

export const PlayExperience = ({ initialData }: PlayExperienceProps) => {
  const router = useRouter();
  const [selectedStageId, setSelectedStageId] = useState(
    initialData.referenceClip?.stageId ?? getInitialStage(initialData.stages, initialData.progressByStageId)?.id ?? "",
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState(
    initialData.referenceClip
      ? `Match @${initialData.referenceClip.authorHandle}'s clip and record your side.`
      : "Pick a stage and turn on your camera.",
  );
  const [score, setScore] = useState(0);
  const [tier, setTier] = useState<ResultTier>("fail");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [matchMs, setMatchMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rawPreviewUrl, setRawPreviewUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploadVariant, setUploadVariant] = useState<UploadVariant>("raw");
  const [isPublishing, setIsPublishing] = useState(false);
  const [progressByStageId, setProgressByStageId] = useState(
    initialData.progressByStageId,
  );
  const [recentSessions, setRecentSessions] = useState(initialData.recentSessions);
  const [profileSnapshot, setProfileSnapshot] = useState({
    bestScore: initialData.profile.bestScore,
    totalPlayCount: initialData.profile.totalPlayCount,
    uploadedPlayCount: initialData.profile.uploadedPlayCount,
  });

  const ladderScrollRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const referenceVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cleanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cleanCanvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const rawRecorderRef = useRef<MediaRecorder | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const guideTimeoutRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rawChunksRef = useRef<Blob[]>([]);
  const recordBlobRef = useRef<Blob | null>(null);
  const rawRecordBlobRef = useRef<Blob | null>(null);
  const latestBreakdownRef = useRef<Record<string, number>>({});
  const latestScoreRef = useRef(0);
  const latestTierRef = useRef<ResultTier>("fail");
  const matchMsRef = useRef(0);
  const hasFinishedRef = useRef(false);
  const celebrationStartedRef = useRef(false);
  const celebrationImageRef = useRef<HTMLImageElement | null>(null);
  const smoothedScoreRef = useRef(0);
  const bestAttemptRef = useRef<AttemptSnapshot & { holdMs: number }>({
    score: 0,
    tier: "fail",
    breakdown: {
      overall: 0,
      center: 0,
    },
    holdMs: 0,
  });

  const selectedStage = useMemo(
    () => initialData.stages.find((stage) => stage.id === selectedStageId) ?? null,
    [initialData.stages, selectedStageId],
  );
  const selectedStageMeme = selectedStage?.memeAsset ?? null;
  const selectedPoseGuide = useMemo(
    () => (selectedStage ? getPoseGuide(selectedStage.ruleConfig) : null),
    [selectedStage],
  );

  const unlockedStages = useMemo(
    () =>
      initialData.stages.filter((stage) => Boolean(progressByStageId[stage.id])),
    [initialData.stages, progressByStageId],
  );
  const holdPercent = selectedStage
    ? Math.min(100, Math.round((matchMs / selectedStage.ruleConfig.holdMs) * 100))
    : 0;
  const duetReferenceClip =
    initialData.referenceClip && initialData.referenceClip.stageId === selectedStage?.id
      ? initialData.referenceClip
      : null;
  const isDuetMode = Boolean(duetReferenceClip);
  const effectiveUploadVariant: UploadVariant = isDuetMode ? "overlay" : uploadVariant;
  const duetCaptionPrefix = duetReferenceClip ? `with @${duetReferenceClip.authorHandle}` : "";
  const selectedUploadBlob =
    effectiveUploadVariant === "raw" ? rawRecordBlobRef.current : recordBlobRef.current;
  const selectedPreviewUrl =
    effectiveUploadVariant === "raw"
      ? rawPreviewUrl ?? previewUrl
      : previewUrl ?? rawPreviewUrl;
  const isResultReady =
    phase === "result" && Boolean(selectedPreviewUrl) && Boolean(sessionId) && Boolean(selectedUploadBlob);
  const canPublish = phase === "result" && isResultReady && !isPublishing;

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (guideTimeoutRef.current) {
        window.clearTimeout(guideTimeoutRef.current);
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      referenceVideoRef.current?.pause();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (rawPreviewUrl) {
        URL.revokeObjectURL(rawPreviewUrl);
      }
    };
  }, [previewUrl, rawPreviewUrl]);

  useEffect(() => {
    celebrationImageRef.current = null;
    if (!selectedStageMeme?.publicUrl) {
      return;
    }

    const image = new Image();
    image.decoding = "async";
    image.src = selectedStageMeme.publicUrl;
    image.onload = () => {
      celebrationImageRef.current = image;
    };
    image.onerror = () => {
      celebrationImageRef.current = null;
    };
  }, [selectedStageMeme]);

  const stopRenderLoop = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const stopPlayback = () => {
    stopRenderLoop();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (guideTimeoutRef.current) {
      window.clearTimeout(guideTimeoutRef.current);
      guideTimeoutRef.current = null;
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    videoRef.current?.pause();
    referenceVideoRef.current?.pause();
  };

  const renderCameraScene = (
    ctx: CanvasRenderingContext2D,
    outputCanvas: HTMLCanvasElement,
  ) => {
    const cameraVideo = videoRef.current;
    if (!cameraVideo) {
      return;
    }

    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

    if (duetReferenceClip) {
      const gutter = 18;
      const frameX = 18;
      const frameY = 18;
      const frameHeight = outputCanvas.height - frameY * 2;
      const frameWidth = (outputCanvas.width - frameX * 2 - gutter) / 2;

      drawVideoPanel({
        ctx,
        x: frameX,
        y: frameY,
        width: frameWidth,
        height: frameHeight,
        video: referenceVideoRef.current,
        label: `with @${duetReferenceClip.authorHandle}`,
      });
      drawVideoPanel({
        ctx,
        x: frameX + frameWidth + gutter,
        y: frameY,
        width: frameWidth,
        height: frameHeight,
        video: cameraVideo,
        label: "You",
        mirrored: true,
      });
      return;
    }

    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(
      cameraVideo,
      -outputCanvas.width,
      0,
      outputCanvas.width,
      outputCanvas.height,
    );
    ctx.restore();
  };

  const renderCleanCameraScene = () => {
    const cameraVideo = videoRef.current;
    const cleanCanvas = cleanCanvasRef.current;
    const cleanCtx = cleanCanvasCtxRef.current;
    if (!cameraVideo || !cleanCanvas || !cleanCtx) {
      return;
    }

    cleanCtx.clearRect(0, 0, cleanCanvas.width, cleanCanvas.height);
    cleanCtx.fillStyle = "#050505";
    cleanCtx.fillRect(0, 0, cleanCanvas.width, cleanCanvas.height);
    cleanCtx.save();
    cleanCtx.scale(-1, 1);
    cleanCtx.drawImage(
      cameraVideo,
      -cleanCanvas.width,
      0,
      cleanCanvas.width,
      cleanCanvas.height,
    );
    cleanCtx.restore();
  };

  const resolveAttemptSnapshot = (snapshot?: AttemptSnapshot): AttemptSnapshot => {
    if (bestAttemptRef.current.score > 0 || bestAttemptRef.current.holdMs > 0) {
      return {
        score: bestAttemptRef.current.score,
        tier: bestAttemptRef.current.tier,
        breakdown: bestAttemptRef.current.breakdown,
      };
    }

    return (
      snapshot ?? {
        score: latestScoreRef.current,
        tier: latestTierRef.current,
        breakdown: latestBreakdownRef.current,
      }
    );
  };

  const startSuccessCelebration = (snapshot: {
    score: number;
    tier: ResultTier;
    breakdown: Record<string, number>;
  }) => {
    if (!selectedStage || !videoRef.current || !canvasRef.current) {
      void finishAttempt(true, snapshot);
      return;
    }

    if (celebrationStartedRef.current) {
      return;
    }

    celebrationStartedRef.current = true;
    setPhase("celebrating");
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const celebrationSnapshot = resolveAttemptSnapshot(snapshot);
    setStatus(
      selectedStageMeme
        ? `${selectedStageMeme.title} landed. Hold the moment.`
        : "Clear locked. Hold the moment.",
    );

    const video = videoRef.current;
    const outputCanvas = canvasRef.current;
    const ctx = outputCanvas.getContext("2d");
    if (!ctx) {
      void finishAttempt(true, snapshot);
      return;
    }

    const startedAt = performance.now();
    const renderCelebration = () => {
      renderCleanCameraScene();
      renderCameraScene(ctx, outputCanvas);

      if (duetReferenceClip) {
        drawDuetSuccessOverlay({
          ctx,
          width: outputCanvas.width,
          height: outputCanvas.height,
          score: celebrationSnapshot.score,
          memeAccent: selectedStageMeme?.accent ?? "#b8ff41",
        });
      } else {
        drawSuccessOverlay({
          ctx,
          width: outputCanvas.width,
          height: outputCanvas.height,
          score: celebrationSnapshot.score,
          stageTitle: `Stage ${selectedStage.stageNumber} · ${selectedStage.title}`,
          memeName: selectedStageMeme?.title ?? "Victory Meme",
          memeSticker: selectedStageMeme?.successSticker ?? "CLEAR",
          memeAccent: selectedStageMeme?.accent ?? "#b8ff41",
          memeImage: celebrationImageRef.current,
          progress: Math.min(1, (performance.now() - startedAt) / SUCCESS_CELEBRATION_MS),
        });
      }

      if (performance.now() - startedAt >= SUCCESS_CELEBRATION_MS) {
        void finishAttempt(true, celebrationSnapshot);
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(renderCelebration);
    };

    renderCelebration();
  };

  const finishAttempt = async (
    didSucceed: boolean,
    snapshot?: {
      score: number;
      tier: ResultTier;
      breakdown: Record<string, number>;
    },
  ) => {
    if (!selectedStage || !startTimeRef.current) {
      return;
    }
    if (hasFinishedRef.current && !snapshot) {
      return;
    }
    hasFinishedRef.current = true;

    stopRenderLoop();

    const now = new Date();
    const attemptStartedAt = new Date(startTimeRef.current).toISOString();
    const attemptFinishedAt = now.toISOString();
    const durationSeconds = Math.max(
      1,
      Math.min(
        selectedStage.timeLimitSeconds,
        Math.round((Date.now() - startTimeRef.current) / 1000),
      ),
    );
    const resolvedSnapshot = resolveAttemptSnapshot(snapshot);
    const finalScore = resolvedSnapshot.score;
    const finalTier = resolvedSnapshot.tier;
    const finalBreakdown = resolvedSnapshot.breakdown;

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    if (rawRecorderRef.current?.state === "recording") {
      rawRecorderRef.current.stop();
    }
    stopPlayback();

    try {
      const createdSessionId = await createPlaySession({
        stageId: selectedStage.id,
        score: finalScore,
        resultTier: finalTier,
        success: didSucceed,
        attemptStartedAt,
        attemptFinishedAt,
        durationSeconds,
        similarityBreakdown: finalBreakdown,
      });
      setSessionId(createdSessionId);
      setRecentSessions((current) => {
        const nextSession: PlaySessionRecord = {
          id: createdSessionId,
          userId: initialData.profile.userId,
          stageId: selectedStage.id,
          score: finalScore,
          resultTier: finalTier,
          success: didSucceed,
          attemptStartedAt,
          attemptFinishedAt,
          durationSeconds,
          similarityBreakdown: finalBreakdown,
          uploadedVideoPath: null,
          uploadedThumbnailPath: null,
          uploadedAt: null,
          createdPostId: null,
          createdAt: attemptFinishedAt,
        };

        return [nextSession, ...current].slice(0, 8);
      });
      setProfileSnapshot((current) => ({
        ...current,
        bestScore: Math.max(current.bestScore, finalScore),
        totalPlayCount: current.totalPlayCount + 1,
      }));

      setProgressByStageId((current) => {
        const existing = current[selectedStage.id];
        const currentIndex = initialData.stages.findIndex(
          (stage) => stage.id === selectedStage.id,
        );
        const nextStage = initialData.stages[currentIndex + 1];

        return {
          ...current,
          [selectedStage.id]: {
            id: existing?.id ?? crypto.randomUUID(),
            userId: initialData.profile.userId,
            stageId: selectedStage.id,
            bestScore: Math.max(existing?.bestScore ?? 0, finalScore),
            attemptCount: (existing?.attemptCount ?? 0) + 1,
            unlockedAt: existing?.unlockedAt ?? new Date().toISOString(),
            clearedAt: didSucceed
              ? existing?.clearedAt ?? new Date().toISOString()
              : existing?.clearedAt ?? null,
            lastAttemptedAt: new Date().toISOString(),
          },
          ...(didSucceed && nextStage
            ? {
                [nextStage.id]: current[nextStage.id] ?? {
                  id: crypto.randomUUID(),
                  userId: initialData.profile.userId,
                  stageId: nextStage.id,
                  bestScore: 0,
                  attemptCount: 0,
                  unlockedAt: new Date().toISOString(),
                  clearedAt: null,
                  lastAttemptedAt: null,
                },
              }
            : {}),
        };
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save play session.",
      );
    }

    setPhase("result");
    setScore(finalScore);
    setTier(finalTier);
    setStatus(
      didSucceed
        ? "Pose locked. Upload it when you're ready."
        : "Good try. Review the clip, then run it back.",
    );
  };

  const startChallenge = async () => {
    if (!selectedStage) {
      return;
    }

    setErrorMessage(null);
    setPhase("preparing");
    setStatus("Requesting camera access and loading pose model...");
    setScore(0);
    setTier("fail");
    setMatchMs(0);
    setCaption("");
    setSessionId(null);
    setUploadVariant(isDuetMode ? "overlay" : "raw");
    hasFinishedRef.current = false;
    celebrationStartedRef.current = false;
    latestScoreRef.current = 0;
    latestTierRef.current = "fail";
    smoothedScoreRef.current = 0;
    bestAttemptRef.current = {
      score: 0,
      tier: "fail",
      breakdown: {
        overall: 0,
        center: 0,
      },
      holdMs: 0,
    };
    matchMsRef.current = 0;
    recordBlobRef.current = null;
    rawRecordBlobRef.current = null;
    chunksRef.current = [];
    rawChunksRef.current = [];
    recorderRef.current = null;
    rawRecorderRef.current = null;
    cleanCanvasRef.current = null;
    cleanCanvasCtxRef.current = null;
    latestBreakdownRef.current = {};

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (rawPreviewUrl) {
      URL.revokeObjectURL(rawPreviewUrl);
      setRawPreviewUrl(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 960 },
          height: { ideal: 540 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      const video = videoRef.current;
      const referenceVideo = referenceVideoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        throw new Error("Camera surface is not ready.");
      }

      video.srcObject = stream;
      await video.play();

      if (referenceVideo && duetReferenceClip) {
        if (referenceVideo.readyState < 2) {
          await new Promise<void>((resolve, reject) => {
            const onLoaded = () => {
              cleanup();
              resolve();
            };
            const onError = () => {
              cleanup();
              reject(new Error("Reference clip could not be loaded."));
            };
            const cleanup = () => {
              referenceVideo.removeEventListener("loadeddata", onLoaded);
              referenceVideo.removeEventListener("error", onError);
            };
            referenceVideo.addEventListener("loadeddata", onLoaded);
            referenceVideo.addEventListener("error", onError);
          });
        }

        referenceVideo.currentTime = 0;
        referenceVideo.muted = true;
        referenceVideo.loop = true;
        await referenceVideo.play();
      }

      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
      const landmarker =
        landmarkerRef.current ??
        (await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_URL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        }));
      landmarkerRef.current = landmarker;

      const outputCanvas = canvas;
      outputCanvas.width = video.videoWidth || 960;
      outputCanvas.height = video.videoHeight || 540;
      const cleanCanvas = document.createElement("canvas");
      cleanCanvas.width = outputCanvas.width;
      cleanCanvas.height = outputCanvas.height;
      cleanCanvasRef.current = cleanCanvas;

      const ctx = outputCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas context could not be created.");
      }
      const cleanCtx = cleanCanvas.getContext("2d");
      if (!cleanCtx) {
        throw new Error("Clean canvas context could not be created.");
      }
      cleanCanvasCtxRef.current = cleanCtx;

      const startRecorder = () => {
        const recorderStream = outputCanvas.captureStream(24);
        const mimeType = getSupportedRecorderMimeType();
        const recorder = new MediaRecorder(
          recorderStream,
          mimeType ? { mimeType } : undefined,
        );
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: mimeType || "video/webm",
          });
          recordBlobRef.current = blob;
          const localUrl = URL.createObjectURL(blob);
          setPreviewUrl((current) => {
            if (current) {
              URL.revokeObjectURL(current);
            }
            return localUrl;
          });
        };
        recorder.start(400);

        if (!isDuetMode) {
          renderCleanCameraScene();
          const rawRecorderStream = cleanCanvas.captureStream(24);
          const rawRecorder = new MediaRecorder(
            rawRecorderStream,
            mimeType ? { mimeType } : undefined,
          );
          rawRecorderRef.current = rawRecorder;
          rawRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              rawChunksRef.current.push(event.data);
            }
          };
          rawRecorder.onstop = () => {
            const blob = new Blob(rawChunksRef.current, {
              type: mimeType || "video/webm",
            });
            rawRecordBlobRef.current = blob;
            const localUrl = URL.createObjectURL(blob);
            setRawPreviewUrl((current) => {
              if (current) {
                URL.revokeObjectURL(current);
              }
              return localUrl;
            });
          };
          rawRecorder.start(400);
        }
      };

      const frameLoop = () => {
        if (!videoRef.current || !canvasRef.current || !selectedStage) {
          return;
        }

        renderCleanCameraScene();
        renderCameraScene(ctx, outputCanvas);

        const detection = landmarker.detectForVideo(
          videoRef.current,
          performance.now(),
        );
        const pose = detection.landmarks?.[0];
        const rawPoseScore = scorePose(pose, selectedStage.ruleConfig);
        const smoothedScore =
          smoothedScoreRef.current === 0
            ? rawPoseScore.score
            : smoothedScoreRef.current * (1 - SCORE_SMOOTHING) +
              rawPoseScore.score * SCORE_SMOOTHING;
        smoothedScoreRef.current = smoothedScore;
        const poseScore = {
          ...rawPoseScore,
          score: Math.round(smoothedScore),
          tier: getResultTier(Math.round(smoothedScore)),
        };
        const liveBreakdown = {
          ...rawPoseScore.breakdown,
          overall: poseScore.score,
        };

        latestBreakdownRef.current = liveBreakdown;
        latestScoreRef.current = poseScore.score;
        latestTierRef.current = poseScore.tier;
        setScore(poseScore.score);
        setTier(poseScore.tier);
        const nextValue =
          poseScore.score >= selectedStage.minScoreToClear
            ? Math.min(
                selectedStage.ruleConfig.holdMs,
                matchMsRef.current + 42,
              )
            : Math.max(0, matchMsRef.current - 84);
        matchMsRef.current = nextValue;
        setMatchMs(nextValue);
        if (
          poseScore.score > bestAttemptRef.current.score ||
          (poseScore.score === bestAttemptRef.current.score &&
            nextValue >= bestAttemptRef.current.holdMs)
        ) {
          bestAttemptRef.current = {
            score: poseScore.score,
            tier: poseScore.tier,
            breakdown: liveBreakdown,
            holdMs: nextValue,
          };
        }

        if (nextValue >= selectedStage.ruleConfig.holdMs && !hasFinishedRef.current) {
          startSuccessCelebration({
            score: poseScore.score,
            tier: poseScore.tier,
            breakdown: liveBreakdown,
          });
          return;
        }

        ctx.fillStyle = "rgba(0,0,0,0.38)";
        ctx.fillRect(16, 16, outputCanvas.width - 32, 104);
        ctx.fillStyle = "#ffffff";
        ctx.font = "600 20px Inter";
        ctx.fillText(`Stage ${selectedStage.stageNumber} · ${selectedStage.title}`, 36, 48);
        ctx.font = "500 15px Inter";
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.fillText(selectedStage.instructionText, 36, 78);

        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(36, 92, outputCanvas.width - 72, 16);
        ctx.fillStyle = poseScore.score >= selectedStage.minScoreToClear ? "#b8ff41" : "#ff7b6b";
        ctx.fillRect(
          36,
          92,
          ((outputCanvas.width - 72) * poseScore.score) / 100,
          16,
        );
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 28px Inter";
        ctx.fillText(`${poseScore.score}`, outputCanvas.width - 92, 52);
        ctx.font = "600 14px Inter";
        ctx.fillText(
          `${Math.min(
            100,
            Math.round((nextValue / selectedStage.ruleConfig.holdMs) * 100),
          )}% hold`,
          outputCanvas.width - 140,
          82,
        );

        const elapsedSeconds = startTimeRef.current
          ? (Date.now() - startTimeRef.current) / 1000
          : 0;
        const remainingSeconds = Math.max(
          0,
          Math.ceil(selectedStage.timeLimitSeconds - elapsedSeconds),
        );
        drawCountdownOverlay({
          ctx,
          remainingSeconds,
          width: outputCanvas.width,
        });

        if (pose) {
          ctx.fillStyle = "#b8ff41";
          const duetCameraRect = isDuetMode
            ? getVideoDrawRect({
                x: outputCanvas.width / 2 + 9,
                y: 18,
                containerWidth: outputCanvas.width / 2 - 27,
                containerHeight: outputCanvas.height - 36,
                video: videoRef.current,
              })
            : null;
          const cameraOffsetX = duetCameraRect?.drawX ?? 0;
          const cameraFrameWidth = duetCameraRect?.drawWidth ?? outputCanvas.width;
          const cameraFrameHeight = duetCameraRect?.drawHeight ?? outputCanvas.height;
          const cameraOffsetY = duetCameraRect?.drawY ?? 0;

          for (const point of pose) {
            const x = cameraOffsetX + cameraFrameWidth - point.x * cameraFrameWidth;
            const y = cameraOffsetY + point.y * cameraFrameHeight;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        animationFrameRef.current = window.requestAnimationFrame(frameLoop);
      };

      const beginScoringLoop = () => {
        startRecorder();
        startTimeRef.current = Date.now();
        setSecondsLeft(selectedStage.timeLimitSeconds);
        setPhase("playing");
        setStatus("Hit the target pose and hold it.");
        frameLoop();

        timerRef.current = window.setInterval(() => {
          setSecondsLeft((current) => {
            if (current <= 1) {
              window.clearInterval(timerRef.current ?? undefined);
              void finishAttempt(false);
              return 0;
            }

            return current - 1;
          });
        }, 1000);
      };

      if (selectedPoseGuide && !isDuetMode) {
        setPhase("guiding");
        setStatus(`Watch ${selectedPoseGuide.label}, then copy it.`);

        const guideStartedAt = performance.now();
        const renderGuideLoop = () => {
          renderCleanCameraScene();
          renderCameraScene(ctx, outputCanvas);

          const elapsed = performance.now() - guideStartedAt;
          drawPoseGuideOverlay({
            ctx,
            width: outputCanvas.width,
            height: outputCanvas.height,
            stageTitle: `Stage ${selectedStage.stageNumber} · ${selectedStage.title}`,
            guide: selectedPoseGuide,
            remainingMs: Math.max(0, GUIDE_PREVIEW_MS - elapsed),
          });

          if (elapsed >= GUIDE_PREVIEW_MS) {
            beginScoringLoop();
            return;
          }

          animationFrameRef.current = window.requestAnimationFrame(renderGuideLoop);
        };

        renderGuideLoop();
      } else {
        beginScoringLoop();
      }
    } catch (error) {
      setPhase("idle");
      stopPlayback();
      setErrorMessage(
        error instanceof Error ? error.message : "Camera setup failed.",
      );
    }
  };

  const handlePublish = async () => {
    if (phase !== "result") {
      setErrorMessage("Finish a run first. Upload unlocks after the result clip is created.");
      return;
    }

    if (!previewUrl || !selectedUploadBlob || !sessionId) {
      setErrorMessage("The clip is still being finalized. Wait for the preview, then upload.");
      return;
    }

    if (!selectedStage || !canvasRef.current) {
      setErrorMessage("The result is missing required stage data. Run the stage again.");
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);

    try {
      const chosenBlob = selectedUploadBlob;
      const preparedCaption = duetReferenceClip
        ? `${duetCaptionPrefix}${caption.trim() ? ` · ${caption.trim()}` : ""}`
        : caption;
      const videoFile = blobToFile(
        chosenBlob,
        `${selectedStage.slug}-${sessionId}.webm`,
      );
      const posterFile =
        uploadVariant === "raw"
          ? await videoBlobToJpegFile(
              chosenBlob,
              `${selectedStage.slug}-${sessionId}.jpg`,
            )
          : await canvasToJpegFile(
              canvasRef.current,
              `${selectedStage.slug}-${sessionId}.jpg`,
            );

      await publishPlaySession({
        sessionId,
        caption: preparedCaption,
        videoFile,
        posterFile,
        stageId: selectedStage.id,
        score: bestAttemptRef.current.score || score,
      });

      setStatus("Uploaded to the public feed. Heading back to the feed...");
      setProfileSnapshot((current) => ({
        ...current,
        uploadedPlayCount: current.uploadedPlayCount + 1,
      }));
      setRecentSessions((current) =>
        current.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                uploadedAt: new Date().toISOString(),
              }
            : session,
        ),
      );

      window.setTimeout(() => {
        router.push("/feed?sort=latest");
        router.refresh();
      }, 900);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Publishing failed.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-[1320px] px-2 py-2">
        {/* ── Top Bar ── */}
        <div className="mb-2 flex items-center justify-between">
          <Link
            href="/feed"
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <span aria-hidden="true">←</span>
            Back to Feed
          </Link>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-900">{initialData.profile.displayName}</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600">
              Best {profileSnapshot.bestScore}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600">
              {profileSnapshot.totalPlayCount} plays
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-row">
        {/* ── MAIN CONTENT: Challenge Area ── */}
        <section className="min-w-0 flex-1 space-y-2">
          {selectedStage ? (
            <>
              {/* Stage Header */}
              <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-sm font-black tracking-tight text-zinc-900">
                    Stage {selectedStage.stageNumber}: {selectedStage.title}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-zinc-500 line-clamp-1">
                    {selectedStage.instructionText}
                  </p>
                  {selectedStageMeme?.publicUrl ? (
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                      <img
                        src={selectedStageMeme.publicUrl}
                        alt={selectedStageMeme.title}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                          Meme Target
                        </p>
                        <p className="truncate text-xs font-semibold text-zinc-900">
                          {selectedStageMeme.title}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {duetReferenceClip ? (
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Duet with @{duetReferenceClip.authorHandle}
                    </div>
                  ) : null}
                  <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-600">
                    ⏱ {formatTime(secondsLeft || selectedStage.timeLimitSeconds)}
                  </div>
                  <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-600">
                    🎯 {selectedStage.minScoreToClear}+
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={startChallenge}
                    disabled={
                      phase === "preparing" ||
                      phase === "guiding" ||
                      phase === "playing" ||
                      phase === "celebrating"
                    }
                    className="rounded-full bg-black px-6 text-sm text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {phase === "playing"
                      ? "● Live"
                      : phase === "guiding"
                        ? "Pose preview"
                        : phase === "celebrating"
                          ? "Celebrating"
                          : "Start challenge"}
                  </Button>
                </div>
              </div>

              <div>
                {/* Camera / Result viewport — stays dark for drama */}
                <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-900 shadow-sm">
                  <div className="flex items-center justify-between border-b border-zinc-700/50 px-3 py-1.5">
                    <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-zinc-400">{status}</p>
                    <div className="ml-2 flex items-center gap-1 text-right">
                      <p className="text-[9px] uppercase tracking-wide text-zinc-500">Score</p>
                      <p className="text-xl font-black text-[#b8ff41]">{score}</p>
                    </div>
                  </div>
                  <>
                    <video ref={videoRef} className="hidden" muted playsInline />
                    {duetReferenceClip ? (
                      <video
                        ref={referenceVideoRef}
                        className="hidden"
                        src={duetReferenceClip.videoUrl}
                        poster={duetReferenceClip.posterUrl ?? undefined}
                        muted
                        loop
                        playsInline
                        crossOrigin="anonymous"
                      />
                    ) : null}
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        className={`aspect-video w-full bg-zinc-900 object-contain ${
                          phase === "result" && previewUrl ? "hidden" : "block"
                        }`}
                      />
                      {duetReferenceClip &&
                      (phase === "idle" || phase === "preparing") &&
                      !selectedPreviewUrl ? (
                        <div className="absolute inset-0 grid grid-cols-1 gap-2 bg-zinc-950/60 p-3 md:grid-cols-2">
                          <div className="overflow-hidden rounded-lg border border-zinc-700 bg-black">
                            <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">
                                  Reference clip
                                </p>
                                <p className="mt-0.5 text-xs font-semibold text-white">
                                  @{duetReferenceClip.authorHandle}
                                </p>
                              </div>
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                                Stage {duetReferenceClip.stageNumber}
                              </span>
                            </div>
                            <video
                              src={duetReferenceClip.videoUrl}
                              poster={duetReferenceClip.posterUrl ?? undefined}
                              controls
                              playsInline
                              className="aspect-video w-full bg-black object-contain"
                            />
                            <div className="px-3 py-2">
                              <p className="text-xs font-semibold text-white">
                                {duetReferenceClip.stageTitle}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-4 text-zinc-400">
                                Watch the reference, then start your camera to mirror the move.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/80 px-4 py-4 text-center">
                            <div className="mx-auto inline-flex rounded-full bg-zinc-800 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                              Your side
                            </div>
                            <h3 className="mt-3 text-lg font-black tracking-tight text-white">
                              Match the rhythm, then hit Start
                            </h3>
                            <p className="mt-2 text-xs leading-5 text-zinc-400">
                              Upload keeps @{duetReferenceClip.authorHandle}&apos;s clip left, yours right.
                            </p>
                            <div className="mt-3 flex gap-1.5 text-left">
                              <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/70 p-2">
                                <p className="text-[9px] uppercase tracking-wide text-zinc-500">Step 1</p>
                                <p className="mt-0.5 text-[11px] font-semibold text-white">Watch clip</p>
                              </div>
                              <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/70 p-2">
                                <p className="text-[9px] uppercase tracking-wide text-zinc-500">Step 2</p>
                                <p className="mt-0.5 text-[11px] font-semibold text-white">Mirror pose</p>
                              </div>
                              <div className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/70 p-2">
                                <p className="text-[9px] uppercase tracking-wide text-zinc-500">Step 3</p>
                                <p className="mt-0.5 text-[11px] font-semibold text-white">Upload & DM</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={startChallenge}
                              disabled={phase === "preparing"}
                              className="mt-4 w-full rounded-full bg-[#b8ff41] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#a8ef31] disabled:opacity-50"
                            >
                              {phase === "preparing" ? "Preparing..." : "▶ Start Challenge"}
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {phase === "result" && selectedPreviewUrl ? (
                        <>
                          <div className="absolute left-4 top-4 z-10 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                            {effectiveUploadVariant === "raw"
                              ? "Clean face shot preview"
                              : isDuetMode
                                ? "Duet split-screen preview"
                                : "Scored highlight preview"}
                          </div>
                          <video
                            key={selectedPreviewUrl}
                            src={selectedPreviewUrl}
                            controls
                            className="aspect-video w-full bg-black object-contain"
                          />
                        </>
                      ) : null}
                      {isPublishing ? (
                        <SpinnerOverlay
                          message="Uploading duet clip"
                          description="Sending video, creating the post, and returning to the feed."
                        />
                      ) : null}
                      {(phase === "idle" || phase === "preparing") && selectedPoseGuide && !duetReferenceClip && (
                        <div
                          className={`absolute inset-0 flex overflow-y-auto ${
                            duetReferenceClip ? "items-end justify-end p-4" : "items-start justify-center p-4"
                          }`}
                        >
                          <div
                            className={`flex shrink-0 flex-col items-center rounded-2xl border border-zinc-700/50 bg-zinc-800/90 px-5 py-5 text-center backdrop-blur sm:px-8 sm:py-8 ${
                              duetReferenceClip ? "w-full max-w-[380px]" : "w-full max-w-[480px]"
                            }`}
                          >
                            <div className="rounded-full bg-zinc-700/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                              Camera standby
                            </div>
                            <h3 className="mt-3 text-xl font-black tracking-tight text-white sm:mt-5 sm:text-2xl">
                              {selectedStage.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-400 sm:mt-3">
                              {selectedStage.description}
                            </p>
                            {selectedStageMeme?.publicUrl ? (
                              <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900/80">
                                <img
                                  src={selectedStageMeme.publicUrl}
                                  alt={selectedStageMeme.title}
                                  className="h-28 w-full object-cover sm:h-36"
                                />
                              </div>
                            ) : null}
                            <div className="mt-3 flex w-full gap-2 text-left sm:mt-5">
                              <div className="flex-1 rounded-xl border border-zinc-700/50 bg-zinc-800/60 p-2.5 sm:p-3.5">
                                <p className="text-[10px] uppercase tracking-wide text-zinc-500 sm:text-[11px]">Step 1</p>
                                <p className="mt-1 text-xs font-semibold text-white sm:text-sm">Watch preview</p>
                              </div>
                              <div className="flex-1 rounded-xl border border-zinc-700/50 bg-zinc-800/60 p-2.5 sm:p-3.5">
                                <p className="text-[10px] uppercase tracking-wide text-zinc-500 sm:text-[11px]">Step 2</p>
                                <p className="mt-1 text-xs font-semibold text-white sm:text-sm">Match the pose</p>
                              </div>
                              <div className="flex-1 rounded-xl border border-zinc-700/50 bg-zinc-800/60 p-2.5 sm:p-3.5">
                                <p className="text-[10px] uppercase tracking-wide text-zinc-500 sm:text-[11px]">Step 3</p>
                                <p className="mt-1 text-xs font-semibold text-white sm:text-sm">Hold {selectedStage.minScoreToClear}+</p>
                              </div>
                            </div>
                            <div className="mt-3 rounded-[28px] border border-dashed border-zinc-600 bg-zinc-800/40 p-3 sm:mt-5 sm:p-5">
                              <svg viewBox="0 0 120 140" className="h-[100px] w-[86px] text-zinc-300 sm:h-[140px] sm:w-[120px]" fill="none">
                                {GUIDE_CONNECTIONS.map(([fromKey, toKey]) => {
                                  const from = selectedPoseGuide.points[fromKey];
                                  const to = selectedPoseGuide.points[toKey];
                                  return (
                                    <line
                                      key={`${fromKey}-${toKey}`}
                                      x1={from.x * 120}
                                      y1={from.y * 140}
                                      x2={to.x * 120}
                                      y2={to.y * 140}
                                      stroke="currentColor"
                                      strokeWidth="5"
                                      strokeLinecap="round"
                                    />
                                  );
                                })}
                                {Object.entries(selectedPoseGuide.points).map(([key, point]) => (
                                  <circle
                                    key={key}
                                    cx={point.x * 120}
                                    cy={point.y * 140}
                                    r={key === "head" ? 10 : 4}
                                    fill="currentColor"
                                  />
                                ))}
                              </svg>
                            </div>
                            <button
                              type="button"
                              onClick={startChallenge}
                              disabled={phase === "preparing"}
                              className="mt-4 w-full rounded-full bg-[#b8ff41] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#a8ef31] disabled:opacity-50 sm:mt-5"
                            >
                              {phase === "preparing" ? "Preparing..." : "▶ Start Challenge"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                </div>

              </div>

              {/* ── Stage Ladder: Arrow Navigation ── */}
              <div className="mt-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Stages
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Previous stages"
                      onClick={() => ladderScrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 bg-white text-[10px] text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      aria-label="Next stages"
                      onClick={() => ladderScrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 bg-white text-[10px] text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
                    >
                      ▶
                    </button>
                  </div>
                </div>
                <div
                  ref={ladderScrollRef}
                  className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {initialData.stages.map((stage) => {
                    const progress = progressByStageId[stage.id];
                    const isUnlocked = Boolean(progress);
                    const isSelected = stage.id === selectedStageId;
                    const isPinnedDuetStage =
                      !initialData.referenceClip || initialData.referenceClip.stageId === stage.id;
                    const statusLabel = progress?.bestScore
                      ? `${progress.bestScore} pts`
                      : isUnlocked
                        ? "Unlocked"
                        : "Locked";

                    return (
                      <button
                        key={stage.id}
                        type="button"
                        disabled={!isPinnedDuetStage || (!isUnlocked && !initialData.referenceClip)}
                        onClick={() => setSelectedStageId(stage.id)}
                        className={`shrink-0 rounded-lg border px-3 py-2 text-left transition-all ${
                          isSelected
                            ? "border-zinc-900 bg-zinc-900 text-white shadow-md shadow-zinc-900/10"
                            : isUnlocked
                              ? "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900"
                              : "cursor-not-allowed border-zinc-100 bg-zinc-50 opacity-60"
                        }`}
                        style={{ minWidth: "120px" }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                              isSelected ? "text-zinc-400" : isUnlocked ? "text-zinc-500" : "text-zinc-400"
                            }`}
                          >
                            Stage {stage.stageNumber}
                          </span>
                          <span
                            className={`rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wide ${
                              progress?.bestScore
                                ? isSelected
                                  ? "bg-[#b8ff41] text-black"
                                  : "bg-zinc-100 text-zinc-700"
                                : isUnlocked
                                  ? isSelected
                                    ? "bg-white/15 text-white/80"
                                    : "bg-zinc-100 text-zinc-500"
                                  : "bg-zinc-100 text-zinc-400"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <p
                          className={`mt-0.5 text-xs font-bold tracking-tight ${
                            isSelected ? "text-white" : "text-zinc-900"
                          }`}
                        >
                          {stage.title}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                No stage data
              </p>
              <h2 className="mt-3 text-2xl font-black text-zinc-900">Seeded stages were not found.</h2>
              <p className="mt-2 text-sm text-zinc-500">Please check your database seed has been run.</p>
            </div>
          )}
        </section>

        {/* ── RIGHT SIDEBAR: Telemetry + Publish ── */}
        <aside className="w-full space-y-2 lg:w-[260px] lg:shrink-0">
          {/* Attempt Telemetry */}
          <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Telemetry
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <div className="rounded-md bg-zinc-50 px-2.5 py-2 border border-zinc-100">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
                  Tier
                </p>
                <p className="mt-0.5 text-lg font-black uppercase text-zinc-900">
                  {tier}
                </p>
              </div>
              <div className="rounded-md bg-zinc-50 px-2.5 py-2 border border-zinc-100">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">
                  Hold
                </p>
                <p className="mt-0.5 text-lg font-black text-zinc-900">
                  {holdPercent}%
                </p>
              </div>
            </div>
            {errorMessage ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </p>
            ) : null}
          </div>

          {/* Publish to Feed */}
          <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Publish
            </p>
            {isDuetMode ? (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-900">
                  Split-screen duet
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  This upload keeps @{duetReferenceClip?.authorHandle}&apos;s clip on the left and your run on the right.
                </p>
              </div>
            ) : (
              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => setUploadVariant("raw")}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    uploadVariant === "raw"
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <p className="text-sm font-semibold">Clean face shot</p>
                  <p
                    className={`mt-1 text-xs ${
                      uploadVariant === "raw" ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    Upload the original camera clip without pose points or judging UI.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadVariant("overlay")}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    uploadVariant === "overlay"
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <p className="text-sm font-semibold">Scored highlight</p>
                  <p
                    className={`mt-1 text-xs ${
                      uploadVariant === "overlay" ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    Upload the version with score bar, pose dots, and clear celebration.
                  </p>
                </button>
              </div>
            )}
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Caption for your clip..."
              className="mt-1.5 h-12 w-full rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-200 transition-all"
            />
            {duetReferenceClip ? (
              <p className="mt-2 text-xs text-zinc-500">
                The post will tag {duetCaptionPrefix} automatically.
              </p>
            ) : null}
            <div className="mt-3 flex gap-3">
              <Button
                type="button"
                size="lg"
                className="flex-1 rounded-full bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
                disabled={!canPublish}
                onClick={handlePublish}
              >
                {isPublishing
                  ? "Uploading..."
                  : phase !== "result"
                    ? "Finish run to upload"
                    : !isResultReady
                      ? "Finalizing clip..."
                      : "Upload to public feed"}
              </Button>
            </div>
            {duetReferenceClip &&
            duetReferenceClip.authorUserId !== initialData.profile.userId &&
            phase === "result" ? (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                <p className="text-sm font-semibold text-zinc-900">
                  {selectedStage && score >= selectedStage.minScoreToClear
                    ? "You matched the vibe."
                    : "Want to talk about the clip?"}
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  DM @{duetReferenceClip.authorHandle} right after the run.
                </p>
                <div className="mt-3">
                  <StartDmButton
                    targetUserId={duetReferenceClip.authorUserId}
                    targetHandle={duetReferenceClip.authorHandle}
                    label="Send a DM"
                    variant="primary"
                    size="sm"
                    className="rounded-full px-4"
                  />
                </div>
              </div>
            ) : null}
            <p className="mt-1.5 text-[10px] leading-4 text-zinc-400">
              {phase !== "result"
                ? "The upload button unlocks after a recorded result is ready."
                : !isResultReady
                  ? "The clip is still being prepared. Upload becomes active as soon as preview generation finishes."
                  : effectiveUploadVariant === "raw"
                    ? "The video stays local until this button is pressed. The upload will use the clean camera clip."
                    : isDuetMode
                      ? "The video stays local until this button is pressed. The upload will publish the split-screen duet clip."
                      : "The video stays local until this button is pressed. The upload will use the judged highlight clip."}
            </p>
          </div>
        </aside>
        </div>
      </div>
    </div>
  );
};
