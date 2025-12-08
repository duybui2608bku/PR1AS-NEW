/**
 * Get Conversation Detail API (optional)
 * GET /api/chat/conversations/[conversationId]
 */

import { NextRequest } from "next/server";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { ConversationService } from "@/lib/chat/conversation.service";

export const GET = withErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
  ) => {
    const { user, supabase } = await requireAuth(request);
    const { conversationId } = await params;

    if (!conversationId) {
      throw new ApiError(
        getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
        HttpStatus.BAD_REQUEST,
        ErrorCode.MISSING_REQUIRED_FIELDS
      );
    }

    const conversationService = new ConversationService(supabase);
    const conversation = await conversationService.getConversationById(
      conversationId,
      user.id
    );

    return successResponse({ conversation });
  }
);
