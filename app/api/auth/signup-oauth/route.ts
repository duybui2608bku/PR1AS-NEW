import { NextRequest } from "next/server";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus, UserRole } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { role, provider = "google", redirectTo } = await request.json();

  // Validate role
  if (!role || ![UserRole.CLIENT, UserRole.WORKER].includes(role as UserRole)) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.INVALID_ROLE),
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_ROLE
    );
  }

  // Validate provider
  if (provider !== "google") {
    throw new ApiError(
      "Only 'google' provider is supported",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  // Generate callback URL with role parameter
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const defaultRedirect = `${baseUrl}/auth/callback`;
  const callbackUrl = redirectTo || defaultRedirect;
  
  // Add role as query parameter
  const urlWithRole = `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}role=${role}`;

  return successResponse({
    provider,
    role,
    callbackUrl: urlWithRole,
    message: "Use Supabase client to call signInWithOAuth on the frontend",
  });
});

