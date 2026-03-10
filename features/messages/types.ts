export type MessageProfile = {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

export type InboxThread = {
  conversationId: string;
  updatedAt: string;
  lastReadAt: string | null;
  otherMember: MessageProfile;
  lastMessage: {
    id: string;
    body: string;
    createdAt: string;
    senderUserId: string;
  } | null;
  unreadCount: number;
};

export type RoomMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
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
};
