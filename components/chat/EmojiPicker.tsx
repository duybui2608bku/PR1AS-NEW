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
    <div className="w-80">
      {/* Category tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2 border-b">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors ${
              activeCategory === category
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map(
          (emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiClick(emoji)}
              className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
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
    >
      <button
        type="button"
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        title="Chọn emoji"
      >
        <SmileOutlined className="text-xl text-gray-600" />
      </button>
    </Popover>
  );
}
