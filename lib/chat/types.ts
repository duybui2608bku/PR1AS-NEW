/**
 * Chat System Type Definitions
 * Conversations between clients and workers + messages (text/image/mixed)
 */

export type MessageContentType = "text" | "image" | "mixed";

export type MessageStatus = "sent" | "delivered" | "read";

export interface Attachment {
  url: string;
  type: "image";
  width?: number;
  height?: number;
  size?: number;
  mime_type?: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  worker_id: string;
  booking_id: string | null;
  created_at: string;
  updated_at: string;
  last_message_id: string | null;
  last_message_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  content_type: MessageContentType;
  attachments: Attachment[] | null;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// SERVICE INPUT TYPES
// =============================================================================

export interface CreateMessageInput {
  conversationId: string;
  senderId: string;
  content?: string | null;
  attachments?: Attachment[] | null;
}

export interface GetMessagesParams {
  conversationId: string;
  userId: string;
  cursor?: string;
  limit?: number;
}

export interface GetMessagesResult {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface ConversationWithLastMessage extends Conversation {
  last_message?: Message | null;
}


