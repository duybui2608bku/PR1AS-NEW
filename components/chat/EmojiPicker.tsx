"use client";

import { useState } from "react";
import { Popover } from "antd";
import { SmileOutlined } from "@ant-design/icons";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  "Thường dùng": ["😊", "😂", "❤️", "👍", "🙏", "😭", "😍", "🎉", "🔥", "✨"],
  "Mặt cười": [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
  ],
  "Cảm xúc": [
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "🤐",
    "🤨",
    "😐",
    "😑",
    "😶",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤥",
    "😌",
    "😔",
    "😪",
    "😴",
    "😷",
    "🤒",
  ],
  "Biểu tượng": ["❤️", "💔", "💕", "💖", "💗", "💙", "💚", "💛", "🧡", "💜"],
  "Bàn tay": [
    "👋",
    "🤚",
    "🖐️",
    "✋",
    "🖖",
    "👌",
    "🤌",
    "🤏",
    "✌️",
    "🤞",
    "🤟",
    "🤘",
    "🤙",
    "👈",
    "👉",
    "👆",
    "🖕",
    "👇",
    "☝️",
    "👍",
    "👎",
    "✊",
    "👊",
    "🤛",
    "🤜",
    "👏",
    "🙌",
    "👐",
    "🤲",
    "🤝",
    "🙏",
  ],
  "Hoạt động": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱"],
};

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Thường dùng");

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setOpen(false);
  };

  const content = (
    <div className="w-80 bg-white dark:bg-black rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-4">
      {/* Category tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-3 border-b border-gray-200 dark:border-gray-800 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-200 ${
              activeCategory === category
                ? "bg-[#ff385c] text-white shadow-md scale-105"
                : "bg-gray-100 dark:bg-black/50 text-gray-700 dark:text-gray-300 hover:bg-[#fff5f7] dark:hover:bg-black/70 hover:text-[#ff385c]"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-1.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map(
          (emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiClick(emoji)}
              className="text-2xl hover:bg-[#fff5f7] dark:hover:bg-black/50 rounded-lg p-2 transition-all duration-200 hover:scale-110 active:scale-95"
              title={emoji}
            >
              {emoji}
            </button>
          )
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="topLeft"
      overlayClassName="emoji-picker-popover"
    >
      <button
        type="button"
        className="w-12 h-12 flex items-center justify-center hover:bg-[#fff5f7] dark:hover:bg-black/50 rounded-full transition-all duration-200 group flex-shrink-0"
        title="Chọn emoji"
      >
        <SmileOutlined className="text-xl text-gray-600 dark:text-gray-400 group-hover:text-[#ff385c] transition-colors" />
      </button>
    </Popover>
  );
}
