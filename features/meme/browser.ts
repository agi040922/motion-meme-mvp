"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { buildObjectPath } from "@/features/meme/storage";
import type {
  ConversationMessage,
  CreatePostInput,
  PostComment,
  PublishPlayInput,
  ResultTier,
} from "@/features/meme/types";
import { normalizeUploadMimeType } from "@/features/play/media";

type ViewerProfileRow = {
  handle: string;
  display_name: string;
  avatar_url: string | null;
};

type PostMediaCleanupRow = {
  id: string;
  storage_path: string | null;
  poster_path: string | null;
};

type MessageInsertRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

const getMemeBrowserClient = () => createBrowserSupabaseClient().schema("meme");

const removeUploadedPaths = async (paths: Array<string | null | undefined>) => {
  const objectPaths = paths.filter((path): path is string => Boolean(path));
  if (objectPaths.length === 0) {
    return;
  }

  const supabase = createBrowserSupabaseClient();
  await supabase.storage.from("post-media").remove(objectPaths);
};

const requireSignedInUserId = async () => {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  return user.id;
};

const getViewerProfile = async (userId: string) => {
  const supabase = getMemeBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("handle, display_name, avatar_url")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data as ViewerProfileRow;
};

export const toggleFollow = async (targetUserId: string, isFollowing: boolean) => {
  const userId = await requireSignedInUserId();
  const supabase = getMemeBrowserClient();

  if (isFollowing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_user_id", userId)
      .eq("following_user_id", targetUserId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from("follows").insert({
    follower_user_id: userId,
    following_user_id: targetUserId,
  });
  if (error) throw error;
  return true;
};

export const togglePostLike = async (postId: string, isLiked: boolean) => {
  const userId = await requireSignedInUserId();
  const supabase = getMemeBrowserClient();

  if (isLiked) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from("post_likes").insert({
    post_id: postId,
    user_id: userId,
  });
  if (error) throw error;
  return true;
};

export const toggleBookmark = async (postId: string, isSaved: boolean) => {
  const userId = await requireSignedInUserId();
  const supabase = getMemeBrowserClient();

  if (isSaved) {
    const { error } = await supabase
      .from("post_bookmarks")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase.from("post_bookmarks").insert({
    post_id: postId,
    user_id: userId,
  });
  if (error) throw error;
  return true;
};

export const hidePost = async (postId: string) => {
  const userId = await requireSignedInUserId();
  const supabase = getMemeBrowserClient();
  const { error } = await supabase.from("hidden_posts").upsert(
    {
      post_id: postId,
      user_id: userId,
    },
    {
      onConflict: "user_id,post_id",
    },
  );

  if (error) {
    throw new Error("Post could not be hidden. Please try again.");
  }
};

export const blockUser = async (targetUserId: string) => {
  const userId = await requireSignedInUserId();
  const supabase = getMemeBrowserClient();

  const { error } = await supabase.from("user_blocks").upsert(
    {
      blocker_user_id: userId,
      blocked_user_id: targetUserId,
    },
    {
      onConflict: "blocker_user_id,blocked_user_id",
    },
  );

  if (error) {
    throw new Error("User could not be blocked. Please try again.");
  }
};

export const reportPost = async (input: {
  postId: string;
  reason: "spam" | "abuse" | "nudity" | "copyright" | "other";
  detail?: string;
}) => {
  const userId = await requireSignedInUserId();
  const supabase = getMemeBrowserClient();
  const { error } = await supabase.from("post_reports").insert({
    post_id: input.postId,
    reporter_user_id: userId,
    reason: input.reason,
    details: input.detail?.trim() || "",
  });

  if (error) {
    throw new Error("Report could not be submitted. Please try again.");
  }
};

export const ensureDirectConversation = async (otherUserId: string) => {
  const userId = await requireSignedInUserId();
  if (userId === otherUserId) {
    throw new Error("You cannot start a direct conversation with yourself.");
  }

  const supabase = getMemeBrowserClient();
  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", {
    p_other_user_id: otherUserId,
  });

  if (error || !data) {
    console.error("Failed to open direct conversation", error);

    const normalized = error?.message?.trim().toLowerCase();
    if (normalized?.includes("conversation unavailable")
      || normalized?.includes("conversation not available")) {
      throw new Error("This conversation is unavailable right now.");
    }

    throw new Error("Conversation could not be opened. Please try again.");
  }

  return data as string;
};

export const sendDirectMessage = async (conversationId: string, body: string) => {
  const userId = await requireSignedInUserId();
  const supabase = getMemeBrowserClient();
  const trimmedBody = body.trim();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_user_id: userId,
      body: trimmedBody,
    })
    .select("id, conversation_id, sender_user_id, body, created_at")
    .single();

  if (error || !data) {
    throw new Error("Message could not be sent. Please try again.");
  }

  const profile = await getViewerProfile(userId);
  const message = data as MessageInsertRow;

  return {
    id: message.id,
    conversationId: message.conversation_id,
    senderUserId: message.sender_user_id,
    body: message.body,
    createdAt: message.created_at,
    readAt: null,
    isOwnMessage: true,
    sender: {
      userId,
      handle: profile.handle,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
    },
  } satisfies ConversationMessage;
};

export const markConversationRead = async (
  conversationId: string,
  lastReadMessageId: string | null,
) => {
  await requireSignedInUserId();
  const supabase = getMemeBrowserClient();
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
    p_message_id: lastReadMessageId,
  });

  if (error) {
    throw new Error("Conversation read state could not be updated.");
  }
};

export const addComment = async (postId: string, content: string) => {
  const userId = await requireSignedInUserId();
  const supabase = getMemeBrowserClient();
  const trimmedContent = content.trim();
  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      author_user_id: userId,
      content: trimmedContent,
    })
    .select("id, post_id, author_user_id, content, created_at")
    .single();

  if (error) {
    throw new Error("Comment could not be posted. Please try again.");
  }

  void fetch('/api/notifications/comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      commentId: data.id,
    }),
  }).catch(() => {
    // Best-effort notification trigger.
  });

  const profile = await getViewerProfile(userId);

  return {
    id: data.id as string,
    postId: data.post_id as string,
    authorUserId: data.author_user_id as string,
    authorHandle: profile.handle,
    authorDisplayName: profile.display_name,
    authorAvatarUrl: profile.avatar_url,
    content: data.content as string,
    createdAt: data.created_at as string,
    isCurrentUser: true,
    media: null,
  } satisfies PostComment;
};

export const updateComment = async (commentId: string, content: string) => {
  const userId = await requireSignedInUserId();
  const supabase = getMemeBrowserClient();
  const trimmedContent = content.trim();

  const { data, error } = await supabase
    .from("post_comments")
    .update({
      content: trimmedContent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .eq("author_user_id", userId)
    .is("deleted_at", null)
    .select("id, content")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Comment could not be updated. Please try again.");
  }

  return data.content as string;
};

export const deletePost = async (postId: string) => {
  const userId = await requireSignedInUserId();
  const meme = getMemeBrowserClient();

  const { data: mediaRows, error: mediaError } = await meme
    .from("post_media")
    .select("id, storage_path, poster_path")
    .eq("post_id", postId);

  if (mediaError) {
    throw new Error("Post media could not be loaded for deletion.");
  }

  const { data: updatedPost, error } = await meme
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("author_user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !updatedPost) {
    throw new Error("Post could not be deleted. Please try again.");
  }

  const typedMediaRows = (mediaRows ?? []) as PostMediaCleanupRow[];
  const mediaIds = typedMediaRows.map((row) => row.id).filter(Boolean);
  const mediaPaths = typedMediaRows.flatMap((row) => [
    row.storage_path,
    row.poster_path,
  ]);

  await Promise.allSettled([
    mediaIds.length > 0
      ? meme.from("post_media").delete().in("id", mediaIds)
      : Promise.resolve(),
    removeUploadedPaths(mediaPaths),
  ]);
};

export const updatePost = async (postId: string, caption: string) => {
  const userId = await requireSignedInUserId();
  const supabase = getMemeBrowserClient();
  const { data, error } = await supabase
    .from("posts")
    .update({
      caption: caption.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("author_user_id", userId)
    .is("deleted_at", null)
    .select("id, caption")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Post could not be updated. Please try again.");
  }

  return data.caption as string;
};

export const deleteComment = async (commentId: string) => {
  const userId = await requireSignedInUserId();
  const supabase = getMemeBrowserClient();
  const mediaResult = await supabase
    .from("comment_media")
    .select("storage_path")
    .eq("comment_id", commentId);

  if (mediaResult.error) {
    throw new Error("Comment media could not be loaded for deletion.");
  }

  const { data, error } = await supabase
    .from("post_comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_user_id", userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Comment could not be deleted. Please try again.");
  }

  const mediaPaths = (mediaResult.data ?? []).map((row) => row.storage_path as string | null);
  await Promise.allSettled([
    supabase.from("comment_media").delete().eq("comment_id", commentId),
    removeUploadedPaths(mediaPaths),
  ]);
};

export const updateProfile = async (input: {
  handle: string;
  displayName: string;
  bio: string;
}) => {
  const userId = await requireSignedInUserId();
  const supabase = getMemeBrowserClient();
  const normalizedHandle = input.handle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const { data, error } = await supabase
    .from("profiles")
    .update({
      handle: normalizedHandle,
      display_name: input.displayName.trim(),
      bio: input.bio,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select("user_id, handle, display_name, bio, avatar_url, featured_post_id, created_at, updated_at")
    .single();

  if (error || !data) {
    throw new Error("Profile could not be updated. Please try again.");
  }

  return data;
};

export const createPost = async ({ caption, mediaFile, mediaType }: CreatePostInput) => {
  const userId = await requireSignedInUserId();
  const postId = crypto.randomUUID();
  const supabase = createBrowserSupabaseClient();
  const meme = getMemeBrowserClient();

  const resolvedMediaType =
    mediaType ??
    (mediaFile?.type.startsWith("video/") ? "video" : mediaFile ? "image" : null);
  const postType =
    resolvedMediaType === "video"
      ? "play_video"
      : resolvedMediaType === "image"
        ? "image"
        : "text";
  if (!mediaFile || !resolvedMediaType) {
    const { data: createdPostId, error: postError } = await meme.rpc(
      "create_post_with_media",
      {
        p_post_type: postType,
        p_caption: caption.trim(),
      },
    );
    if (postError) {
      throw postError;
    }
    return createdPostId ?? postId;
  }

  const objectPath = buildObjectPath(userId, postId, mediaFile.name);
  const normalizedMimeType = normalizeUploadMimeType(
    mediaFile.type || (resolvedMediaType === "video" ? "video/webm" : "image/jpeg"),
  );

  try {
    const { error: uploadError } = await supabase.storage
      .from("post-media")
      .upload(objectPath, mediaFile, {
        cacheControl: "3600",
        contentType: normalizedMimeType,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: postError } = await meme.rpc("create_post_with_media", {
      p_post_type: postType,
      p_caption: caption.trim(),
      p_storage_path: objectPath,
      p_media_type: resolvedMediaType,
      p_mime_type: normalizedMimeType,
    });
    if (postError) {
      throw postError;
    }
  } catch (error) {
    await removeUploadedPaths([objectPath]);
    throw error;
  }

  return postId;
};

export const createPlaySession = async (input: {
  stageId: string;
  score: number;
  resultTier: ResultTier;
  success: boolean;
  attemptStartedAt: string;
  attemptFinishedAt: string;
  durationSeconds: number;
  similarityBreakdown: Record<string, number>;
}) => {
  const userId = await requireSignedInUserId();
  const sessionId = crypto.randomUUID();
  const meme = getMemeBrowserClient();

  const { error } = await meme.from("play_sessions").insert({
    id: sessionId,
    user_id: userId,
    stage_id: input.stageId,
    score: input.score,
    result_tier: input.resultTier,
    success: input.success,
    attempt_started_at: input.attemptStartedAt,
    attempt_finished_at: input.attemptFinishedAt,
    duration_seconds: input.durationSeconds,
    similarity_breakdown: input.similarityBreakdown,
  });

  if (error) {
    throw error;
  }

  return sessionId;
};

export const publishPlaySession = async ({
  sessionId,
  caption,
  videoFile,
  posterFile,
  score,
}: PublishPlayInput) => {
  const userId = await requireSignedInUserId();
  const supabase = createBrowserSupabaseClient();
  const meme = getMemeBrowserClient();

  const videoPath = buildObjectPath(userId, sessionId, videoFile.name);
  const posterPath = posterFile
    ? buildObjectPath(userId, sessionId, posterFile.name)
    : null;
  const videoMimeType = normalizeUploadMimeType(videoFile.type || "video/webm");
  const posterMimeType = posterFile
    ? normalizeUploadMimeType(posterFile.type || "image/jpeg")
    : null;

  try {
    const { error: videoUploadError } = await supabase.storage
      .from("post-media")
      .upload(videoPath, videoFile, {
        cacheControl: "3600",
        contentType: videoMimeType,
        upsert: false,
      });
    if (videoUploadError) {
      throw videoUploadError;
    }

    if (posterFile && posterPath) {
      const { error: posterUploadError } = await supabase.storage
        .from("post-media")
        .upload(posterPath, posterFile, {
          cacheControl: "3600",
          contentType: posterMimeType ?? undefined,
          upsert: false,
        });
      if (posterUploadError) {
        throw posterUploadError;
      }
    }

    const { data: createdPostId, error: publishError } = await meme.rpc(
      "publish_play_session",
      {
        p_session_id: sessionId,
        p_caption: caption.trim(),
        p_video_path: videoPath,
        p_video_mime_type: videoMimeType,
        p_poster_path: posterPath,
      },
    );
    if (publishError) {
      throw publishError;
    }

    return {
      postId: createdPostId,
      score,
    };
  } catch (error) {
    await removeUploadedPaths([videoPath, posterPath]);
    throw error;
  }
};
