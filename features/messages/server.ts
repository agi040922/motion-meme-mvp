import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ConversationRoom, InboxThread, MessageProfile, RoomMessage } from "@/features/messages/types";

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
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
};

const getMessagesServerClient = () => createServerSupabaseClient().schema("meme");

const mapProfile = (profile: ProfileRow | undefined): MessageProfile => ({
  userId: profile?.user_id ?? "",
  handle: profile?.handle ?? "player",
  displayName: profile?.display_name ?? "Player",
  avatarUrl: profile?.avatar_url ?? null,
});

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
      .select("id, conversation_id, sender_user_id, body, created_at")
      .in("conversation_id", conversationIds)
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
              createdAt: lastMessage.created_at,
              senderUserId: lastMessage.sender_user_id,
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
    const supabase = getMessagesServerClient();

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

    const [membersResult, messagesResult, conversationResult] = await Promise.all([
      supabase
        .from("conversation_members")
        .select("conversation_id, user_id, joined_at")
        .eq("conversation_id", conversationId),
      supabase
        .from("messages")
        .select("id, conversation_id, sender_user_id, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true }),
      supabase
        .from("conversations")
        .select("id, created_at, updated_at")
        .eq("id", conversationId)
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
        createdAt: message.created_at,
        sender: mapProfile(profileByUserId.get(message.sender_user_id)),
      })) satisfies RoomMessage[],
    };
  },
);
