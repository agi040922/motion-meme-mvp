"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
type PermissionStateValue =
  | "checking"
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported"
  | "error";

const getPermissionCopy = (state: PermissionStateValue) => {
  switch (state) {
    case "granted":
      return {
        eyebrow: "Camera ready",
        title: "The device camera is available.",
        body: "You can jump straight into the stage ladder. We only use the live camera feed in-browser until you explicitly publish a clip.",
      };
    case "denied":
      return {
        eyebrow: "Permission blocked",
        title: "Camera access was denied.",
        body: "Allow camera access in your browser site settings, then run the retry action below. Safari and mobile browsers may require reloading after you change the permission.",
      };
    case "unsupported":
      return {
        eyebrow: "Permission API unavailable",
        title: "This browser does not expose camera permission state.",
        body: "You can still request the camera directly. If the browser blocks it, reopen the site settings and allow camera access for Motion Meme.",
      };
    case "error":
      return {
        eyebrow: "Camera check failed",
        title: "The browser could not complete the camera check.",
        body: "Retry once. If the issue persists, close other apps using the camera and confirm the browser has OS-level camera access.",
      };
    case "checking":
      return {
        eyebrow: "Checking device",
        title: "Looking up camera permission state.",
        body: "This only verifies access. We are not recording anything here.",
      };
    default:
      return {
        eyebrow: "Ready to request",
        title: "Allow camera access before you enter the stage.",
        body: "Stand arm's-length from the camera, keep your full upper body visible, and approve camera access when the browser asks.",
      };
  }
};

export function PlayPermissionGuide() {
  const [permissionState, setPermissionState] = useState<PermissionStateValue>("checking");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkPermission = async () => {
      if (
        typeof navigator === "undefined" ||
        !("permissions" in navigator) ||
        typeof navigator.permissions.query !== "function"
      ) {
        if (mounted) {
          setPermissionState("unsupported");
        }
        return;
      }

      try {
        const status = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });

        if (!mounted) {
          return;
        }

        setPermissionState(status.state as PermissionStateValue);
        status.onchange = () => {
          if (mounted) {
            setPermissionState(status.state as PermissionStateValue);
          }
        };
      } catch {
        if (mounted) {
          setPermissionState("unsupported");
        }
      }
    };

    void checkPermission();

    return () => {
      mounted = false;
    };
  }, []);

  const requestCameraAccess = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionState("unsupported");
      return;
    }

    setIsRequesting(true);
    setFeedback(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      stream.getTracks().forEach((track) => track.stop());
      setPermissionState("granted");
      setFeedback("Camera access confirmed. You can enter Play now.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setPermissionState("denied");
        setFeedback("The browser denied camera access. Update the site permission and try again.");
      } else {
        setPermissionState("error");
        setFeedback("The camera could not be opened. Close other camera apps and retry.");
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const copy = getPermissionCopy(permissionState);

  return (
    <section className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 bg-zinc-50 px-6 py-6 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 md:text-base">
            {copy.body}
          </p>
        </div>

        <div className="grid gap-4 px-6 py-6 md:grid-cols-[1.4fr_1fr] md:px-8">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Recommended setup
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700">
              <li>Keep your face, shoulders, elbows, and hips inside frame.</li>
              <li>Stand 1 to 1.5 meters away to reduce landmark jitter.</li>
              <li>Use front-facing light and avoid bright windows behind you.</li>
              <li>Wear clothing that contrasts with the background when possible.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Recovery checklist
            </p>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-zinc-700">
              <li>1. Unlock camera access in the browser site settings.</li>
              <li>2. Confirm OS-level camera permission for the browser.</li>
              <li>3. Close Zoom, Meet, FaceTime, or any active camera app.</li>
              <li>4. Retry here before re-entering Play.</li>
            </ol>
          </div>
        </div>
      </div>

      {feedback ? (
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm text-zinc-700">
          {feedback}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isRequesting}
          onClick={() => void requestCameraAccess()}
        >
          {isRequesting ? "Checking camera..." : permissionState === "granted" ? "Re-check camera" : "Request camera access"}
        </button>
        <Link
          href="/play/guide"
          className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
        >
          Open tutorial
        </Link>
        <Link
          href="/play"
          className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
        >
          Go to Play
        </Link>
      </div>
    </section>
  );
}
