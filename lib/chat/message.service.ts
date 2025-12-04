/**
 * Message Service
 * Business logic for creating and fetching chat messages
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  Attachment,
  CreateMessageInput,
  GetMessagesParams,
  GetMessagesResult,
  Message,
  MessageContentType,
} from "./types";

export class MessageService {
  constructor(private supabase: SupabaseClient<any>) {}

  /**
   * Create a new message in a conversation.
   * At least one of content or attachments must be provided.
   */
  async createMessage(input: CreateMessageInput): Promise<Message> {
    const content = input.content?.trim() || null;
    const attachments =
      input.attachments && input.attachments.length > 0
        ? input.attachments
        : null;

    if (!content && !attachments) {
      throw new Error("Message must have content or attachments");
    }

    const contentType: MessageContentType =
      content && attachments
        ? "mixed"
        : content
        ? "text"
        : "image";

    const { data, error } = await this.supabase
      .from("messages")
      .insert({
        conversation_id: input.conversationId,
        sender_id: input.senderId,
        content,
        content_type: contentType,
        attachments: attachments as Attachment[] | null,
      })
      .select("*")
      .single<Message>();

    if (error || !data) {
      throw new Error(
        `Failed to create message: ${error?.message || "Database error"}`
      );
    }

    return data;
  }

  /**
   * Get messages in a conversation with cursor-based pagination (by created_at).
   * Sorted DESC by created_at so newest messages come first.
   */
  async getMessages(params: GetMessagesParams): Promise<GetMessagesResult> {
    const limit = params.limit && params.limit > 0 ? params.limit : 30;

    let query = this.supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", params.conversationId)
      .order("created_at", { ascending: false });

    if (params.cursor) {
      // Fetch messages created before the cursor message
      const { data: cursorMsg, error: cursorError } = await this.supabase
        .from("messages")
        .select("created_at")
        .eq("id", params.cursor)
        .maybeSingle<{ created_at: string }>();

      if (cursorError) {
        throw new Error(
          `Failed to resolve cursor: ${cursorError.message || "Database error"}`
        );
      }

      if (cursorMsg) {
        query = query.lt("created_at", cursorMsg.created_at);
      }
    }

    const { data, error } = await query
      .limit(limit + 1)
      .returns<Message[]>();

    if (error) {
      throw new Error(
        `Failed to fetch messages: ${error.message || "Database error"}`
      );
    }

    const messages = data || [];
    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1].id : null;

    return {
      messages: items,
      hasMore,
      nextCursor,
    };
  }

  /**
   * Update message status (e.g., delivered/read)
   */
  async updateMessageStatus(
    messageId: string,
    status: "delivered" | "read"
  ): Promise<void> {
    const { error } = await this.supabase
      .from("messages")
      .update({ status })
      .eq("id", messageId);

    if (error) {
      throw new Error(
        `Failed to update message status: ${
          error.message || "Database error"
        }`
      );
    }
  }

  /**
   * Mark all messages from the other party in a conversation as read.
   */
  async markAsRead(
    conversationId: string,
    userId: string
  ): Promise<{ updated: number }> {
    const { data, error } = await this.supabase
      .from("messages")
      .update({ status: "read" })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("status", "delivered")
      .select("id");

    if (error) {
      throw new Error(
        `Failed to mark messages as read: ${
          error.message || "Database error"
        }`
      );
    }

    return { updated: data ? data.length : 0 };
  }
}


