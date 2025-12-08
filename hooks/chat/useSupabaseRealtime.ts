"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/chat/types";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { RealtimeChannelStatus } from "@/lib/supabase/realtime-types";

interface UseSupabaseRealtimeOptions {
  conversationId: string;
  onMessage: (message: Message) => void;
}

/**
 * Hook to subscribe to Supabase Realtime INSERT events on messages table
 * filtered by conversation_id.
 *
 * Features:
 * - Subscribes to new messages in real-time
 * - Handles connection errors gracefully
 * - Automatically cleans up on unmount or conversation change
 * - Uses useRef to avoid unnecessary re-subscriptions
 */
export function useSupabaseRealtime({
  conversationId,
  onMessage,
}: UseSupabaseRealtimeOptions) {
  const subscriptionRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);
  const onMessageRef = useRef(onMessage);
  const currentConversationIdRef = useRef<string | null>(null);

  // Keep onMessage ref updated without causing re-subscriptions
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

    // Create a unique channel name for this conversation
    const channelName = `chat-messages-${trimmedConversationId}`;

    // Cleanup previous subscription if conversation changed
    if (
      subscriptionRef.current &&
      currentConversationIdRef.current !== trimmedConversationId
    ) {
      void supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

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
          filter: `conversation_id=eq.${trimmedConversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          try {
            if (payload.eventType !== "INSERT" || !payload.new) {
              return;
            }
            const newMessage = payload.new;

            // Validate message structure
            if (!newMessage || !newMessage.id) {
              return;
            }

            // Check if message belongs to this conversation
            if (newMessage.conversation_id !== trimmedConversationId) {
              return;
            }

            // Parse attachments if they are strings (JSONB from database)
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

            // Use ref to avoid stale closure
            onMessageRef.current(message);
          } catch (error) {
            // Silently handle errors
          }
        }
      )
      .subscribe((status: RealtimeChannelStatus) => {
        // Subscription status handled silently
      });

    subscriptionRef.current = channel;
    currentConversationIdRef.current = trimmedConversationId;

    return () => {
      if (subscriptionRef.current) {
        void supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
        currentConversationIdRef.current = null;
      }
    };
  }, [conversationId]); // Only depend on conversationId, not onMessage
}
