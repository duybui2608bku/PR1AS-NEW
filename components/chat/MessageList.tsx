"use client";

import { useEffect, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { useMessages } from "@/hooks/chat/useMessages";
import { useSupabaseRealtimeFixed } from "@/hooks/chat/useSupabaseRealtimeFixed";
import type { Message } from "@/lib/chat/types";
import { Spin } from "antd";

interface MessageListProps {
  conversationId: string;
  currentUserId: string;
  onImageClick?: (imageUrl: string, allImages: string[]) => void;
  onMessageListReady?: (prependMessage: (message: Message) => void) => void;
}

export function MessageList({
  conversationId,
  currentUserId,
  onImageClick,
  onMessageListReady,
}: MessageListProps) {
  const { messages, loading, error, hasMore, loadMore, prependMessage } =
    useMessages(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Handle real-time new messages
  useSupabaseRealtimeFixed({
    conversationId,
    onMessage: (newMessage: Message) => {
      // Only prepend if it's not already in the list
      // Check both by ID and by timestamp to avoid duplicates
      const exists = messages.some((m) => m.id === newMessage.id);
      if (exists) {
        return;
      }

      prependMessage(newMessage);
      // Auto scroll if user is near bottom
      if (shouldAutoScroll) {
        setTimeout(() => scrollToBottom(), 100);
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

  // Expose prependMessage to parent component with auto-scroll
  useEffect(() => {
    if (onMessageListReady) {
      const prependWithScroll = (message: Message) => {
        prependMessage(message);
        // Auto scroll if user is near bottom
        if (shouldAutoScroll) {
          setTimeout(() => scrollToBottom(), 100);
        }
      };
      onMessageListReady(prependWithScroll);
    }
  }, [onMessageListReady, prependMessage, shouldAutoScroll]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-black">
        <div className="text-center max-w-xs px-6">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <p className="text-base font-semibold text-red-600 dark:text-red-400 mb-1">
            Có lỗi xảy ra
          </p>
          <p className="text-sm text-red-500 dark:text-red-400 mt-2">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-colors text-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
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
      data-message-list
      className="flex-1 overflow-y-auto px-4 py-4"
    >
      {/* Load more indicator */}
      {hasMore && (
        <div className="flex justify-center mb-4">
          <button
            onClick={() => void loadMore()}
            disabled={loading}
            className="text-sm text-[#ff385c] hover:text-[#e61e4d] disabled:text-gray-400 dark:disabled:text-gray-600"
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
