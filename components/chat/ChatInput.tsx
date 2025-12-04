"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button, Upload, message as antdMessage } from "antd";
import {
  SendOutlined,
  PictureOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import { EmojiPicker } from "./EmojiPicker";
import { useSendMessage } from "@/hooks/chat/useSendMessage";
import type { Attachment } from "@/lib/chat/types";

interface ChatInputProps {
  conversationId: string;
  onMessageSent?: () => void;
}

export function ChatInput({ conversationId, onMessageSent }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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
      void antdMessage.error("Kích thước ảnh không được vượt quá 5MB");
      return false;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      void antdMessage.error("Chỉ được phép upload ảnh");
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
      await sendMessage({
        conversationId,
        content: content.trim() || undefined,
        attachments:
          uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      // Clear input
      setContent("");
      setAttachments([]);
      previewFiles.forEach((pf) => URL.revokeObjectURL(pf.preview));
      setPreviewFiles([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Callback
      onMessageSent?.();
    } catch (error) {
      console.error("Failed to send message:", error);
      void antdMessage.error("Gửi tin nhắn thất bại");
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
    <div className="border-t bg-white p-4">
      {/* Image previews */}
      {previewFiles.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
          {previewFiles.map((pf, index) => (
            <div key={index} className="relative flex-shrink-0">
              <Image
                src={pf.preview}
                alt={`Preview ${index + 1}`}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <CloseOutlined className="text-xs" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Emoji picker */}
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />

        {/* Image upload */}
        <Upload
          accept="image/*"
          multiple
          showUploadList={false}
          beforeUpload={handleImageSelect}
          disabled={uploading || sending}
        >
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            disabled={uploading || sending}
            title="Chọn ảnh"
          >
            <PictureOutlined className="text-xl text-gray-600" />
          </button>
        </Upload>

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          className="flex-1 resize-none border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          rows={1}
          disabled={sending || uploading}
          style={{ minHeight: "40px", maxHeight: "120px" }}
        />

        {/* Send button */}
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => void handleSend()}
          disabled={!canSend}
          loading={sending || uploading}
          className="h-10"
        >
          Gửi
        </Button>
      </div>

      {/* Helper text */}
      <div className="text-xs text-gray-500 mt-2">
        Nhấn Enter để gửi, Shift + Enter để xuống dòng
      </div>
    </div>
  );
}
