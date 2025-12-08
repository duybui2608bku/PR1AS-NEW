"use client";

import { Avatar } from "antd";
import { ArrowLeftOutlined, UserOutlined } from "@ant-design/icons";

interface ChatHeaderProps {
  otherUserName: string;
  otherUserAvatar?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatHeader({
  otherUserName,
  otherUserAvatar,
  onBack,
  showBackButton = false,
}: ChatHeaderProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black backdrop-blur-sm shadow-sm px-5 py-4 flex items-center gap-4">
      {/* Back button (mobile) */}
      {showBackButton && (
        <button
          onClick={onBack}
          className="p-2 hover:bg-[#fff5f7] dark:hover:bg-black/50 rounded-full transition-all duration-200 lg:hidden group"
          aria-label="Quay lại"
        >
          <ArrowLeftOutlined className="text-lg text-gray-700 dark:text-gray-200 group-hover:text-[#ff385c] transition-colors" />
        </button>
      )}

      {/* Avatar with ring */}
      <div className="relative shrink-0">
        <Avatar
          src={otherUserAvatar}
          icon={!otherUserAvatar && <UserOutlined />}
          size={48}
          className="ring-2 ring-[#ff385c]/20 dark:ring-[#ff385c]/30 shadow-md"
        />
        {/* Online indicator (future) */}
        {/* <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div> */}
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base text-gray-800 dark:text-gray-200 truncate mb-0.5">
          {otherUserName}
        </h3>
        {/* Future: Online status */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Đang hoạt động
        </p>
      </div>
    </div>
  );
}
