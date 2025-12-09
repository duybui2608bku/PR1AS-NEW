import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";
import {
  checkRateLimit,
  getClientIP,
  resetRateLimit,
  RATE_LIMIT_CONFIGS,
} from "@/lib/auth/rate-limit";
import { validatePassword } from "@/lib/auth/password-validation";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { password, token } = await request.json();

  // Validate input
  if (!password || !token) {
    throw new ApiError(
      "Password and token are required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    throw new ApiError(
      passwordValidation.errors.join(", "),
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  // Rate limiting: Check by IP
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(
    `reset-password:ip:${clientIP}`,
    RATE_LIMIT_CONFIGS.RESET_PASSWORD
  );

  if (!rateLimitResult.allowed) {
    if (rateLimitResult.lockedUntil) {
      throw new ApiError(
        getErrorMessage(ERROR_MESSAGES.ACCOUNT_LOCKED) +
          (rateLimitResult.retryAfter
            ? ` Please try again in ${Math.ceil(rateLimitResult.retryAfter / 60)} minutes.`
            : ""),
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.ACCOUNT_LOCKED
      );
    }
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED) +
        (rateLimitResult.retryAfter
          ? ` Please try again in ${Math.ceil(rateLimitResult.retryAfter / 60)} minutes.`
          : ""),
      HttpStatus.TOO_MANY_REQUESTS,
      ErrorCode.RATE_LIMIT_EXCEEDED
    );
  }

  const supabase = createAdminClient();

  // The token from Supabase recovery email is an access_token
  // We need to verify it and get the user, then update password
  try {
    // Get user from access token
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      throw new ApiError(
        "Invalid or expired reset token. Please request a new password reset link.",
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_TOKEN
      );
    }

    // Update password for the user using admin client
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userData.user.id,
      {
        password: password,
      }
    );

    if (updateError) {
      throw new ApiError(
        "Failed to reset password",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.OPERATION_FAILED
      );
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // If getUser fails, try alternative method with verifyOtp
    // This handles cases where token might be an OTP token
    const { data: verifyData, error: verifyError } =
      await supabase.auth.verifyOtp({
        token_hash: token,
        type: "recovery",
      });

    if (verifyError || !verifyData.user) {
      throw new ApiError(
        "Invalid or expired reset token. Please request a new password reset link.",
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_TOKEN
      );
    }

    // Update password for the user
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      verifyData.user.id,
      {
        password: password,
      }
    );

    if (updateError) {
      throw new ApiError(
        "Failed to reset password",
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCode.OPERATION_FAILED
      );
    }
  }

  // Reset rate limit on successful password reset
  resetRateLimit(`reset-password:ip:${clientIP}`);

  return successResponse({
    message: "Password has been reset successfully. You can now login with your new password.",
  });
});

