"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { Button } from "@/components/ui/Button";
import { createPlaySession, publishPlaySession } from "@/features/meme/browser";
import type {
  PlayDashboardData,
  PlaySessionRecord,
  ResultTier,
  StageProgressRecord,
  StageRecord,
} from "@/features/meme/types";
import { blobToFile, canvasToJpegFile, getSupportedRecorderMimeType } from "@/features/play/media";
import { scorePose } from "@/features/play/scoring";

type PlayExperienceProps = {
  initialData: PlayDashboardData;
};

type Phase = "idle" | "preparing" | "playing" | "result";

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

export const PlayExperience = ({ initialData }: PlayExperienceProps) => {
  const [selectedStageId, setSelectedStageId] = useState(
    getInitialStage(initialData.stages, initialData.progressByStageId)?.id ?? "",
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("Pick a stage and turn on your camera.");
  const [score, setScore] = useState(0);
  const [tier, setTier] = useState<ResultTier>("fail");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [matchMs, setMatchMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordBlobRef = useRef<Blob | null>(null);
  const latestBreakdownRef = useRef<Record<string, number>>({});
  const latestScoreRef = useRef(0);
  const latestTierRef = useRef<ResultTier>("fail");
  const matchMsRef = useRef(0);
  const hasFinishedRef = useRef(false);

  const selectedStage = useMemo(
    () => initialData.stages.find((stage) => stage.id === selectedStageId) ?? null,
    [initialData.stages, selectedStageId],
  );

  const unlockedStages = useMemo(
    () =>
      initialData.stages.filter((stage) => Boolean(progressByStageId[stage.id])),
    [initialData.stages, progressByStageId],
  );
  const holdPercent = selectedStage
    ? Math.min(100, Math.round((matchMs / selectedStage.ruleConfig.holdMs) * 100))
    : 0;
  const isResultReady =
    phase === "result" && Boolean(previewUrl) && Boolean(sessionId) && Boolean(recordBlobRef.current);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    videoRef.current?.pause();
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
    const finalScore = snapshot?.score ?? latestScoreRef.current;
    const finalTier = snapshot?.tier ?? latestTierRef.current;
    const finalBreakdown = snapshot?.breakdown ?? latestBreakdownRef.current;

    recorderRef.current?.stop();
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
    hasFinishedRef.current = false;
    latestScoreRef.current = 0;
    latestTierRef.current = "fail";
    matchMsRef.current = 0;
    recordBlobRef.current = null;
    chunksRef.current = [];
    latestBreakdownRef.current = {};

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
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
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        throw new Error("Camera surface is not ready.");
      }

      video.srcObject = stream;
      await video.play();

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

      const ctx = outputCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas context could not be created.");
      }

      const frameLoop = () => {
        if (!videoRef.current || !canvasRef.current || !selectedStage) {
          return;
        }

        ctx.save();
        ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        ctx.scale(-1, 1);
        ctx.drawImage(
          videoRef.current,
          -outputCanvas.width,
          0,
          outputCanvas.width,
          outputCanvas.height,
        );
        ctx.restore();

        const detection = landmarker.detectForVideo(
          videoRef.current,
          performance.now(),
        );
        const pose = detection.landmarks?.[0];
        const poseScore = scorePose(pose, selectedStage.ruleConfig);

        latestBreakdownRef.current = poseScore.breakdown;
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

        if (nextValue >= selectedStage.ruleConfig.holdMs && !hasFinishedRef.current) {
          void finishAttempt(true, {
            score: poseScore.score,
            tier: poseScore.tier,
            breakdown: poseScore.breakdown,
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

        if (pose) {
          ctx.fillStyle = "#b8ff41";
          for (const point of pose) {
            const x = outputCanvas.width - point.x * outputCanvas.width;
            const y = point.y * outputCanvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        animationFrameRef.current = window.requestAnimationFrame(frameLoop);
      };

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

    if (!previewUrl || !recordBlobRef.current || !sessionId) {
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
      const videoFile = blobToFile(
        recordBlobRef.current,
        `${selectedStage.slug}-${sessionId}.webm`,
      );
      const posterFile = await canvasToJpegFile(
        canvasRef.current,
        `${selectedStage.slug}-${sessionId}.jpg`,
      );

      await publishPlaySession({
        sessionId,
        caption,
        videoFile,
        posterFile,
        stageId: selectedStage.id,
        score,
      });

      setStatus("Uploaded to the public feed.");
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
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-4 py-6 lg:flex-row">
        {/* ── LEFT SIDEBAR: Stage Ladder ── */}
        <aside className="w-full rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-6 lg:h-fit lg:w-[340px]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Stage Ladder
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">
            Sequential Unlock
          </h1>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Camera runs locally. Nothing is uploaded until you hit the upload button.
          </p>

          <div className="mt-5 space-y-2.5">
            {initialData.stages.map((stage) => {
              const progress = progressByStageId[stage.id];
              const isUnlocked = Boolean(progress);
              const isSelected = stage.id === selectedStageId;
              const statusLabel = progress?.bestScore
                ? `${progress.bestScore} pts`
                : isUnlocked
                  ? "Unlocked"
                  : "Locked";

              return (
                <button
                  key={stage.id}
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition-all ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-lg shadow-zinc-900/10"
                      : isUnlocked
                        ? "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-900"
                        : "cursor-not-allowed border-zinc-100 bg-zinc-50 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                        isSelected ? "text-zinc-400" : isUnlocked ? "text-zinc-500" : "text-zinc-400"
                      }`}
                    >
                      Stage {stage.stageNumber}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
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
                    className={`mt-1.5 text-base font-bold tracking-tight ${
                      isSelected ? "text-white" : "text-zinc-900"
                    }`}
                  >
                    {stage.title}
                  </p>
                  <p
                    className={`mt-0.5 text-sm leading-5 ${
                      isSelected ? "text-zinc-400" : "text-zinc-500"
                    }`}
                  >
                    {stage.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Profile Snapshot */}
          <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Your Stats
            </p>
            <p className="mt-1.5 text-lg font-bold text-zinc-900">{initialData.profile.displayName}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-white p-3 border border-zinc-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Best</p>
                <p className="mt-1 text-xl font-black text-zinc-900">{profileSnapshot.bestScore}</p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-zinc-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Plays</p>
                <p className="mt-1 text-xl font-black text-zinc-900">{profileSnapshot.totalPlayCount}</p>
              </div>
              <div className="rounded-xl bg-white p-3 border border-zinc-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Uploads</p>
                <p className="mt-1 text-xl font-black text-zinc-900">{profileSnapshot.uploadedPlayCount}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT: Challenge Area ── */}
        <section className="flex-1 space-y-5">
          {selectedStage ? (
            <>
              {/* Stage Header */}
              <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Live Challenge
                  </p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">
                    Stage {selectedStage.stageNumber}: {selectedStage.title}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-zinc-500">
                    {selectedStage.instructionText}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-600">
                    ⏱ {formatTime(secondsLeft || selectedStage.timeLimitSeconds)}
                  </div>
                  <div className="rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-600">
                    🎯 {selectedStage.minScoreToClear}+
                  </div>
                  <Button
                    type="button"
                    size="lg"
                    onClick={startChallenge}
                    disabled={phase === "preparing" || phase === "playing"}
                    className="rounded-full bg-black px-8 text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {phase === "playing" ? "● Live" : "Start challenge"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
                {/* Camera / Result viewport — stays dark for drama */}
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-sm">
                  <div className="flex items-center justify-between border-b border-zinc-700/50 px-5 py-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        {phase === "result" ? "Recorded result" : "Camera output"}
                      </p>
                      <p className="mt-1 text-base font-bold text-white">{status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                        Similarity
                      </p>
                      <p className="mt-1 text-4xl font-black text-[#b8ff41]">{score}</p>
                    </div>
                  </div>
                  <>
                    <video ref={videoRef} className="hidden" muted playsInline />
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        className={`aspect-video w-full bg-zinc-900 object-contain ${
                          phase === "result" && previewUrl ? "hidden" : "block"
                        }`}
                      />
                      {phase === "result" && previewUrl ? (
                        <video
                          src={previewUrl}
                          controls
                          className="aspect-video w-full bg-black object-contain"
                        />
                      ) : null}
                      {phase !== "playing" && phase !== "result" && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="mx-6 flex w-full max-w-[520px] flex-col items-center rounded-2xl border border-zinc-700/50 bg-zinc-800/90 px-8 py-8 text-center backdrop-blur">
                            <div className="rounded-full bg-zinc-700/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
                              Camera standby
                            </div>
                            <h3 className="mt-5 text-2xl font-black tracking-tight text-white">
                              Raise both arms into the guide frame.
                            </h3>
                            <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
                              Start the stage to turn on the camera, load pose detection, and
                              begin the local recording preview.
                            </p>
                            <div className="mt-5 grid w-full gap-2.5 text-left md:grid-cols-3">
                              <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/60 p-3.5">
                                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Step 1</p>
                                <p className="mt-1.5 text-sm font-semibold text-white">Center your torso</p>
                              </div>
                              <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/60 p-3.5">
                                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Step 2</p>
                                <p className="mt-1.5 text-sm font-semibold text-white">Lift both arms high</p>
                              </div>
                              <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/60 p-3.5">
                                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Step 3</p>
                                <p className="mt-1.5 text-sm font-semibold text-white">Hold past {selectedStage.minScoreToClear}</p>
                              </div>
                            </div>
                            <div className="mt-5 flex h-[180px] w-[130px] items-center justify-center rounded-[60px] border border-dashed border-zinc-600 bg-zinc-800/40">
                              <div className="relative h-[120px] w-[70px]">
                                <div className="absolute left-1/2 top-0 h-9 w-9 -translate-x-1/2 rounded-full border-2 border-zinc-400" />
                                <div className="absolute left-1/2 top-9 h-10 w-[2px] -translate-x-1/2 bg-zinc-400" />
                                <div className="absolute left-1/2 top-10 h-[2px] w-16 -translate-x-1/2 bg-zinc-400" />
                                <div className="absolute left-[8px] top-6 h-9 w-[2px] rotate-[35deg] bg-zinc-400" />
                                <div className="absolute right-[8px] top-6 h-9 w-[2px] -rotate-[35deg] bg-zinc-400" />
                                <div className="absolute left-1/2 top-[76px] h-11 w-[2px] -translate-x-[10px] rotate-[22deg] bg-zinc-400" />
                                <div className="absolute left-1/2 top-[76px] h-11 w-[2px] translate-x-[10px] -rotate-[22deg] bg-zinc-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                </div>

                {/* Right Panel: Telemetry + Publish + Recent */}
                <div className="space-y-4">
                  {/* Attempt Telemetry */}
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Attempt Telemetry
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                          Tier
                        </p>
                        <p className="mt-1.5 text-3xl font-black uppercase text-zinc-900">
                          {tier}
                        </p>
                      </div>
                      <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                          Hold
                        </p>
                        <p className="mt-1.5 text-3xl font-black text-zinc-900">
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
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Publish to feed
                    </p>
                    <textarea
                      value={caption}
                      onChange={(event) => setCaption(event.target.value)}
                      placeholder="Write the caption that will go with your motion clip."
                      className="mt-3 h-24 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-200 transition-all"
                    />
                    <div className="mt-3 flex gap-3">
                      <Button
                        type="button"
                        size="lg"
                        className="flex-1 rounded-full bg-black text-white hover:bg-zinc-800 disabled:opacity-50"
                        disabled={isPublishing}
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
                    <p className="mt-2.5 text-xs text-zinc-400">
                      {phase !== "result"
                        ? "The upload button unlocks after a recorded result is ready."
                        : !isResultReady
                          ? "The clip is still being prepared. Upload becomes active as soon as preview generation finishes."
                          : "The video stays local until this button is pressed."}
                    </p>
                  </div>

                  {/* Recent Attempts */}
                  <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Recent Attempts
                    </p>
                    <div className="mt-3 space-y-2">
                      {recentSessions.length === 0 ? (
                        <p className="text-sm text-zinc-400">
                          Your last eight attempts will appear here once you start.
                        </p>
                      ) : (
                        recentSessions.map((session) => {
                          const stage = initialData.stages.find(
                            (candidate) => candidate.id === session.stageId,
                          );

                          return (
                            <div
                              key={session.id}
                              className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
                            >
                              <div>
                                <p className="font-semibold text-zinc-900">
                                  {stage?.title ?? "Unknown stage"}
                                </p>
                                <p className="text-sm text-zinc-500" suppressHydrationWarning>
                                  {new Date(session.attemptFinishedAt).toLocaleString('ko-KR')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                                  {session.resultTier}
                                </p>
                                <p className="text-xl font-black text-zinc-900">
                                  {session.score}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
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
      </div>
    </div>
  );
};
