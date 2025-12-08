"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ConversationList } from "./ConversationList";
import { ChatDetail } from "./ChatDetail";
import type { ConversationWithLastMessage } from "@/lib/chat/types";

interface ChatPageProps {
  currentUserId: string;
}

export function ChatPage({ currentUserId }: ChatPageProps) {
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get("conversationId");

  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithLastMessage | null>(null);
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);

  // Handle conversation ID from URL
  useEffect(() => {
    if (conversationIdParam && !selectedConversation) {
      // If there's a conversation ID in URL but no selected conversation,
      // we need to fetch it or wait for the list to load
      // For now, we'll let the user select from the list
    }
  }, [conversationIdParam, selectedConversation]);

  // Sync selected conversation when conversations list updates (from realtime)
  const handleConversationsUpdate = (
    conversations: ConversationWithLastMessage[]
  ) => {
    if (selectedConversation) {
      const updatedConversation = conversations.find(
        (c) => c.id === selectedConversation.id
      );
      if (updatedConversation) {
        setSelectedConversation(updatedConversation);
      }
    }
  };

  const handleConversationSelect = (
    conversation: ConversationWithLastMessage
  ) => {
    setSelectedConversation(conversation);
    setIsMobileDetailView(true);
  };

  const handleBack = () => {
    setIsMobileDetailView(false);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Conversation List - Desktop: always show, Mobile: hide when detail is open */}
      <div
        className={`${
          isMobileDetailView ? "hidden" : "flex"
        } lg:flex w-full lg:w-80 border-r border-gray-200 dark:border-gray-800 shrink-0`}
      >
        <ConversationList
          currentUserId={currentUserId}
          onConversationSelect={handleConversationSelect}
          selectedConversationId={selectedConversation?.id}
          onConversationsUpdate={handleConversationsUpdate}
        />
      </div>

      {/* Chat Detail - Desktop: always show (or empty state), Mobile: show when conversation selected */}
      <div
        className={`${
          isMobileDetailView ? "flex" : "hidden"
        } lg:flex flex-1 overflow-hidden`}
      >
        {selectedConversation ? (
          <ChatDetail
            conversation={selectedConversation}
            currentUserId={currentUserId}
            onBack={handleBack}
            showBackButton={true}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gray-50 dark:bg-black">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">Chọn một cuộc trò chuyện</p>
              <p className="text-sm">để bắt đầu nhắn tin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
