/**
 * Chat Image Upload API
 * POST /api/chat/uploads/image - Upload chat image and return attachment metadata
 */

import { NextRequest } from "next/server";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";
import { getTokenFromRequest } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { successResponse } from "@/lib/http/response";
import { ChatImageUploadService } from "@/lib/chat/image-upload.service";
import { requireAuth } from "@/lib/auth/middleware";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user (ensures not banned, etc.)
  await requireAuth(request);

  const { searchParams } = new URL(request.url);
  const conversationId =
    searchParams.get("conversationId") || undefined;

  if (!conversationId) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.NO_FILE_PROVIDED),
      HttpStatus.BAD_REQUEST,
      ErrorCode.NO_FILE_PROVIDED
    );
  }

  const token = getTokenFromRequest(request);
  if (!token) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.UNAUTHORIZED),
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED
    );
  }

  const supabase = createClient(token);
  const uploadService = new ChatImageUploadService(supabase);
  const attachment = await uploadService.uploadChatImage(
    file,
    conversationId
  );

  return successResponse({ attachment });
});


