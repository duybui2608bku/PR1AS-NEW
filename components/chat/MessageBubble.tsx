"use client";

import { useMemo, useState } from "react";
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
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Parse attachments if needed (handle both array and string cases)
  const parsedAttachments = useMemo(() => {
    if (!message.attachments) return null;

    // If attachments is a string, try to parse it
    if (typeof message.attachments === "string") {
      try {
        const parsed = JSON.parse(message.attachments);
        return Array.isArray(parsed) ? parsed : null;
      } catch (e) {
        console.error("Failed to parse attachments:", e);
        return null;
      }
    }

    // If it's already an array, return it
    if (Array.isArray(message.attachments)) {
      return message.attachments;
    }

    return null;
  }, [message.attachments]);

  const imageUrls = useMemo(() => {
    return parsedAttachments?.map((att) => att.url) || [];
  }, [parsedAttachments]);

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
            ? "bg-[#ff385c] text-white rounded-2xl rounded-tr-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-tl-sm"
        } px-4 py-2 shadow-sm`}
      >
        {/* Text content */}
        {message.content && (
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}

        {/* Image attachments */}
        {parsedAttachments && parsedAttachments.length > 0 && (
          <div
            className={`grid gap-2 ${
              parsedAttachments.length === 1 ? "grid-cols-1" : "grid-cols-2"
            } ${message.content ? "mt-2" : ""}`}
          >
            {parsedAttachments.map((attachment, index) => {
              const hasError = imageErrors.has(index);

              return (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity group"
                  onClick={() => !hasError && handleImageClick(attachment.url)}
                >
                  {hasError ? (
                    <div className="w-full h-32 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-400 text-sm">
                        Không thể tải ảnh
                      </span>
                    </div>
                  ) : (
                    <img
                      src={attachment.url}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-auto max-h-64 object-cover rounded-lg"
                      loading="lazy"
                      onError={() => {
                        console.error("Failed to load image:", attachment.url);
                        setImageErrors((prev) => new Set(prev).add(index));
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Timestamp and status */}
        <div
          className={`flex items-center gap-1 mt-1 text-xs ${
            isOwnMessage ? "text-white/80" : "text-gray-500 dark:text-gray-400"
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
