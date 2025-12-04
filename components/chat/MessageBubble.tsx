"use client";

import { useMemo } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Message } from "@/lib/chat/types";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onImageClick?: (imageUrl: string, allImages: string[]) => void;
}

export function MessageBubble({
  message,
  isOwnMessage,
  onImageClick,
}: MessageBubbleProps) {
  const imageUrls = useMemo(() => {
    return message.attachments?.map((att) => att.url) || [];
  }, [message.attachments]);

  const handleImageClick = (imageUrl: string) => {
    if (onImageClick) {
      onImageClick(imageUrl, imageUrls);
    }
  };

  const formattedTime = format(new Date(message.created_at), "HH:mm", {
    locale: vi,
  });

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[70%] ${
          isOwnMessage
            ? "bg-blue-500 text-white rounded-2xl rounded-tr-sm"
            : "bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm"
        } px-4 py-2 shadow-sm`}
      >
        {/* Text content */}
        {message.content && (
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}

        {/* Image attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div
            className={`grid gap-2 ${
              message.attachments.length === 1
                ? "grid-cols-1"
                : "grid-cols-2"
            } ${message.content ? "mt-2" : ""}`}
          >
            {message.attachments.map((attachment, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleImageClick(attachment.url)}
              >
                <Image
                  src={attachment.url}
                  alt={`Attachment ${index + 1}`}
                  width={attachment.width || 200}
                  height={attachment.height || 200}
                  className="w-full h-auto object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {/* Timestamp and status */}
        <div
          className={`flex items-center gap-1 mt-1 text-xs ${
            isOwnMessage ? "text-blue-100" : "text-gray-500"
          }`}
        >
          <span>{formattedTime}</span>
          {isOwnMessage && (
            <span>
              {message.status === "read" && "✓✓"}
              {message.status === "delivered" && "✓"}
              {message.status === "sent" && "•"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
