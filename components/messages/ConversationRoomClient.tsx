"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { ImageIcon } from "@/components/ui/icons";
import { useBrowserCapabilities } from "@/lib/browserCapabilities";
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

const FlowerSticker = ({
  className,
  petalClassName,
  centerClassName,
}: {
  className: string;
  petalClassName: string;
  centerClassName: string;
}) => (
  <div className={`pointer-events-none absolute ${className}`}>
    <div className="relative h-full w-full">
      <span className={`absolute left-1/2 top-0 h-[38%] w-[38%] -translate-x-1/2 rounded-full ${petalClassName}`} />
      <span className={`absolute left-0 top-1/2 h-[38%] w-[38%] -translate-y-1/2 rounded-full ${petalClassName}`} />
      <span className={`absolute right-0 top-1/2 h-[38%] w-[38%] -translate-y-1/2 rounded-full ${petalClassName}`} />
      <span className={`absolute bottom-0 left-1/2 h-[38%] w-[38%] -translate-x-1/2 rounded-full ${petalClassName}`} />
      <span className={`absolute left-1/2 top-1/2 h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full ${petalClassName}`} />
      <span className={`absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full ${centerClassName}`} />
    </div>
  </div>
);

const DatingIntroDecorations = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <FlowerSticker
      className="-left-6 top-24 h-28 w-28 rotate-[-10deg] opacity-80 blur-[0.2px]"
      petalClassName="bg-rose-200/80 shadow-[0_8px_24px_rgba(244,114,182,0.18)]"
      centerClassName="bg-amber-200/90"
    />
    <FlowerSticker
      className="right-6 top-28 hidden h-24 w-24 rotate-[12deg] opacity-70 md:block"
      petalClassName="bg-fuchsia-200/75 shadow-[0_8px_20px_rgba(217,70,239,0.16)]"
      centerClassName="bg-yellow-200/90"
    />
    <FlowerSticker
      className="bottom-28 right-[-12px] h-32 w-32 rotate-[18deg] opacity-65"
      petalClassName="bg-rose-100/80 shadow-[0_10px_26px_rgba(244,114,182,0.16)]"
      centerClassName="bg-amber-100/90"
    />
    <div className="absolute left-10 top-40 h-24 w-24 rounded-full bg-rose-200/20 blur-3xl" />
    <div className="absolute bottom-16 right-20 h-32 w-32 rounded-full bg-fuchsia-200/20 blur-3xl" />
  </div>
);

const mergeMessage = (messages: RoomMessage[], incomingMessage: RoomMessage) => {
  const deduped = messages.filter((message) => message.id !== incomingMessage.id);
  return [...deduped, incomingMessage].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
};

export function ConversationRoomClient({ room }: ConversationRoomClientProps) {
  const [messages, setMessages] = useState(room.messages);
  const [draft, setDraft] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isOtherMemberOnline, setIsOtherMemberOnline] = useState(false);
  const [isOtherMemberTyping, setIsOtherMemberTyping] = useState(false);
  const [isPending, startTransition] = useTransition();
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
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
  const capabilities = useBrowserCapabilities();
  const isDatingIntro = room.specialRequest?.intent === "dating_intro";
  const isBrandCollab = room.specialRequest?.intent === "brand_collab";
  const composerHint = capabilities.supportsClipboardImagePaste
    ? "Paste screenshots here. Enter sends, Shift+Enter adds a new line."
    : capabilities.isSafari || capabilities.isMobile
      ? "Image paste is limited on this browser. Use Photo for screenshots."
      : "Use Photo to attach an image. Enter sends, Shift+Enter adds a new line.";

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!selectedImage) {
      setSelectedImageUrl(null);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedImage);
    setSelectedImageUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  useEffect(() => {
    if (isPending) {
      return;
    }

    const handleWindowPaste = (event: ClipboardEvent) => {
      const pastedImage = Array.from(event.clipboardData?.items ?? []).find((item) =>
        item.type.startsWith("image/"),
      );
      const imageFile = pastedImage?.getAsFile() ?? null;

      if (!imageFile) {
        return;
      }

      event.preventDefault();
      setSelectedImage(imageFile);
      setSendError(null);
    };

    window.addEventListener("paste", handleWindowPaste);
    return () => {
      window.removeEventListener("paste", handleWindowPaste);
    };
  }, [isPending]);

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
            messageType: payload.message_type,
            attachment: payload.attachment,
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
    <div
      className={`flex min-h-screen flex-col ${
        isDatingIntro
          ? "bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.14),_transparent_38%),linear-gradient(180deg,#fff8fb_0%,#ffffff_28%)]"
          : isBrandCollab
            ? "bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_38%),linear-gradient(180deg,#f7fbff_0%,#ffffff_28%)]"
            : "bg-white"
      }`}
    >
      {isDatingIntro ? <DatingIntroDecorations /> : null}
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
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <span className="truncate">@{room.otherMember.handle}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${isOtherMemberTyping || isOtherMemberOnline ? "bg-emerald-500" : "bg-zinc-300"}`} />
              <span className="truncate">
                {isOtherMemberTyping ? "typing..." : isOtherMemberOnline ? "online" : "offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col px-4 py-5">
        {room.specialRequest ? (
          <div
            className={`mb-4 rounded-[28px] border px-5 py-4 ${
              isDatingIntro
                ? "border-rose-200 bg-[linear-gradient(135deg,#fff1f7_0%,#fff8fb_100%)]"
                : "border-sky-200 bg-[linear-gradient(135deg,#eef8ff_0%,#f8fbff_100%)]"
            }`}
          >
            <p
              className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                isDatingIntro ? "text-rose-500" : "text-sky-600"
              }`}
            >
              {isDatingIntro ? "Dating intro" : "Brand / collab"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold text-zinc-900">
                {isDatingIntro
                  ? "This chat started as a dating intro."
                  : "This chat started as a brand or collab request."}
              </p>
              {room.specialRequest.creditsSpent > 0 ? (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm">
                  {room.specialRequest.creditsSpent} credits spent
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {isDatingIntro
                ? "A softer intro theme is active for this room."
                : "A polished pitch theme is active for this room."}
            </p>
          </div>
        ) : null}
        <div className="flex-1 space-y-3 overflow-y-auto pb-6">
          {messages.length > 0 ? (
            messages.map((message) => {
              const isCurrentUser = message.senderUserId === room.currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] overflow-hidden rounded-[24px] shadow-sm ${
                      isCurrentUser
                        ? "bg-black text-white"
                        : "border border-zinc-100 bg-zinc-50 text-zinc-900"
                    }`}
                  >
                    {message.attachment ? (
                      <div className="overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={message.attachment.url}
                          alt={message.body.trim() || "Shared photo"}
                          className="max-h-[360px] w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="px-4 py-3">
                      {message.body.trim() ? (
                        <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                      ) : null}
                      <div
                        className={`flex items-center gap-2 text-[11px] ${
                          message.body.trim() ? "mt-2" : ""
                        } ${isCurrentUser ? "text-zinc-300" : "text-zinc-400"}`}
                      >
                        <span>{message.sender.displayName}</span>
                        <span>·</span>
                        <RelativeTime dateString={message.createdAt} />
                        {message.isPending ? <span>· sending</span> : null}
                      </div>
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

        <div className="sticky bottom-0 mt-4 rounded-[28px] border border-zinc-200 bg-white p-3 shadow-sm">
          {selectedImage && selectedImageUrl ? (
            <div className="mb-3 overflow-hidden rounded-[24px] border border-zinc-200 bg-zinc-50">
              <div className="aspect-[4/3] w-full bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImageUrl}
                  alt={selectedImage.name || "Selected image preview"}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {selectedImage.name || "Selected image"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Ready to send as a DM attachment
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    setSelectedImage(null);
                    setSendError(null);
                    if (imageInputRef.current) {
                      imageInputRef.current.value = "";
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : null}
          <textarea
            form="conversation-message-form"
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
            onPaste={(event) => {
              const pastedImage = Array.from(event.clipboardData.items).find((item) =>
                item.type.startsWith("image/"),
              );
              const imageFile = pastedImage?.getAsFile() ?? null;

              if (!imageFile) {
                return;
              }

              event.preventDefault();
              setSelectedImage(imageFile);
              setSendError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (!isPending && (draft.trim() || selectedImage)) {
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
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;
              setSelectedImage(nextFile);
              setSendError(null);
            }}
          />
          <form
            id="conversation-message-form"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmedDraft = draft.trim();
              if (!trimmedDraft && !selectedImage) {
                return;
              }

              startTransition(async () => {
                setSendError(null);
                const imageToSend = selectedImage;
                const shouldUseOptimisticTextMessage = !imageToSend;
                const optimisticMessage = shouldUseOptimisticTextMessage
                  ? toOptimisticRoomMessage(
                      {
                        id: `pending-${Date.now()}`,
                        conversationId: room.conversationId,
                        senderUserId: room.currentUserId,
                        body: trimmedDraft,
                        createdAt: new Date().toISOString(),
                      },
                      currentUserSenderRef.current,
                    )
                  : null;

                if (optimisticMessage) {
                  setMessages((current) => mergeMessage(current, optimisticMessage));
                }

                setDraft("");
                if (imageToSend) {
                  setSelectedImage(null);
                  if (imageInputRef.current) {
                    imageInputRef.current.value = "";
                  }
                }
                void typingChannelRef.current?.sendTyping(false);

                try {
                  const insertedMessage = await sendDirectMessage(
                    room.conversationId,
                    trimmedDraft,
                    imageToSend,
                  );
                  setMessages((current) =>
                    mergeMessage(
                      optimisticMessage
                        ? current.filter((message) => message.id !== optimisticMessage.id)
                        : current,
                      {
                        id: insertedMessage.id,
                        conversationId: insertedMessage.conversation_id,
                        senderUserId: insertedMessage.sender_user_id,
                        body: insertedMessage.body,
                        messageType: insertedMessage.message_type,
                        attachment: insertedMessage.attachment,
                        createdAt: insertedMessage.created_at,
                        sender: currentUserSenderRef.current,
                      },
                    ),
                  );
                  void markConversationRead(room.conversationId);
                } catch (error) {
                  if (optimisticMessage) {
                    setMessages((current) =>
                      current.filter((message) => message.id !== optimisticMessage.id),
                    );
                  }
                  setDraft(trimmedDraft);
                  if (imageToSend) {
                    setSelectedImage(imageToSend);
                  }
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
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full px-3 text-zinc-600"
                disabled={isPending}
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Photo
              </Button>
              <p className="text-xs text-zinc-400">
                {composerHint}
              </p>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="px-4"
              disabled={isPending || (!draft.trim() && !selectedImage)}
            >
              {isPending ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
