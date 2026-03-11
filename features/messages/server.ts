import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ConversationRoom,
  InboxThread,
  MessageAttachment,
  MessageKind,
  MessageProfile,
  RoomMessage,
} from "@/features/messages/types";

type ConversationMemberRow = {
  conversation_id: string;
  user_id: string;
  joined_at: string | null;
  last_read_at?: string | null;
};

type ConversationRow = {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

type MessageRow = {
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

type ProfileRow = {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
};

type ConversationRequestRow = {
  intent: "dating_intro" | "brand_collab";
  theme: string | null;
  credits_spent: number;
};

const getMessagesServerClient = () => createServerSupabaseClient().schema("meme");
const DM_MEDIA_BUCKET = "dm-media";
const DM_MEDIA_SIGNED_URL_TTL_SECONDS = 60 * 60;

const mapProfile = (profile: ProfileRow | undefined): MessageProfile => ({
  userId: profile?.user_id ?? "",
  handle: profile?.handle ?? "player",
  displayName: profile?.display_name ?? "Player",
  avatarUrl: profile?.avatar_url ?? null,
});

const getMessagePreviewText = (message: Pick<MessageRow, "body" | "message_type">) => {
  const trimmedBody = message.body.trim();

  if (trimmedBody) {
    return trimmedBody;
  }

  if (message.message_type === "image") {
    return "Photo";
  }

  return "";
};

const getSignedDmAttachment = async (
  supabase: ReturnType<typeof createServerSupabaseClient>,
  message: MessageRow,
): Promise<MessageAttachment | null> => {
  if (
    message.message_type !== "image"
    || !message.media_storage_path
    || !message.media_mime_type
  ) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(DM_MEDIA_BUCKET)
    .createSignedUrl(message.media_storage_path, DM_MEDIA_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return {
    kind: "image",
    storagePath: message.media_storage_path,
    mimeType: message.media_mime_type,
    width: message.media_width,
    height: message.media_height,
    url: data.signedUrl,
  };
};

export const listInboxThreads = cache(async (userId: string): Promise<InboxThread[]> => {
  const supabase = getMessagesServerClient();

  const membersResult = await supabase
    .from("conversation_members")
    .select("conversation_id, user_id, joined_at, last_read_at")
    .eq("user_id", userId);

  if (membersResult.error) {
    throw membersResult.error;
  }

  const myMemberships = (membersResult.data ?? []) as ConversationMemberRow[];
  const conversationIds = myMemberships.map((membership) => membership.conversation_id);

  if (conversationIds.length === 0) {
    return [];
  }

  const [allMembersResult, conversationsResult, messagesResult] = await Promise.all([
    supabase
      .from("conversation_members")
      .select("conversation_id, user_id, joined_at")
      .in("conversation_id", conversationIds),
    supabase
      .from("conversations")
      .select("id, created_at, updated_at")
      .in("id", conversationIds),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_user_id, body, message_type, media_storage_path, media_mime_type, media_width, media_height, created_at")
      .in("conversation_id", conversationIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  if (allMembersResult.error) {
    throw allMembersResult.error;
  }

  if (conversationsResult.error) {
    throw conversationsResult.error;
  }

  if (messagesResult.error) {
    throw messagesResult.error;
  }

  const allMembers = (allMembersResult.data ?? []) as ConversationMemberRow[];
  const conversations = (conversationsResult.data ?? []) as ConversationRow[];
  const messages = (messagesResult.data ?? []) as MessageRow[];

  const otherUserIds = Array.from(
    new Set(
      allMembers
        .filter((membership) => membership.user_id !== userId)
        .map((membership) => membership.user_id),
    ),
  );

  const profilesResult =
    otherUserIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, handle, display_name, avatar_url")
          .in("user_id", otherUserIds)
      : { data: [] as ProfileRow[], error: null };

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  const profileByUserId = new Map(
    ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => [profile.user_id, profile]),
  );
  const conversationById = new Map(conversations.map((conversation) => [conversation.id, conversation]));

  return conversationIds
    .map((conversationId) => {
      const myMembership = myMemberships.find(
        (membership) => membership.conversation_id === conversationId,
      );
      const otherMembership = allMembers.find(
        (membership) =>
          membership.conversation_id === conversationId && membership.user_id !== userId,
      );
      if (!otherMembership) {
        return null;
      }

      const lastMessage =
        messages.find((message) => message.conversation_id === conversationId) ?? null;
      const lastReadAt = myMembership?.last_read_at ?? null;
      const unreadCount = messages.filter((message) => {
        if (message.conversation_id !== conversationId) {
          return false;
        }

        if (message.sender_user_id === userId) {
          return false;
        }

        return !lastReadAt || message.created_at > lastReadAt;
      }).length;

      return {
        conversationId,
        updatedAt:
          lastMessage?.created_at ??
          conversationById.get(conversationId)?.updated_at ??
          conversationById.get(conversationId)?.created_at ??
          new Date(0).toISOString(),
        lastReadAt,
        otherMember: mapProfile(profileByUserId.get(otherMembership.user_id)),
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              body: lastMessage.body,
              previewText: getMessagePreviewText(lastMessage),
              createdAt: lastMessage.created_at,
              senderUserId: lastMessage.sender_user_id,
              messageType: lastMessage.message_type,
            }
          : null,
        unreadCount,
      } satisfies InboxThread;
    })
    .filter((thread): thread is InboxThread => Boolean(thread))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
});

export const getConversationRoom = cache(
  async (conversationId: string, userId: string): Promise<ConversationRoom | null> => {
    const baseSupabase = createServerSupabaseClient();
    const supabase = baseSupabase.schema("meme");

    const membershipResult = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id, joined_at, last_read_at")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (membershipResult.error) {
      throw membershipResult.error;
    }

    if (!membershipResult.data) {
      return null;
    }

    const [membersResult, messagesResult, conversationResult, requestResult] = await Promise.all([
      supabase
        .from("conversation_members")
        .select("conversation_id, user_id, joined_at")
        .eq("conversation_id", conversationId),
      supabase
        .from("messages")
        .select("id, conversation_id, sender_user_id, body, message_type, media_storage_path, media_mime_type, media_width, media_height, created_at")
        .eq("conversation_id", conversationId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("conversations")
        .select("id, created_at, updated_at")
        .eq("id", conversationId)
        .maybeSingle(),
      supabase
        .from("conversation_requests")
        .select("intent, theme, credits_spent")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (membersResult.error) {
      throw membersResult.error;
    }

    if (messagesResult.error) {
      throw messagesResult.error;
    }

    if (conversationResult.error) {
      throw conversationResult.error;
    }
    if (requestResult.error) {
      throw requestResult.error;
    }

    const members = (membersResult.data ?? []) as ConversationMemberRow[];
    const messages = (messagesResult.data ?? []) as MessageRow[];
    const otherMember = members.find((member) => member.user_id !== userId);
    const senderIds = Array.from(new Set(messages.map((message) => message.sender_user_id)));
    const profileIds = Array.from(
      new Set([...(otherMember ? [otherMember.user_id] : []), ...senderIds, userId]),
    );

    const profilesResult =
      profileIds.length > 0
        ? await supabase
            .from("profiles")
            .select("user_id, handle, display_name, avatar_url")
            .in("user_id", profileIds)
        : { data: [] as ProfileRow[], error: null };

    if (profilesResult.error) {
      throw profilesResult.error;
    }

    const profileByUserId = new Map(
      ((profilesResult.data ?? []) as ProfileRow[]).map((profile) => [profile.user_id, profile]),
    );
    const typedMembership = membershipResult.data as ConversationMemberRow;
    const attachmentsByMessageId = new Map(
      await Promise.all(
        messages.map(async (message) => [message.id, await getSignedDmAttachment(baseSupabase, message)] as const),
      ),
    );

    return {
      conversationId,
      currentUserId: userId,
      otherMember: mapProfile(profileByUserId.get(otherMember?.user_id ?? "")),
      updatedAt:
        (conversationResult.data as ConversationRow | null)?.updated_at ??
        (conversationResult.data as ConversationRow | null)?.created_at ??
        null,
      lastReadAt: typedMembership.last_read_at ?? null,
      messages: messages.map((message) => ({
        id: message.id,
        conversationId: message.conversation_id,
        senderUserId: message.sender_user_id,
        body: message.body,
        messageType: message.message_type,
        attachment: attachmentsByMessageId.get(message.id) ?? null,
        createdAt: message.created_at,
        sender: mapProfile(profileByUserId.get(message.sender_user_id)),
      })) satisfies RoomMessage[],
      specialRequest: requestResult.data
        ? {
            intent: (requestResult.data as ConversationRequestRow).intent,
            theme: (requestResult.data as ConversationRequestRow).theme,
            creditsSpent: (requestResult.data as ConversationRequestRow).credits_spent,
          }
        : null,
    };
  },
);
