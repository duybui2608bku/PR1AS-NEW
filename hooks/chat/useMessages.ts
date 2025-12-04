"use client";

import { useEffect, useState } from "react";
import { chatAPI } from "@/lib/chat/api";
import type { Message } from "@/lib/chat/types";

interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  prependMessage: (message: Message) => void;
}

export function useMessages(conversationId: string): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchMessages = async (cursorParam?: string | null) => {
    if (!conversationId) return;
    try {
      setLoading(true);
      const result = await chatAPI.getConversationMessages(
        conversationId,
        cursorParam ?? undefined,
        30
      );

      if (!cursorParam) {
        setMessages(result.messages);
      } else {
        setMessages((prev) => [...prev, ...result.messages]);
      }

      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    await fetchMessages(cursor);
  };

  const prependMessage = (message: Message) => {
    setMessages((prev) => [message, ...prev]);
  };

  useEffect(() => {
    setMessages([]);
    setCursor(null);
    setHasMore(true);
    void fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMore,
    prependMessage,
  };
}


