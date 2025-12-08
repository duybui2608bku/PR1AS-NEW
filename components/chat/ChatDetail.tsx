"use client";

import { useState, useRef } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ImageViewer } from "./ImageViewer";

import type { ConversationWithLastMessage, Message } from "@/lib/chat/types";

interface ChatDetailProps {
  conversation: ConversationWithLastMessage;
  currentUserId: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatDetail({
  conversation,
  currentUserId,
  onBack,
  showBackButton = false,
}: ChatDetailProps) {
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const prependMessageRef = useRef<((message: Message) => void) | null>(null);

  // Determine other user info
  const otherUserInfo = {
    id:
      conversation.client_id === currentUserId
        ? conversation.worker_id
        : conversation.client_id,
    name:
      conversation.other_user?.full_name ||
      conversation.other_user?.email ||
      (conversation.client_id === currentUserId
        ? conversation.worker_id
        : conversation.client_id
      ).substring(0, 8) + "...",
    avatar: conversation.other_user?.avatar_url,
  };

  // Handle image click from messages
  const handleImageClick = (imageUrl: string, allImages: string[]) => {
    const index = allImages.indexOf(imageUrl);
    setViewerImages(allImages);
    setViewerInitialIndex(index >= 0 ? index : 0);
    setImageViewerOpen(true);
  };

  // Handle new message sent
  const handleMessageSent = (message: Message | null) => {
    if (message && prependMessageRef.current) {
      prependMessageRef.current(message);
      // Auto scroll to bottom after a short delay to allow DOM update
      setTimeout(() => {
        const container = document.querySelector("[data-message-list]");
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black">
      {/* Header */}
      <ChatHeader
        otherUserName={otherUserInfo.name}
        otherUserAvatar={otherUserInfo.avatar}
        onBack={onBack}
        showBackButton={showBackButton}
      />

      {/* Messages */}
      <MessageList
        conversationId={conversation.id}
        currentUserId={currentUserId}
        onImageClick={handleImageClick}
        onMessageListReady={(prependMessage) => {
          prependMessageRef.current = prependMessage;
        }}
      />

      {/* Input */}
      <ChatInput
        conversationId={conversation.id}
        onMessageSent={handleMessageSent}
      />

      {/* Image viewer */}
      <ImageViewer
        open={imageViewerOpen}
        images={viewerImages}
        initialIndex={viewerInitialIndex}
        onClose={() => setImageViewerOpen(false)}
      />
    </div>
  );
}
