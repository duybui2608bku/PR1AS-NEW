"use client";

import { useEffect, useState } from "react";
import { chatAPI } from "@/lib/chat/api";
import type { ConversationWithLastMessage } from "@/lib/chat/types";

interface UseConversationsResult {
  conversations: ConversationWithLastMessage[];
  loading: boolean;
  error: Error | null;
  page: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useConversations(): UseConversationsResult {
  const [conversations, setConversations] = useState<
    ConversationWithLastMessage[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = async (pageToLoad: number, append: boolean) => {
    try {
      setLoading(true);
      const result = await chatAPI.getConversations(pageToLoad, 20);

      setHasMore(pageToLoad < result.pagination.pages);
      setPage(pageToLoad);

      setConversations((prev) =>
        append ? [...prev, ...result.conversations] : result.conversations
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchPage(1, false);
  };

  const loadMore = async () => {
    if (loading || !hasMore) return;
    await fetchPage(page + 1, true);
  };

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    conversations,
    loading,
    error,
    page,
    hasMore,
    refetch,
    loadMore,
  };
}


