"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { MessageAttachment, MessageKind, RoomMessage } from "@/features/messages/types";
import { normalizeUploadMimeType } from "@/features/play/media";

type MessageInsertRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  message_type: MessageKind;
  media_storage_path: string | null;
  media_mime_type: string | null;
  media_width: number | null;
  media_height: number | null;
  created_at: string;
};

export type ConversationMessagePayload = MessageInsertRow & {
  attachment: MessageAttachment | null;
};

const getMessagesBrowserClient = () => createBrowserSupabaseClient().schema("meme");
const DM_MEDIA_BUCKET = "dm-media";
const DM_MEDIA_SIGNED_URL_TTL_SECONDS = 60 * 60;

const toConversationOpenErrorMessage = (message?: string) => {
  const normalized = message?.trim().toLowerCase();

  if (!normalized) {
    return "Conversation could not be opened. Please try again.";
  }

  if (normalized.includes("authentication required")) {
    return "You must be signed in to send a direct message.";
  }

  if (normalized.includes("different recipient") || normalized.includes("different user")) {
    return "You cannot start a direct message with yourself.";
  }

  if (normalized.includes("conversation unavailable")
    || normalized.includes("conversation not available")) {
    return "This conversation is unavailable right now.";
  }

  return "Conversation could not be opened. Please try again.";
};

const getCurrentUserId = async () => {
  const supabase = createBrowserSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to send a direct message.");
  }

  return user.id;
};

const buildDmMediaObjectPath = (
  conversationId: string,
  userId: string,
  messageId: string,
  fileName: string,
) => {
  const sanitized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${conversationId}/${userId}/${messageId}/${Date.now()}-${sanitized || "attachment.bin"}`;
};

const createSignedDmMediaUrl = async (storagePath: string) => {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.storage
    .from(DM_MEDIA_BUCKET)
    .createSignedUrl(storagePath, DM_MEDIA_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
};

const toAttachment = async (message: MessageInsertRow): Promise<MessageAttachment | null> => {
  if (
    message.message_type !== "image"
    || !message.media_storage_path
    || !message.media_mime_type
  ) {
    return null;
  }

  const signedUrl = await createSignedDmMediaUrl(message.media_storage_path);
  if (!signedUrl) {
    return null;
  }

  return {
    kind: "image",
    storagePath: message.media_storage_path,
    mimeType: message.media_mime_type,
    width: message.media_width,
    height: message.media_height,
    url: signedUrl,
  };
};

const hydrateMessage = async (message: MessageInsertRow): Promise<ConversationMessagePayload> => ({
  ...message,
  attachment: await toAttachment(message),
});

const readImageDimensions = (file: File) =>
  new Promise<{ width: number | null; height: number | null }>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth || null,
        height: image.naturalHeight || null,
      });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      resolve({
        width: null,
        height: null,
      });
      URL.revokeObjectURL(objectUrl);
    };

    image.src = objectUrl;
  });

const findExistingConversation = async (currentUserId: string, targetUserId: string) => {
  const supabase = getMessagesBrowserClient();
  const [mineResult, targetResult] = await Promise.all([
    supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", currentUserId),
    supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", targetUserId),
  ]);

  if (mineResult.error) {
    throw mineResult.error;
  }

  if (targetResult.error) {
    throw targetResult.error;
  }

  const targetConversationIds = new Set(
    (targetResult.data ?? []).map((row) => row.conversation_id as string),
  );

  const existing = (mineResult.data ?? []).find((row) =>
    targetConversationIds.has(row.conversation_id as string),
  );

  return (existing?.conversation_id as string | undefined) ?? null;
};

export const getExistingDirectConversation = async (targetUserId: string) => {
  const currentUserId = await getCurrentUserId();
  if (currentUserId === targetUserId) {
    return null;
  }

  return findExistingConversation(currentUserId, targetUserId);
};

export const ensureDirectConversation = async (targetUserId: string) => {
  const currentUserId = await getCurrentUserId();
  if (currentUserId === targetUserId) {
    throw new Error("You cannot start a direct message with yourself.");
  }

  const supabase = getMessagesBrowserClient();
  const rpcResult = await supabase.rpc("get_or_create_direct_conversation", {
    p_other_user_id: targetUserId,
  });

  if (!rpcResult.error && rpcResult.data) {
    return rpcResult.data as string;
  }

  if (rpcResult.error) {
    console.error("Failed to open direct conversation", rpcResult.error);
  }

  const existingConversationId = await findExistingConversation(currentUserId, targetUserId);
  if (existingConversationId) {
    return existingConversationId;
  }

  throw new Error(toConversationOpenErrorMessage(rpcResult.error?.message));
};

export const startSpecialConversation = async (input: {
  targetUserId: string;
  intent: "dating_intro" | "brand_collab";
  theme?: string | null;
  openingMessage?: string;
}) => {
  const currentUserId = await getCurrentUserId();
  if (currentUserId === input.targetUserId) {
    throw new Error("You cannot start a direct message with yourself.");
  }

  const supabase = getMessagesBrowserClient();
  const { data, error } = await supabase.rpc("start_special_conversation", {
    p_other_user_id: input.targetUserId,
    p_intent: input.intent,
    p_theme: input.theme ?? null,
    p_opening_message: input.openingMessage?.trim() ?? "",
  });

  if (error || !data || data.length === 0) {
    if (error?.message?.toLowerCase().includes("not enough credits")) {
      throw new Error("Not enough credits.");
    }

    throw new Error(toConversationOpenErrorMessage(error?.message));
  }

  return data[0] as {
    conversation_id: string;
    request_id: string;
    balance: number;
  };
};

export const sendDirectMessage = async (
  conversationId: string,
  body: string,
  imageFile?: File | null,
) => {
  const senderUserId = await getCurrentUserId();
  const storageClient = createBrowserSupabaseClient();
  const supabase = getMessagesBrowserClient();
  const trimmedBody = body.trim();
  const messageId = crypto.randomUUID();

  if (!trimmedBody && !imageFile) {
    throw new Error("Message could not be empty.");
  }

  let objectPath: string | null = null;
  let normalizedMimeType: string | null = null;
  let mediaWidth: number | null = null;
  let mediaHeight: number | null = null;

  if (imageFile) {
    objectPath = buildDmMediaObjectPath(conversationId, senderUserId, messageId, imageFile.name);
    normalizedMimeType = normalizeUploadMimeType(imageFile.type || "image/jpeg");
    const dimensions = await readImageDimensions(imageFile);
    mediaWidth = dimensions.width;
    mediaHeight = dimensions.height;

    const { error: uploadError } = await storageClient.storage
      .from(DM_MEDIA_BUCKET)
      .upload(objectPath, imageFile, {
        cacheControl: "3600",
        contentType: normalizedMimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error("Image could not be uploaded. Please try again.");
    }
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      id: messageId,
      conversation_id: conversationId,
      sender_user_id: senderUserId,
      body: trimmedBody,
      message_type: imageFile ? "image" : "text",
      media_storage_path: objectPath,
      media_mime_type: normalizedMimeType,
      media_width: mediaWidth,
      media_height: mediaHeight,
    })
    .select("id, conversation_id, sender_user_id, body, message_type, media_storage_path, media_mime_type, media_width, media_height, created_at")
    .single();

  if (error) {
    if (objectPath) {
      await storageClient.storage.from(DM_MEDIA_BUCKET).remove([objectPath]);
    }
    throw new Error("Message could not be sent. Please try again.");
  }

  void fetch('/api/notifications/dm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messageId: data.id,
    }),
  }).catch(() => {
    // Best-effort notification trigger.
  });

  return hydrateMessage(data as MessageInsertRow);
};

export const markConversationRead = async (conversationId: string) => {
  const currentUserId = await getCurrentUserId();
  const supabase = getMessagesBrowserClient();
  const nowIso = new Date().toISOString();

  const rpcResult = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });
  if (!rpcResult.error) {
    return;
  }

  await supabase
    .from("conversation_members")
    .update({
      last_read_at: nowIso,
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", currentUserId);
};

export const subscribeToConversation = (
  conversationId: string,
  currentUserId: string,
  onMessage: (message: ConversationMessagePayload) => void,
  onPresenceChange?: (userIds: string[]) => void,
  onTypingChange?: (typingUserIds: string[]) => void,
) => {
  const supabase = createBrowserSupabaseClient();
  const typingUserIds = new Set<string>();
  const channel = supabase
    .channel(`dm:${conversationId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
        broadcast: {
          self: false,
        },
      },
    })
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "meme",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        onMessage(await hydrateMessage(payload.new as MessageInsertRow));
      },
    )
    .on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState();
      const presentUserIds = Object.values(presenceState)
        .flatMap((entries) => entries.map((entry) => String(entry.presence_ref ?? "")))
        .filter(Boolean);
      onPresenceChange?.(presentUserIds);
    })
    .on("broadcast", { event: "typing" }, ({ payload }) => {
      const userId = String(payload?.userId ?? "");
      const isTyping = Boolean(payload?.isTyping);

      if (!userId || userId === currentUserId) {
        return;
      }

      if (isTyping) {
        typingUserIds.add(userId);
      } else {
        typingUserIds.delete(userId);
      }

      onTypingChange?.(Array.from(typingUserIds));
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          userId: currentUserId,
          onlineAt: new Date().toISOString(),
        });
      }
    });

  return {
    sendTyping: async (isTyping: boolean) => {
      await channel.send({
        type: "broadcast",
        event: "typing",
        payload: {
          userId: currentUserId,
          isTyping,
        },
      });
    },
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
};

export const toOptimisticRoomMessage = (
  payload: {
    id: string;
    conversationId: string;
    senderUserId: string;
    body: string;
    createdAt: string;
  },
  sender: RoomMessage["sender"],
): RoomMessage => ({
  id: payload.id,
  conversationId: payload.conversationId,
  senderUserId: payload.senderUserId,
  body: payload.body,
  messageType: "text",
  attachment: null,
  createdAt: payload.createdAt,
  sender,
  isPending: true,
});
