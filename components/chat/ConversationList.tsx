"use client";

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
}

export function ConversationList({
  currentUserId,
  onConversationSelect,
  selectedConversationId,
}: ConversationListProps) {
  const { conversations, loading, error, hasMore, loadMore } =
    useConversations();

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <div className="text-center">
          <p>Có lỗi xảy ra</p>
          <p className="text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">Chưa có cuộc trò chuyện nào</p>
          <p className="text-sm">
            Hãy bắt đầu chat với worker hoặc client!
          </p>
        </div>
      </div>
    );
  }

  const getOtherUserId = (conv: ConversationWithLastMessage) => {
    return conv.client_id === currentUserId
      ? conv.worker_id
      : conv.client_id;
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3 bg-white">
        <h2 className="text-lg font-semibold">Tin nhắn</h2>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const isSelected = conversation.id === selectedConversationId;

          return (
            <div
              key={conversation.id}
              onClick={() => onConversationSelect(conversation)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b transition-colors ${
                isSelected
                  ? "bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
            >
              {/* Avatar */}
              <Avatar
                icon={<UserOutlined />}
                size={48}
                className="flex-shrink-0"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Name and time */}
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h3 className="font-medium text-sm truncate">
                    {/* Future: Fetch and display actual user name */}
                    {getOtherUserId(conversation).substring(0, 8)}...
                  </h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatLastMessageTime(conversation.last_message_at)}
                  </span>
                </div>

                {/* Last message preview */}
                <p className="text-sm text-gray-600 truncate">
                  {getLastMessagePreview(conversation)}
                </p>
              </div>
            </div>
          );
        })}

        {/* Load more */}
        {hasMore && (
          <div className="p-4 text-center">
            <button
              onClick={() => void loadMore()}
              disabled={loading}
              className="text-sm text-blue-500 hover:text-blue-600 disabled:text-gray-400"
            >
              {loading ? "Đang tải..." : "Xem thêm"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
