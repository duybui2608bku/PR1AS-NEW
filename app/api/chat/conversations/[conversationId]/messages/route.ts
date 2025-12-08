/**
 * Chat Messages API
 * GET /api/chat/conversations/[conversationId]/messages - List messages
 * POST /api/chat/conversations/[conversationId]/messages - Send message
 */

import { NextRequest } from "next/server";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { HttpStatus } from "@/lib/utils/enums";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;
const MAX_ATTACHMENTS_PER_MESSAGE = 5;

async function ensureUserInConversation(
  supabase: any,
  conversationId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, client_id, worker_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw new ApiError(
      "Failed to load conversation",
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR
    );
  }

  if (!data) {
    throw new ApiError(
      "Conversation not found",
      HttpStatus.NOT_FOUND,
      ErrorCode.NOT_FOUND
    );
  }

  if (data.client_id !== userId && data.worker_id !== userId) {
    throw new ApiError(
      "You are not allowed to access this conversation",
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN
    );
  }

  return data;
}

export const GET = withErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
  ) => {
    const { user, supabase } = await requireAuth(request);
    const { conversationId } = await params;

    await ensureUserInConversation(supabase, conversationId, user.id);

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const before = searchParams.get("before");
    const rawLimit = parseInt(searchParams.get("limit") || "", 10);
    const limit =
      !isNaN(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    let query = supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("id", cursor);
    } else if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiError(
        "Failed to load messages",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR
      );
    }

    const rows = data || [];
    const hasMore = rows.length > limit;
    const messages = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && messages.length > 0 ? messages[messages.length - 1].id : null;

    // Parse attachments if they are strings (JSONB from database)
    const parsedMessages = messages.map((msg: any) => {
      if (msg.attachments) {
        // If attachments is a string, parse it
        if (typeof msg.attachments === "string") {
          try {
            msg.attachments = JSON.parse(msg.attachments);
          } catch (e) {
            msg.attachments = null;
          }
        }
        // Ensure attachments is an array
        if (!Array.isArray(msg.attachments)) {
          msg.attachments = null;
        }
      }
      return msg;
    });

    return successResponse({
      messages: parsedMessages,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    });
  }
);

export const POST = withErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
  ) => {
    const { user, supabase } = await requireAuth(request);
    const { conversationId } = await params;

    await ensureUserInConversation(supabase, conversationId, user.id);

    const body = await request.json();
    const { content, attachments } = body as {
      content?: string;
      attachments?: any[];
    };

    if (!content && (!attachments || attachments.length === 0)) {
      throw new ApiError(
        "Message content or attachments is required",
        HttpStatus.BAD_REQUEST,
        ErrorCode.MISSING_REQUIRED_FIELDS
      );
    }

    if (
      Array.isArray(attachments) &&
      attachments.length > MAX_ATTACHMENTS_PER_MESSAGE
    ) {
      throw new ApiError(
        `Too many attachments. Maximum is ${MAX_ATTACHMENTS_PER_MESSAGE}`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    let contentType: "text" | "image" | "mixed" = "text";
    const hasText = !!content && content.trim().length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (hasText && hasAttachments) {
      contentType = "mixed";
    } else if (hasAttachments) {
      contentType = "image";
    } else {
      contentType = "text";
    }

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: hasText ? content : null,
        content_type: contentType,
        attachments: hasAttachments ? attachments : null,
        status: "sent",
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new ApiError(
        "Failed to send message",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.OPERATION_FAILED
      );
    }

    return successResponse({ message: data });
  }
);
