/**
 * Chat Conversations API
 * POST /api/chat/conversations - Create or get conversation
 * GET /api/chat/conversations - List user conversations
 */

import { NextRequest } from "next/server";
import { ConversationService } from "@/lib/chat/conversation.service";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus, UserRole } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user, profile, supabase } = await requireAuth(request);

  const body = await request.json();
  const { workerId, bookingId } = body || {};

  if (!workerId) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  let clientId: string;
  let resolvedWorkerId: string;
  let targetUserId: string; // The user ID we need to validate

  if (profile.role === UserRole.CLIENT) {
    clientId = user.id;
    resolvedWorkerId = workerId;
    targetUserId = workerId; // Validate that workerId exists and is a worker
  } else if (profile.role === UserRole.WORKER) {
    clientId = workerId;
    resolvedWorkerId = user.id;
    targetUserId = workerId; // Validate that workerId exists (could be client or worker)
  } else {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.ROLE_REQUIRED),
      HttpStatus.FORBIDDEN,
      ErrorCode.ROLE_REQUIRED
    );
  }

  // First, try to find user in user_profiles (workerId might be user_id)
  let targetProfile: { id: string; role: string; status: string } | null = null;
  const { data: initialProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, role, status")
    .eq("id", targetUserId)
    .maybeSingle<{ id: string; role: string; status: string }>();

  targetProfile = initialProfile;

  // If not found, check if workerId is a worker_profiles.id and get user_id from there
  if (!targetProfile && !profileError) {
    const { data: workerProfile, error: workerError } = await supabase
      .from("worker_profiles")
      .select("user_id, profile_status")
      .eq("id", targetUserId)
      .maybeSingle();

    if (workerError) {
      throw new ApiError(
        "Failed to validate user",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.INTERNAL_ERROR
      );
    }

    if (workerProfile) {
      // Found worker profile, now get user profile using user_id
      targetUserId = workerProfile.user_id;

      // Update resolvedWorkerId if we're a CLIENT (since we found the actual user_id)
      if (profile.role === UserRole.CLIENT) {
        resolvedWorkerId = workerProfile.user_id;
      } else if (profile.role === UserRole.WORKER) {
        clientId = workerProfile.user_id;
      }

      // Get user profile
      const { data: userProfile, error: userProfileError } = await supabase
        .from("user_profiles")
        .select("id, role, status")
        .eq("id", workerProfile.user_id)
        .maybeSingle<{ id: string; role: string; status: string }>();

      if (userProfileError) {
        throw new ApiError(
          "Failed to validate user",
          HttpStatus.INTERNAL_SERVER_ERROR,
          ErrorCode.INTERNAL_ERROR
        );
      }

      targetProfile = userProfile;
    }
  } else if (profileError) {
    throw new ApiError(
      "Failed to validate user",
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR
    );
  }

  if (!targetProfile) {
    throw new ApiError(
      "User not found",
      HttpStatus.NOT_FOUND,
      ErrorCode.USER_NOT_FOUND
    );
  }

  if (targetProfile.status === "banned") {
    throw new ApiError(
      "Cannot create conversation with banned user",
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN
    );
  }

  // If current user is CLIENT, ensure target is WORKER
  if (
    profile.role === UserRole.CLIENT &&
    targetProfile.role !== UserRole.WORKER
  ) {
    throw new ApiError(
      "Can only create conversation with a worker",
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_ROLE
    );
  }

  // If current user is WORKER, target can be CLIENT or WORKER (for worker-to-worker chat)
  // No additional validation needed

  const conversationService = new ConversationService(supabase);
  const conversation = await conversationService.findOrCreateConversation(
    clientId,
    resolvedWorkerId,
    bookingId ?? null
  );

  return successResponse({ conversation });
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user, profile, supabase } = await requireAuth(request);
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const role =
    profile.role === UserRole.CLIENT
      ? "client"
      : profile.role === UserRole.WORKER
      ? "worker"
      : null;

  if (!role) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.ROLE_REQUIRED),
      HttpStatus.FORBIDDEN,
      ErrorCode.ROLE_REQUIRED
    );
  }

  const conversationService = new ConversationService(supabase);
  const result = await conversationService.getConversationsByUserId({
    userId: user.id,
    role,
    page,
    limit,
  });

  // Parse attachments in last_message if present
  const parsedConversations = result.conversations.map((conv) => {
    if (conv.last_message?.attachments) {
      // If attachments is a string, parse it
      if (typeof conv.last_message.attachments === "string") {
        try {
          conv.last_message.attachments = JSON.parse(
            conv.last_message.attachments
          );
        } catch {
          conv.last_message.attachments = null;
        }
      }
      // Ensure attachments is an array
      if (!Array.isArray(conv.last_message.attachments)) {
        conv.last_message.attachments = null;
      }
    }
    return conv;
  });

  return successResponse({
    conversations: parsedConversations,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: Math.ceil(result.total / result.limit),
    },
  });
});
