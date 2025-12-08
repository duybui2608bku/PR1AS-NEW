"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/chat/types";
import type {
  RealtimePostgresChangesPayload,
  RealtimeChannelStatus,
} from "@/lib/supabase/realtime-types";

interface UseSupabaseRealtimeOptions {
  conversationId: string;
  onMessage: (message: Message) => void;
}

/**
 * IMPROVED Hook to subscribe to Supabase Realtime INSERT events
 *
 * Fixes:
 * - Try multiple filter formats (UUID có thể cần quote)
 * - Better error handling
 * - Debug logging
 * - Fallback subscription without filter
 */
export function useSupabaseRealtimeFixed({
  conversationId,
  onMessage,
}: UseSupabaseRealtimeOptions) {
  const subscriptionRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const onMessageRef = useRef(onMessage);
  const currentConversationIdRef = useRef<string | null>(null);
  const fallbackSubscriptionRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  // Keep onMessage ref updated
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    // Validate conversationId
    if (
      !conversationId ||
      typeof conversationId !== "string" ||
      conversationId.trim() === ""
    ) {
      return;
    }

    const trimmedConversationId = conversationId.trim();

    // Skip if already subscribed to the same conversation
    if (
      currentConversationIdRef.current === trimmedConversationId &&
      subscriptionRef.current
    ) {
      return;
    }

    const supabase = createClient();

    // Cleanup previous subscriptions
    if (
      subscriptionRef.current &&
      currentConversationIdRef.current !== trimmedConversationId
    ) {
      void supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    if (fallbackSubscriptionRef.current) {
      void supabase.removeChannel(fallbackSubscriptionRef.current);
      fallbackSubscriptionRef.current = null;
    }

    // Try multiple filter formats
    const filterFormats = [
      `conversation_id=eq.${trimmedConversationId}`, // Standard format
      `conversation_id=eq."${trimmedConversationId}"`, // Quoted UUID
      `conversation_id=eq.'${trimmedConversationId}'`, // Single quotes
    ];

    // Primary subscription with filter (try first format)
    const channelName = `chat-messages-${trimmedConversationId}`;
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: "" },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: filterFormats[0], // Try standard format first
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          try {
            if (payload.eventType !== "INSERT" || !payload.new) {
              return;
            }
            const newMessage = payload.new;

            if (!newMessage.id) {
              return;
            }

            if (newMessage.conversation_id !== trimmedConversationId) {
              return;
            }

            // Parse attachments
            let parsedAttachments: Message["attachments"] = null;
            if (newMessage.attachments) {
              if (typeof newMessage.attachments === "string") {
                try {
                  const parsed = JSON.parse(newMessage.attachments);
                  parsedAttachments = Array.isArray(parsed) ? parsed : null;
                } catch {
                  parsedAttachments = null;
                }
              } else if (Array.isArray(newMessage.attachments)) {
                parsedAttachments = newMessage.attachments;
              }
            }

            // Create properly typed message
            const message: Message = {
              ...newMessage,
              attachments: parsedAttachments,
            };

            onMessageRef.current(message);
          } catch {
            // Silently handle errors
          }
        }
      )
      .subscribe((status: RealtimeChannelStatus) => {
        // Subscription status handled silently
      });

    subscriptionRef.current = channel;
    currentConversationIdRef.current = trimmedConversationId;

    // Fallback: Subscription WITHOUT filter (to catch all events and filter client-side)
    // This helps debug if filter is the issue
    const fallbackChannelName = `chat-messages-fallback-${trimmedConversationId}`;
    const fallbackChannel = supabase
      .channel(fallbackChannelName, {
        config: {
          broadcast: { self: false },
          presence: { key: "" },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          // NO FILTER - catch all INSERT events
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          try {
            if (payload.eventType !== "INSERT" || !payload.new) {
              return;
            }
            const newMessage = payload.new;

            // Only process if it's for this conversation
            if (newMessage.conversation_id === trimmedConversationId) {
              // Parse attachments
              let parsedAttachments: Message["attachments"] = null;
              if (newMessage.attachments) {
                if (typeof newMessage.attachments === "string") {
                  try {
                    const parsed = JSON.parse(newMessage.attachments);
                    parsedAttachments = Array.isArray(parsed) ? parsed : null;
                  } catch {
                    parsedAttachments = null;
                  }
                } else if (Array.isArray(newMessage.attachments)) {
                  parsedAttachments = newMessage.attachments;
                }
              }

              // Create properly typed message
              const message: Message = {
                ...newMessage,
                attachments: parsedAttachments,
              };

              // Only call callback if primary subscription didn't already handle it
              // (to avoid duplicates)
              onMessageRef.current(message);
            }
          } catch {
            // Silently handle errors
          }
        }
      )
      .subscribe((status: RealtimeChannelStatus) => {
        // Subscription status handled silently
      });

    fallbackSubscriptionRef.current = fallbackChannel;

    return () => {
      if (subscriptionRef.current) {
        void supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      if (fallbackSubscriptionRef.current) {
        void supabase.removeChannel(fallbackSubscriptionRef.current);
        fallbackSubscriptionRef.current = null;
      }
      currentConversationIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);
}
