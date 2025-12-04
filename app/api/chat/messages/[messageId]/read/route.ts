/**
 * Mark Message as Read API (optional helper)
 * PATCH /api/chat/messages/[messageId]/read
 */

import { NextRequest } from "next/server";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { MessageService } from "@/lib/chat/message.service";

interface RouteContext {
  params: {
    messageId: string;
  };
}

export const PATCH = withErrorHandling(
  async (request: NextRequest, context: RouteContext) => {
    const { user, supabase } = await requireAuth(request);
    const { messageId } = context.params;

    if (!messageId) {
      throw new ApiError(
        getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
        HttpStatus.BAD_REQUEST,
        ErrorCode.MISSING_REQUIRED_FIELDS
      );
    }

    // Ensure message belongs to a conversation where user is a participant
    const { data: message, error } = await supabase
      .from("messages")
      .select(
        `
        id,
        conversation_id,
        conversation:conversations!inner(client_id, worker_id)
      `
      )
      .eq("id", messageId)
      .maybeSingle();

    if (error) {
      throw new ApiError(
        "Failed to load message",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR
      );
    }

    if (
      !message ||
      (message.conversation.client_id !== user.id &&
        message.conversation.worker_id !== user.id)
    ) {
      throw new ApiError(
        getErrorMessage(ERROR_MESSAGES.FORBIDDEN),
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN
      );
    }

    const messageService = new MessageService(supabase);
    await messageService.updateMessageStatus(messageId, "read");

    return successResponse(null, "Message marked as read");
  }
);


