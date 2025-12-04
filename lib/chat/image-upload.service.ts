/**
 * Chat Image Upload Service
 * Handles validation and upload of chat images to Supabase Storage
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { IMAGE_MAX_SIZE, VALID_IMAGE_TYPES } from "@/lib/utils/enums";
import { Attachment } from "./types";

export class ChatImageUploadService {
  constructor(private supabase: SupabaseClient<any>) {}

  /**
   * Validate and upload a chat image file.
   * Returns an Attachment object with URL and basic metadata.
   */
  async uploadChatImage(
    file: File,
    conversationId: string
  ): Promise<Attachment> {
    if (!file) {
      throw new Error("No file provided");
    }

    if (file.size > IMAGE_MAX_SIZE) {
      throw new Error("File too large");
    }

    if (!VALID_IMAGE_TYPES.includes(file.type as any)) {
      throw new Error("Invalid file type");
    }

    const extension = file.name.split(".").pop() || "jpg";
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const randomName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    const path = `${conversationId}/${year}/${month}/${day}/${randomName}.${extension}`;

    const { data, error } = await this.supabase.storage
      .from("chat-images")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error || !data) {
      throw new Error(
        `Failed to upload image: ${error?.message || "Storage error"}`
      );
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from("chat-images").getPublicUrl(data.path);

    const attachment: Attachment = {
      url: publicUrl,
      type: "image",
      size: file.size,
      mime_type: file.type,
    };

    return attachment;
  }

  /**
   * Optional helper to delete a previously uploaded image by path/url.
   */
  async deleteChatImage(path: string): Promise<void> {
    if (!path) return;

    const { error } = await this.supabase.storage
      .from("chat-images")
      .remove([path]);

    if (error) {
      throw new Error(
        `Failed to delete image: ${error.message || "Storage error"}`
      );
    }
  }
}


