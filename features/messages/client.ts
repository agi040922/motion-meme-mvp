"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { RoomMessage } from "@/features/messages/types";

type MessageInsertRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

const getMessagesBrowserClient = () => createBrowserSupabaseClient().schema("meme");

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

  const existingConversationId = await findExistingConversation(currentUserId, targetUserId);
  if (existingConversationId) {
    return existingConversationId;
  }

  throw new Error("Conversation could not be opened. Please try again.");
};

export const sendDirectMessage = async (conversationId: string, body: string) => {
  const senderUserId = await getCurrentUserId();
  const supabase = getMessagesBrowserClient();
  const trimmedBody = body.trim();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_user_id: senderUserId,
      body: trimmedBody,
    })
    .select("id, conversation_id, sender_user_id, body, created_at")
    .single();

  if (error) {
    throw new Error("Message could not be sent. Please try again.");
  }

  return data as MessageInsertRow;
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
  onMessage: (message: MessageInsertRow) => void,
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
      (payload) => {
        onMessage(payload.new as MessageInsertRow);
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
  createdAt: payload.createdAt,
  sender,
  isPending: true,
});
