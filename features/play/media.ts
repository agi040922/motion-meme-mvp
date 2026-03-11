export const normalizeUploadMimeType = (mimeType: string | null | undefined) => {
  if (!mimeType) {
    return "application/octet-stream";
  }

  if (mimeType.startsWith("video/webm")) {
    return "video/webm";
  }

  if (mimeType.startsWith("video/mp4")) {
    return "video/mp4";
  }

  if (mimeType.startsWith("image/jpeg") || mimeType.startsWith("image/jpg")) {
    return "image/jpeg";
  }

  if (mimeType.startsWith("image/png")) {
    return "image/png";
  }

  if (mimeType.startsWith("image/webp")) {
    return "image/webp";
  }

  return mimeType;
};

export const getSupportedRecorderMimeType = () => {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }

  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];

  return (
    candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ??
    ""
  );
};

export const blobToFile = (blob: Blob, name: string) =>
  new File([blob], name, {
    type: normalizeUploadMimeType(blob.type || "video/webm"),
    lastModified: Date.now(),
  });

export const canvasToJpegFile = async (
  canvas: HTMLCanvasElement,
  name: string,
) =>
  new Promise<File | null>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        resolve(
          new File([blob], name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          }),
        );
      },
      "image/jpeg",
      0.88,
    );
  });

export const videoBlobToJpegFile = async (
  blob: Blob,
  name: string,
) => {
  const objectUrl = URL.createObjectURL(blob);

  try {
    const video = document.createElement("video");
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Failed to load recorded video."));
    });

    video.currentTime = Math.min(0.05, Math.max(video.duration || 0, 0));

    await new Promise<void>((resolve) => {
      const finish = () => resolve();
      video.onseeked = finish;
      if (video.readyState >= 2) {
        finish();
      }
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 540;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas context could not be created.");
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvasToJpegFile(canvas, name);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
