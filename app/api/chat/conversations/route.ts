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

  if (profile.role === UserRole.CLIENT) {
    clientId = user.id;
    resolvedWorkerId = workerId;
  } else if (profile.role === UserRole.WORKER) {
    clientId = workerId;
    resolvedWorkerId = user.id;
  } else {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.ROLE_REQUIRED),
      HttpStatus.FORBIDDEN,
      ErrorCode.ROLE_REQUIRED
    );
  }

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

  return successResponse({
    conversations: result.conversations,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: Math.ceil(result.total / result.limit),
    },
  });
});

import { NextRequest } from "next/server";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { ChatService } from "@/lib/chat/service";
import { HttpStatus, UserRole } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user, profile, supabase } = await requireAuth(request);

  const body = await request.json();
  const { workerId, bookingId } = body as {
    workerId?: string;
    bookingId?: string;
  };

  if (!workerId) {
    throw new ApiError(
      "workerId is required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  if (profile.role !== UserRole.CLIENT) {
    throw new ApiError(
      "Only clients can create chat conversations at this time",
      HttpStatus.FORBIDDEN,
      ErrorCode.ONLY_CLIENTS_CAN_CREATE
    );
  }

  // If bookingId is provided, ensure this client really owns the booking
  if (bookingId) {
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, client_id, worker_id")
      .eq("id", bookingId)
      .maybeSingle();

    if (error || !booking) {
      throw new ApiError(
        "Booking not found",
        HttpStatus.NOT_FOUND,
        ErrorCode.BOOKING_NOT_FOUND
      );
    }

    if (booking.client_id !== user.id || booking.worker_id !== workerId) {
      throw new ApiError(
        "You are not allowed to create chat for this booking",
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN
      );
    }
  }

  const chatService = new ChatService(supabase);
  const conversation = await chatService.getOrCreateConversation({
    clientId: user.id,
    workerId,
    bookingId,
  });

  return successResponse({ conversation });
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user, profile, supabase } = await requireAuth(request);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  if (page <= 0 || limit <= 0) {
    throw new ApiError(
      "page and limit must be positive integers",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  if (profile.role !== UserRole.CLIENT && profile.role !== UserRole.WORKER) {
    throw new ApiError(
      "Only clients and workers can list conversations",
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN
    );
  }

  const chatService = new ChatService(supabase);
  const conversations = await chatService.listConversationsForUser({
    userId: user.id,
    role: profile.role === UserRole.CLIENT ? "client" : "worker",
    page,
    limit,
  });

  return successResponse({
    conversations,
    page,
    limit,
    total: conversations.length,
  });
});



