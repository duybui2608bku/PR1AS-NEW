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
    <div className="border-b bg-white px-4 py-3 flex items-center gap-3">
      {/* Back button (mobile) */}
      {showBackButton && (
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
        >
          <ArrowLeftOutlined className="text-lg" />
        </button>
      )}

      {/* Avatar */}
      <Avatar
        src={otherUserAvatar}
        icon={!otherUserAvatar && <UserOutlined />}
        size={40}
        className="flex-shrink-0"
      />

      {/* User info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base truncate">{otherUserName}</h3>
        {/* Future: Online status */}
        {/* <p className="text-xs text-gray-500">Đang hoạt động</p> */}
      </div>

      {/* Actions (future: video call, info, etc.) */}
      {/* <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreOutlined className="text-lg" />
        </button>
      </div> */}
    </div>
  );
}
