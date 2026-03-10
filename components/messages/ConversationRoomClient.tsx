"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/ui/RelativeTime";
import {
  markConversationRead,
  sendDirectMessage,
  subscribeToConversation,
  toOptimisticRoomMessage,
} from "@/features/messages/client";
import type { ConversationRoom, RoomMessage } from "@/features/messages/types";

type ConversationRoomClientProps = {
  room: ConversationRoom;
};

const mergeMessage = (messages: RoomMessage[], incomingMessage: RoomMessage) => {
  const deduped = messages.filter((message) => message.id !== incomingMessage.id);
  return [...deduped, incomingMessage].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
};

export function ConversationRoomClient({ room }: ConversationRoomClientProps) {
  const [messages, setMessages] = useState(room.messages);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [isOtherMemberOnline, setIsOtherMemberOnline] = useState(false);
  const [isOtherMemberTyping, setIsOtherMemberTyping] = useState(false);
  const [isPending, startTransition] = useTransition();
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const typingChannelRef = useRef<{
    sendTyping: (isTyping: boolean) => Promise<void>;
    unsubscribe: () => void;
  } | null>(null);
  const currentUserSenderRef = useRef(
    room.messages.find((message) => message.senderUserId === room.currentUserId)?.sender ?? {
      userId: room.currentUserId,
      handle: "you",
      displayName: "You",
      avatarUrl: null,
    },
  );

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    void markConversationRead(room.conversationId);

    const subscription = subscribeToConversation(
      room.conversationId,
      room.currentUserId,
      (payload) => {
      setMessages((current) =>
        mergeMessage(current, {
          id: payload.id,
          conversationId: payload.conversation_id,
          senderUserId: payload.sender_user_id,
          body: payload.body,
          createdAt: payload.created_at,
          sender:
            payload.sender_user_id === room.currentUserId
              ? currentUserSenderRef.current
              : room.otherMember,
        }),
      );
      void markConversationRead(room.conversationId);
      },
      (userIds) => {
        setIsOtherMemberOnline(userIds.includes(room.otherMember.userId));
      },
      (typingUserIds) => {
        setIsOtherMemberTyping(typingUserIds.includes(room.otherMember.userId));
      },
    );

    typingChannelRef.current = subscription;

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
      typingChannelRef.current?.unsubscribe();
      typingChannelRef.current = null;
    };
  }, [room.conversationId, room.currentUserId, room.otherMember]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-20 border-b border-zinc-100 bg-white/90 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            Back
          </Link>
          <Avatar
            src={room.otherMember.avatarUrl ?? undefined}
            alt={room.otherMember.handle}
            fallback={room.otherMember.displayName}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-900">{room.otherMember.displayName}</p>
            <p className="truncate text-sm text-zinc-500">
              @{room.otherMember.handle}
              <span className="mx-2 text-zinc-300">·</span>
              {isOtherMemberTyping ? "typing..." : isOtherMemberOnline ? "online" : "offline"}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col px-4 py-5">
        <div className="flex-1 space-y-3">
          {messages.length > 0 ? (
            messages.map((message) => {
              const isCurrentUser = message.senderUserId === room.currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm ${
                      isCurrentUser
                        ? "bg-black text-white"
                        : "border border-zinc-100 bg-zinc-50 text-zinc-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                    <div
                      className={`mt-2 flex items-center gap-2 text-[11px] ${
                        isCurrentUser ? "text-zinc-300" : "text-zinc-400"
                      }`}
                    >
                      <span>{message.sender.displayName}</span>
                      <span>·</span>
                      <RelativeTime dateString={message.createdAt} />
                      {message.isPending ? <span>· sending</span> : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 px-6 text-center">
              <p className="text-sm font-semibold text-zinc-900">
                Say hi to {room.otherMember.displayName}
              </p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                This thread is ready for quick reactions, follow-ups, and sharing stage wins.
              </p>
            </div>
          )}
          <div ref={scrollAnchorRef} />
        </div>

        <div className="mt-4 rounded-[28px] border border-zinc-200 bg-white p-3 shadow-sm">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              void typingChannelRef.current?.sendTyping(event.target.value.trim().length > 0);

              if (typingTimeoutRef.current) {
                window.clearTimeout(typingTimeoutRef.current);
              }

              typingTimeoutRef.current = window.setTimeout(() => {
                void typingChannelRef.current?.sendTyping(false);
              }, 1200);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (!isPending && draft.trim()) {
                  event.currentTarget.form?.requestSubmit();
                }
              }
            }}
            rows={3}
            placeholder={`Message ${room.otherMember.displayName}...`}
            className="w-full resize-none border-none bg-transparent text-sm leading-6 text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          {sendError ? (
            <p className="mt-2 text-sm text-red-500">{sendError}</p>
          ) : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const trimmedDraft = draft.trim();
              if (!trimmedDraft) {
                return;
              }

              startTransition(async () => {
                setSendError(null);
                const optimisticMessage = toOptimisticRoomMessage(
                  {
                    id: `pending-${Date.now()}`,
                    conversationId: room.conversationId,
                    senderUserId: room.currentUserId,
                    body: trimmedDraft,
                    createdAt: new Date().toISOString(),
                  },
                  currentUserSenderRef.current,
                );

                setMessages((current) => mergeMessage(current, optimisticMessage));
                setDraft("");
                void typingChannelRef.current?.sendTyping(false);

                try {
                  const insertedMessage = await sendDirectMessage(room.conversationId, trimmedDraft);
                  setMessages((current) =>
                    mergeMessage(
                      current.filter((message) => message.id !== optimisticMessage.id),
                      {
                        id: insertedMessage.id,
                        conversationId: insertedMessage.conversation_id,
                        senderUserId: insertedMessage.sender_user_id,
                        body: insertedMessage.body,
                        createdAt: insertedMessage.created_at,
                        sender: currentUserSenderRef.current,
                      },
                    ),
                  );
                  void markConversationRead(room.conversationId);
                } catch (error) {
                  setMessages((current) =>
                    current.filter((message) => message.id !== optimisticMessage.id),
                  );
                  setDraft(trimmedDraft);
                  setSendError(
                    error instanceof Error
                      ? error.message
                      : "Message could not be sent. Please try again.",
                  );
                }
              });
            }}
            className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3"
          >
            <p className="text-xs text-zinc-400">
              Realtime updates appear here while this room is open. Enter sends, Shift+Enter adds a new line.
            </p>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="px-4"
              disabled={isPending || !draft.trim()}
            >
              {isPending ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
