"use client";

import { useState } from "react";
import { chatAPI } from "@/lib/chat/api";
import type { Attachment, Message } from "@/lib/chat/types";

interface UseSendMessageResult {
  sendMessage: (
    params: Omit<
      Parameters<typeof chatAPI.sendMessage>[0],
      "conversationId"
    > & { conversationId: string }
  ) => Promise<Message | null>;
  uploading: boolean;
  sending: boolean;
  error: Error | null;
  uploadImage: (file: File, conversationId: string) => Promise<Attachment>;
}

export function useSendMessage(): UseSendMessageResult {
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage: UseSendMessageResult["sendMessage"] = async (params) => {
    try {
      setSending(true);
      const result = await chatAPI.sendMessage({
        conversationId: params.conversationId,
        content: params.content,
        attachments: params.attachments,
      });
      setError(null);
      return result.message;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Unknown error");
      setError(e);
      return null;
    } finally {
      setSending(false);
    }
  };

  const uploadImage = async (
    file: File,
    conversationId: string
  ): Promise<Attachment> => {
    try {
      setUploading(true);
      const result = await chatAPI.uploadChatImage(file, conversationId);
      setError(null);
      return result.attachment;
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Unknown error");
      setError(e);
      throw e;
    } finally {
      setUploading(false);
    }
  };

  return {
    sendMessage,
    uploading,
    sending,
    error,
    uploadImage,
  };
}


