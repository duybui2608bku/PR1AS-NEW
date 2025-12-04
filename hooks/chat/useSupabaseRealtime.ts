"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/chat/types";

interface UseSupabaseRealtimeOptions {
  conversationId: string;
  onMessage: (message: Message) => void;
}

/**
 * Simple hook to subscribe to Supabase Realtime INSERT events on messages table
 * filtered by conversation_id.
 */
export function useSupabaseRealtime({
  conversationId,
  onMessage,
}: UseSupabaseRealtimeOptions) {
  const subscriptionRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`chat-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          onMessage(newMessage);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        void supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [conversationId, onMessage]);
}


