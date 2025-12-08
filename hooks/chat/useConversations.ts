"use client";

import { useEffect, useState, useRef } from "react";
import { chatAPI } from "@/lib/chat/api";
import { createClient } from "@/lib/supabase/client";
import type { ConversationWithLastMessage, Message } from "@/lib/chat/types";
import type {
  RealtimePostgresChangesPayload,
  RealtimeChannelStatus,
} from "@/lib/supabase/realtime-types";

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
  const subscriptionRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

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

  // Subscribe to realtime updates for all messages
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          try {
            if (payload.eventType !== "INSERT" || !payload.new) {
              return;
            }
            const newMessage = payload.new;

            // Update conversation list when a new message arrives
            setConversations((prev) => {
              // Check if this message belongs to any conversation in our list
              const conversationIndex = prev.findIndex(
                (conv) => conv.id === newMessage.conversation_id
              );

              if (conversationIndex === -1) {
                // Conversation not in current list, might need to refetch
                // But don't refetch automatically to avoid unnecessary API calls
                return prev;
              }

              // Parse attachments if needed
              const parsedMessage = { ...newMessage };
              if (parsedMessage.attachments) {
                if (typeof parsedMessage.attachments === "string") {
                  try {
                    parsedMessage.attachments = JSON.parse(
                      parsedMessage.attachments
                    );
                  } catch {
                    parsedMessage.attachments = null;
                  }
                }
                if (!Array.isArray(parsedMessage.attachments)) {
                  parsedMessage.attachments = null;
                }
              }

              // Update the conversation with new last message
              const updatedConversations = [...prev];
              const updatedConversation = {
                ...updatedConversations[conversationIndex],
                last_message: parsedMessage,
                last_message_at: parsedMessage.created_at,
                last_message_id: parsedMessage.id,
              };

              // Remove from current position and add to top (sorted by last_message_at)
              updatedConversations.splice(conversationIndex, 1);
              updatedConversations.unshift(updatedConversation);

              // Re-sort by last_message_at (most recent first)
              updatedConversations.sort((a, b) => {
                const timeA = a.last_message_at
                  ? new Date(a.last_message_at).getTime()
                  : 0;
                const timeB = b.last_message_at
                  ? new Date(b.last_message_at).getTime()
                  : 0;
                return timeB - timeA;
              });

              return updatedConversations;
            });
          } catch (error) {
            console.error(
              "Error handling realtime message in conversations:",
              error
            );
          }
        }
      )
      .subscribe((status: RealtimeChannelStatus) => {
        if (status === "SUBSCRIBED") {
        } else if (status === "CHANNEL_ERROR") {
        } else if (status === "TIMED_OUT") {
        }
      });

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        void supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    void refetch();
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
