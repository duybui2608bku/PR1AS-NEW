/**
 * Chat API Client
 * Client-side helpers to call chat-related API routes
 */

import { axiosClient } from "@/lib/http/axios-client";
import type {
  Attachment,
  Conversation,
  ConversationWithLastMessage,
  GetMessagesResult,
  Message,
} from "./types";

export interface PaginatedConversationsResponse {
  conversations: ConversationWithLastMessage[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const chatAPI = {
  async createOrGetConversation(
    workerId: string,
    bookingId?: string | null
  ): Promise<{ conversation: Conversation }> {
    const { data } = await axiosClient.post<{
      data: { conversation: Conversation };
    }>("/chat/conversations", {
      workerId,
      bookingId: bookingId ?? null,
    });

    return data.data;
  },

  async getConversations(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedConversationsResponse> {
    const { data } = await axiosClient.get<{
      data: PaginatedConversationsResponse;
    }>(`/chat/conversations?page=${page}&limit=${limit}`);

    return data.data;
  },

  async getConversationMessages(
    conversationId: string,
    cursor?: string,
    limit: number = 30
  ): Promise<GetMessagesResult> {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (cursor) params.set("cursor", cursor);

    const { data } = await axiosClient.get<{
      data: {
        messages: Message[];
        pagination: {
          hasMore: boolean;
          nextCursor: string | null;
          limit: number;
        };
      };
    }>(`/chat/conversations/${conversationId}/messages?${params.toString()}`);

    return {
      messages: data.data.messages,
      hasMore: data.data.pagination.hasMore,
      nextCursor: data.data.pagination.nextCursor,
    };
  },

  async sendMessage(params: {
    conversationId: string;
    content?: string;
    attachments?: Attachment[];
  }): Promise<{ message: Message }> {
    const { data } = await axiosClient.post<{
      data: { message: Message };
    }>(`/chat/conversations/${params.conversationId}/messages`, {
      content: params.content,
      attachments: params.attachments,
    });

    return data.data;
  },

  async uploadChatImage(
    file: File,
    conversationId: string
  ): Promise<{ attachment: Attachment }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "chat"); // Sử dụng folder "chat" cho ảnh chat

    const { data } = await axiosClient.post<{
      data: {
        path: string;
        publicUrl: string;
        fileName: string;
      };
    }>("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Convert response từ API upload/image thành Attachment format
    const attachment: Attachment = {
      url: data.data.publicUrl,
      type: "image",
      size: file.size,
      mime_type: file.type,
    };

    return { attachment };
  },

  async markMessageAsRead(messageId: string): Promise<void> {
    await axiosClient.patch(`/chat/messages/${messageId}/read`);
  },
};
