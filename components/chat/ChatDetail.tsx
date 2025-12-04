"use client";

import { useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ImageViewer } from "./ImageViewer";
import type { ConversationWithLastMessage } from "@/lib/chat/types";

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

  // Determine other user
  const otherUserId =
    conversation.client_id === currentUserId
      ? conversation.worker_id
      : conversation.client_id;

  // Handle image click from messages
  const handleImageClick = (imageUrl: string, allImages: string[]) => {
    const index = allImages.indexOf(imageUrl);
    setViewerImages(allImages);
    setViewerInitialIndex(index >= 0 ? index : 0);
    setImageViewerOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <ChatHeader
        otherUserName={otherUserId.substring(0, 8) + "..."}
        onBack={onBack}
        showBackButton={showBackButton}
      />

      {/* Messages */}
      <MessageList
        conversationId={conversation.id}
        currentUserId={currentUserId}
        onImageClick={handleImageClick}
      />

      {/* Input */}
      <ChatInput conversationId={conversation.id} />

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
