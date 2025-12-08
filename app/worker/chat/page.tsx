"use client";

import { useEffect, useState } from "react";
import { Spin } from "antd";
import { MessageOutlined, LockOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { authAPI } from "@/lib/auth/api-client";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatDetail } from "@/components/chat/ChatDetail";
import type { ConversationWithLastMessage } from "@/lib/chat/types";

export default function WorkerChatPage() {
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithLastMessage | null>(null);
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Use API to get profile (handles authentication properly)
        const profile = await authAPI.getProfile();
        if (profile?.id) {
          setUserId(profile.id);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        // User not authenticated or profile not found
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 via-[#fff5f7]/30 to-slate-50 dark:from-black dark:via-black/30 dark:to-black">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
            Đang tải...
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 via-[#fff5f7]/30 to-slate-50 dark:from-gray-900 dark:via-gray-800/30 dark:to-gray-900 px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#fff5f7] to-[#ffe5e9] dark:from-black dark:to-black flex items-center justify-center">
              <LockOutlined className="text-3xl text-[#ff385c]" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {t("chat.pleaseLogin") || "Vui lòng đăng nhập"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t("chat.loginToUseChat") || "để sử dụng tính năng chat"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 via-[#fff5f7]/30 to-slate-50 dark:from-black dark:via-black/30 dark:to-black">
      {/* Page Header */}
      <div className="px-6 py-4 bg-white dark:bg-black backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#ff385c] to-[#e61e4d] bg-clip-text text-transparent">
          {t("chat.title") || "Tin nhắn"}
        </h1>
      </div>

      {/* Main Chat Container */}
      <div className="flex h-[calc(100%-73px)] overflow-hidden">
        {/* Conversation List - Desktop: always show, Mobile: hide when detail is open */}
        <div
          className={`${
            isMobileDetailView ? "hidden" : "flex"
          } lg:flex w-full lg:w-96 flex-shrink-0 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-300`}
        >
          <div className="w-full h-full overflow-hidden">
            <ConversationList
              currentUserId={userId}
              onConversationSelect={handleConversationSelect}
              selectedConversationId={selectedConversation?.id}
              onConversationsUpdate={handleConversationsUpdate}
            />
          </div>
        </div>

        {/* Chat Detail - Desktop: always show (or empty state), Mobile: show when conversation selected */}
        <div
          className={`${
            isMobileDetailView ? "flex" : "hidden"
          } lg:flex flex-1 overflow-hidden transition-all duration-300`}
        >
          {selectedConversation ? (
            <div className="w-full h-full overflow-hidden bg-white dark:bg-black">
              <ChatDetail
                conversation={selectedConversation}
                currentUserId={userId}
                onBack={handleBack}
                showBackButton={true}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-white via-[#fff5f7]/20 to-[#ffe5e9]/20 dark:from-black dark:via-black/20 dark:to-black/20">
              <div className="text-center max-w-md px-6">
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#fff5f7] via-[#ffe5e9] to-[#ffd6dc] dark:from-black dark:via-black dark:to-black flex items-center justify-center shadow-lg">
                      <MessageOutlined className="text-4xl text-[#ff385c]" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#ff385c] rounded-full border-2 border-white dark:border-black animate-pulse"></div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  {t("chat.selectConversation") || "Chọn một cuộc trò chuyện"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t("chat.startMessaging") || "để bắt đầu nhắn tin"}
                </p>
                <div className="mt-8 flex justify-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full bg-[#ff385c] animate-bounce opacity-80"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-[#e61e4d] animate-bounce opacity-80"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-[#ff6b8a] animate-bounce opacity-80"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
