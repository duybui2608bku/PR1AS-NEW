"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Upload } from "antd";
import {
  SendOutlined,
  PictureOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import { EmojiPicker } from "./EmojiPicker";
import { useSendMessage } from "@/hooks/chat/useSendMessage";
import { showMessage } from "@/lib/utils/toast";
import type { Attachment } from "@/lib/chat/types";

interface ChatInputProps {
  conversationId: string;
  onMessageSent?: (message: import("@/lib/chat/types").Message | null) => void;
}

export function ChatInput({ conversationId, onMessageSent }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [previewFiles, setPreviewFiles] = useState<
    Array<{ file: File; preview: string }>
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { sendMessage, uploadImage, sending, uploading } = useSendMessage();

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      content.substring(0, start) + emoji + content.substring(end);

    setContent(newContent);

    // Set cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  // Handle image selection
  const handleImageSelect = async (file: File) => {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage.error("Kích thước ảnh không được vượt quá 5MB");
      return false;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showMessage.error("Chỉ được phép upload ảnh");
      return false;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    setPreviewFiles((prev) => [...prev, { file, preview }]);

    return false; // Prevent auto upload
  };

  // Remove image from preview
  const handleRemoveImage = (index: number) => {
    setPreviewFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Send message
  const handleSend = async () => {
    if (!content.trim() && previewFiles.length === 0) return;
    if (sending || uploading) return;

    try {
      // Upload images first
      let uploadedAttachments: Attachment[] = [];
      if (previewFiles.length > 0) {
        uploadedAttachments = await Promise.all(
          previewFiles.map((pf) => uploadImage(pf.file, conversationId))
        );
      }

      // Send message
      const sentMessage = await sendMessage({
        conversationId,
        content: content.trim() || undefined,
        attachments:
          uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      // Clear input
      setContent("");
      previewFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
      setPreviewFiles([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Callback with message
      onMessageSent?.(sentMessage);
    } catch {
      showMessage.error("Gửi tin nhắn thất bại");
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const canSend = (content.trim() || previewFiles.length > 0) && !sending;

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black backdrop-blur-sm shadow-lg p-4">
      {/* Image previews */}
      {previewFiles.length > 0 && (
        <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {previewFiles.map((pf, index) => (
            <div key={index} className="relative shrink-0 group">
              <div className="relative overflow-hidden rounded-xl shadow-md ring-2 ring-gray-200 dark:ring-gray-800 group-hover:ring-[#ff385c]/50 transition-all">
                <Image
                  src={pf.preview}
                  alt={`Preview ${index + 1}`}
                  width={90}
                  height={90}
                  className="object-cover"
                />
              </div>
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-[#ff385c] text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-[#e61e4d] transition-all shadow-lg hover:scale-110 z-10"
                aria-label="Xóa ảnh"
              >
                <CloseOutlined className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-3">
        {/* Emoji picker - hidden on mobile */}
        <div className="hidden lg:flex shrink-0">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
        </div>

        {/* Image upload - hidden on mobile */}
        <div className="hidden lg:block shrink-0">
          <Upload
            accept="image/*"
            multiple
            showUploadList={false}
            beforeUpload={handleImageSelect}
            disabled={uploading || sending}
          >
            <button
              type="button"
              className="w-12 h-12 flex items-center justify-center hover:bg-[#fff5f7] dark:hover:bg-gray-800 rounded-full transition-all duration-200 disabled:opacity-50 group shrink-0"
              disabled={uploading || sending}
              title="Chọn ảnh"
            >
              <PictureOutlined className="text-xl text-gray-600 dark:text-gray-400 group-hover:text-[#ff385c] transition-colors" />
            </button>
          </Upload>
        </div>

        {/* Text input with send button inside */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            className="w-full resize-none border-2 border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/20 transition-all bg-white dark:bg-black text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed no-scrollbar"
            rows={1}
            disabled={sending || uploading}
            style={{
              minHeight: "48px",
              maxHeight: "120px",
            }}
          />
          {/* Send button inside input - centered vertically */}
          {canSend && (
            <button
              onClick={() => void handleSend()}
              disabled={sending || uploading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#ff385c] hover:bg-[#e61e4d] text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
              title="Gửi"
            >
              {sending || uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <SendOutlined className="text-sm" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
