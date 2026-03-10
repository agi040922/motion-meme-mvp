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
