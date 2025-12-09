/**
 * React Query hooks for Chat operations
 * Chat API already uses Axios, these hooks add React Query caching
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatAPI } from "@/lib/chat/api";
import { showMessage } from "@/lib/utils/toast";
import type { CreateMessageRequest } from "@/lib/chat/types";

/**
 * Query keys for chat operations
 */
export const chatKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatKeys.all, "conversations"] as const,
  conversationsList: (page?: number, limit?: number) =>
    [...chatKeys.conversations(), { page, limit }] as const,
  conversation: (id: string) => [...chatKeys.all, "conversation", id] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, "messages", conversationId] as const,
  messagesList: (conversationId: string, cursor?: string, limit?: number) =>
    [...chatKeys.messages(conversationId), { cursor, limit }] as const,
};

/**
 * Get conversations list
 */
export function useConversations(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: chatKeys.conversationsList(page, limit),
    queryFn: () => chatAPI.getConversations(page, limit),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Get single conversation
 */
export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: chatKeys.conversation(conversationId),
    queryFn: () => chatAPI.getConversation(conversationId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!conversationId, // Only fetch if conversationId exists
  });
}

/**
 * Get messages for a conversation
 */
export function useMessages(
  conversationId: string,
  cursor?: string,
  limit: number = 50
) {
  return useQuery({
    queryKey: chatKeys.messagesList(conversationId, cursor, limit),
    queryFn: () => chatAPI.getMessages(conversationId, cursor, limit),
    staleTime: 30 * 1000, // 30 seconds - messages are more real-time
    enabled: !!conversationId, // Only fetch if conversationId exists
  });
}

/**
 * Create or get conversation with a user
 */
export function useCreateOrGetConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      otherUserId,
      bookingId,
    }: {
      otherUserId: string;
      bookingId: string | null;
    }) => chatAPI.createOrGetConversation(otherUserId, bookingId),
    onSuccess: (data) => {
      // Update conversation in cache
      queryClient.setQueryData(
        chatKeys.conversation(data.conversation.id),
        data.conversation
      );
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to create conversation");
    },
  });
}

/**
 * Send message
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateMessageRequest) => chatAPI.sendMessage(request),
    onSuccess: (data) => {
      // Invalidate messages list for this conversation
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(data.message.conversation_id),
      });
      // Invalidate conversations list (to update last message)
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to send message");
    },
  });
}

/**
 * Mark messages as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      messageIds,
    }: {
      conversationId: string;
      messageIds: string[];
    }) => chatAPI.markAsRead(conversationId, messageIds),
    onSuccess: (_, variables) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.conversationId),
      });
    },
    // Silent errors for read receipts
    onError: () => {},
  });
}
