"use client";

import { useEffect } from "react";
import { Avatar, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useConversations } from "@/hooks/chat/useConversations";
import type { ConversationWithLastMessage } from "@/lib/chat/types";

interface ConversationListProps {
  currentUserId: string;
  onConversationSelect: (conversation: ConversationWithLastMessage) => void;
  selectedConversationId?: string;
  onConversationsUpdate?: (
    conversations: ConversationWithLastMessage[]
  ) => void;
}

export function ConversationList({
  currentUserId,
  onConversationSelect,
  selectedConversationId,
  onConversationsUpdate,
}: ConversationListProps) {
  const { conversations, loading, error, hasMore, loadMore } =
    useConversations();

  // Notify parent when conversations update (for syncing selected conversation)
  useEffect(() => {
    if (onConversationsUpdate) {
      onConversationsUpdate(conversations);
    }
  }, [conversations, onConversationsUpdate]);

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-black">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
            Đang tải cuộc trò chuyện...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
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
        </div>
      </div>
    );
  }

  if (!loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-black">
        <div className="text-center max-w-xs px-6">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#fff5f7] dark:bg-black flex items-center justify-center">
              <UserOutlined className="text-2xl text-[#ff385c]" />
            </div>
          </div>
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Chưa có cuộc trò chuyện nào
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Hãy bắt đầu chat với worker hoặc client!
          </p>
        </div>
      </div>
    );
  }

  const getOtherUserInfo = (conv: ConversationWithLastMessage) => {
    const otherUserId =
      conv.client_id === currentUserId ? conv.worker_id : conv.client_id;
    return {
      id: otherUserId,
      name:
        conv.other_user?.full_name ||
        conv.other_user?.email ||
        otherUserId.substring(0, 8) + "...",
      avatar: conv.other_user?.avatar_url,
    };
  };

  const formatLastMessageTime = (timestamp: string | null) => {
    if (!timestamp) return "";
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: vi,
      });
    } catch {
      return "";
    }
  };

  const getLastMessagePreview = (conv: ConversationWithLastMessage) => {
    const lastMsg = conv.last_message;
    if (!lastMsg) return "Chưa có tin nhắn";

    if (lastMsg.content_type === "image") {
      return "📷 Ảnh";
    }
    if (lastMsg.content_type === "mixed") {
      return lastMsg.content || "📷 Ảnh";
    }
    return lastMsg.content || "";
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-5 py-4 bg-white dark:bg-black backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Cuộc trò chuyện
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {conversations.length} cuộc trò chuyện
        </p>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {conversations.map((conversation) => {
          const isSelected = conversation.id === selectedConversationId;

          return (
            <div
              key={conversation.id}
              onClick={() => onConversationSelect(conversation)}
              className={`flex items-start gap-3 px-5 py-4 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-all duration-200 ${
                isSelected
                  ? "bg-[#fff5f7] dark:bg-gray-900 border-l-4 border-l-[#ff385c] shadow-sm"
                  : "hover:bg-gray-50/80 dark:hover:bg-gray-900/50 hover:shadow-sm"
              }`}
            >
              {/* Avatar */}
              {(() => {
                const otherUser = getOtherUserInfo(conversation);
                return (
                  <div className="relative shrink-0">
                    <Avatar
                      src={otherUser.avatar}
                      icon={!otherUser.avatar && <UserOutlined />}
                      size={52}
                      className={`${
                        isSelected ? "ring-2 ring-[#ff385c]" : ""
                      } transition-all`}
                    />
                    {isSelected && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#ff385c] rounded-full border-2 border-white dark:border-black"></div>
                    )}
                  </div>
                );
              })()}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Name and time */}
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <h3
                    className={`font-semibold text-sm truncate ${
                      isSelected
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {getOtherUserInfo(conversation).name}
                  </h3>
                  <span
                    className={`text-xs shrink-0 ${
                      isSelected
                        ? "text-[#ff385c] font-medium"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {formatLastMessageTime(conversation.last_message_at)}
                  </span>
                </div>

                {/* Last message preview */}
                <p
                  className={`text-sm truncate ${
                    isSelected
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {getLastMessagePreview(conversation)}
                </p>
              </div>
            </div>
          );
        })}

        {/* Load more */}
        {hasMore && (
          <div className="p-4 text-center border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => void loadMore()}
              disabled={loading}
              className="text-sm font-medium text-[#ff385c] hover:text-[#e61e4d] disabled:text-gray-400 dark:disabled:text-gray-600 transition-colors px-4 py-2 rounded-lg hover:bg-[#fff5f7] dark:hover:bg-black/50 disabled:hover:bg-transparent"
            >
              {loading ? "Đang tải..." : "Xem thêm"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
