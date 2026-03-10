import { env } from "@/lib/env";

const KNOWN_BUCKETS = ["avatars", "meme-assets", "post-media"] as const;

const getBucketAndPath = (
  storagePath: string | null | undefined,
  fallbackBucket: (typeof KNOWN_BUCKETS)[number] = "post-media",
) => {
  if (!storagePath) {
    return null;
  }

  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return {
      bucket: null,
      path: storagePath,
    };
  }

  const matchedBucket = KNOWN_BUCKETS.find((bucket) =>
    storagePath === bucket || storagePath.startsWith(`${bucket}/`),
  );

  if (!matchedBucket) {
    return {
      bucket: fallbackBucket,
      path: storagePath,
    };
  }

  return {
    bucket: matchedBucket,
    path: storagePath.slice(matchedBucket.length + 1),
  };
};

export const getStoragePublicUrl = (
  storagePath: string | null | undefined,
  fallbackBucket: (typeof KNOWN_BUCKETS)[number] = "post-media",
) => {
  const normalized = getBucketAndPath(storagePath, fallbackBucket);
  if (!normalized) {
    return null;
  }

  if (!normalized.bucket) {
    return normalized.path;
  }

  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${normalized.bucket}/${normalized.path}`;
};

export const getBrowserStoragePublicUrl = (
  storagePath: string | null | undefined,
  fallbackBucket: (typeof KNOWN_BUCKETS)[number] = "post-media",
) => getStoragePublicUrl(storagePath, fallbackBucket);

export const buildObjectPath = (
  userId: string,
  entityId: string,
  fileName: string,
) => {
  const sanitized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${userId}/${entityId}/${Date.now()}-${sanitized || "asset.bin"}`;
};
