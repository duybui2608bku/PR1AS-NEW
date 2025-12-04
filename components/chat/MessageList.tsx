"use client";

import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { useMessages } from "@/hooks/chat/useMessages";
import { useSupabaseRealtime } from "@/hooks/chat/useSupabaseRealtime";
import type { Message } from "@/lib/chat/types";
import { Spin } from "antd";

interface MessageListProps {
  conversationId: string;
  currentUserId: string;
  onImageClick?: (imageUrl: string, allImages: string[]) => void;
}

export function MessageList({
  conversationId,
  currentUserId,
  onImageClick,
}: MessageListProps) {
  const { messages, loading, hasMore, loadMore, prependMessage } =
    useMessages(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Handle real-time new messages
  useSupabaseRealtime({
    conversationId,
    onMessage: (newMessage: Message) => {
      // Only prepend if it's not already in the list
      if (!messages.find((m) => m.id === newMessage.id)) {
        prependMessage(newMessage);
        // Auto scroll if user is near bottom
        if (shouldAutoScroll) {
          setTimeout(() => scrollToBottom(), 100);
        }
      }
    },
  });

  // Auto scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Check if user is near bottom
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;
    setShouldAutoScroll(isNearBottom);

    // Load more when scrolling to top
    if (container.scrollTop === 0 && hasMore && !loading) {
      void loadMore();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">Chưa có tin nhắn nào</p>
          <p className="text-sm">Hãy bắt đầu cuộc trò chuyện!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4"
    >
      {/* Load more indicator */}
      {hasMore && (
        <div className="flex justify-center mb-4">
          <button
            onClick={() => void loadMore()}
            disabled={loading}
            className="text-sm text-blue-500 hover:text-blue-600 disabled:text-gray-400"
          >
            {loading ? "Đang tải..." : "Tải tin nhắn cũ hơn"}
          </button>
        </div>
      )}

      {/* Messages (reversed order - oldest first) */}
      {[...messages].reverse().map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isOwnMessage={message.sender_id === currentUserId}
          onImageClick={onImageClick}
        />
      ))}

      {/* Anchor for auto-scroll */}
      <div ref={messagesEndRef} />
    </div>
  );
}
