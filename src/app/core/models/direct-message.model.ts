export type MessageContextType =
  | 'PET'
  | 'LOST_REPORT'
  | 'ADOPTION_REQUEST'
  | 'FOLLOWUP'
  | 'PROFILE';

export interface DirectParticipant {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  profilePhotoUrl: string | null;
  isPhoneVerified: boolean;
}

export interface DirectConversation {
  id: string;
  otherParticipant: DirectParticipant;
  lastMessageText: string | null;
  lastMessageAt: string;
  lastSenderId: string | null;
  unreadCount: number;
  contextType: MessageContextType | string | null;
  contextId: string | null;
  contextTitle: string | null;
  contextSubtitle: string | null;
  contextImageUrl: string | null;
  contextTargetUrl: string | null;
  contextWhatsappPhone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  sender?: DirectParticipant;
  content: string;
  attachmentUrl?: string | null;
  contextType?: MessageContextType | string | null;
  contextId?: string | null;
  contextTitle?: string | null;
  contextSubtitle?: string | null;
  contextImageUrl?: string | null;
  contextTargetUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  isOptimistic?: boolean;
  sendFailed?: boolean;
}

export interface StartConversationPayload {
  recipientId: string;
  recipientName?: string;
  contextType?: MessageContextType | string;
  contextId?: string;
  contextTitle?: string;
  contextSubtitle?: string;
  contextImageUrl?: string;
  contextTargetUrl?: string;
  contextWhatsappPhone?: string;
  initialMessage?: string;
  prefilledDraft?: string;
}

export interface SendMessagePayload {
  content?: string;
  attachmentUrl?: string;
  contextType?: MessageContextType | string;
  contextId?: string;
  contextTitle?: string;
  contextSubtitle?: string;
  contextImageUrl?: string;
  contextTargetUrl?: string;
}

export interface ConversationsListResponse {
  items: DirectConversation[];
  totalUnreadMessages: number;
  unreadConversationsCount: number;
}

export interface ConversationMessagesResponse {
  conversation: DirectConversation;
  messages: DirectMessage[];
}

export interface UnreadMessagesCountResponse {
  unreadMessagesCount: number;
  unreadConversationsCount: number;
}

