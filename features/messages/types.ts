export type MessageProfile = {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

export type MessageAttachment = {
  kind: "image";
  storagePath: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  url: string;
};

export type MessageKind = "text" | "image";

export type InboxThread = {
  conversationId: string;
  updatedAt: string;
  lastReadAt: string | null;
  otherMember: MessageProfile;
  lastMessage: {
    id: string;
    body: string;
    previewText: string;
    createdAt: string;
    senderUserId: string;
    messageType: MessageKind;
  } | null;
  unreadCount: number;
};

export type RoomMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  messageType: MessageKind;
  attachment: MessageAttachment | null;
  createdAt: string;
  sender: MessageProfile;
  isPending?: boolean;
};

export type ConversationRoom = {
  conversationId: string;
  currentUserId: string;
  otherMember: MessageProfile;
  updatedAt: string | null;
  lastReadAt: string | null;
  messages: RoomMessage[];
  specialRequest?: {
    intent: "dating_intro" | "brand_collab";
    theme: string | null;
    creditsSpent: number;
  } | null;
};
