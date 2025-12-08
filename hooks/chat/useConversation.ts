"use client";

import { useEffect, useState } from "react";
import type { ConversationWithLastMessage } from "@/lib/chat/types";
import { axiosClient } from "@/lib/http/axios-client";

interface UseConversationResult {
  conversation: ConversationWithLastMessage | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useConversation(conversationId: string): UseConversationResult {
  const [conversation, setConversation] =
    useState<ConversationWithLastMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversation = async () => {
    if (!conversationId) return;
    try {
      setLoading(true);
      const { data } = await axiosClient.get<{
        data: { conversation: ConversationWithLastMessage };
      }>(`/chat/conversations/${conversationId}`);
      setConversation(data.data.conversation);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return {
    conversation,
    loading,
    error,
    refetch: fetchConversation,
  };
}
