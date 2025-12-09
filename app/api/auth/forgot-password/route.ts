import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";
import {
  checkRateLimit,
  getClientIP,
  RATE_LIMIT_CONFIGS,
} from "@/lib/auth/rate-limit";
import { sanitizeEmail } from "@/lib/auth/input-validation";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { email } = await request.json();

  // Validate input
  if (!email) {
    throw new ApiError(
      "Email is required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Sanitize and validate email
  const sanitizedEmail = sanitizeEmail(email);
  if (!sanitizedEmail) {
    throw new ApiError(
      "Invalid email format",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  // Rate limiting: Check by IP and email
  const clientIP = getClientIP(request);
  const ipRateLimit = checkRateLimit(
    `forgot-password:ip:${clientIP}`,
    RATE_LIMIT_CONFIGS.FORGOT_PASSWORD
  );
  const emailRateLimit = checkRateLimit(
    `forgot-password:email:${sanitizedEmail}`,
    RATE_LIMIT_CONFIGS.FORGOT_PASSWORD
  );

  // Use the stricter limit
  const rateLimitResult =
    ipRateLimit.lockedUntil && emailRateLimit.lockedUntil
      ? ipRateLimit.lockedUntil < emailRateLimit.lockedUntil
        ? ipRateLimit
        : emailRateLimit
      : ipRateLimit.lockedUntil
      ? ipRateLimit
      : emailRateLimit.lockedUntil
      ? emailRateLimit
      : ipRateLimit.count > emailRateLimit.count
      ? ipRateLimit
      : emailRateLimit;

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

  // Check if user exists
  const { data: userData, error: userError } =
    await supabase.auth.admin.getUserByEmail(sanitizedEmail);

  // Always return success message (security best practice - don't reveal if email exists)
  // But still check rate limit to prevent abuse
  if (userError || !userData?.user) {
    // User doesn't exist, but we return success anyway
    return successResponse({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  }

  // Check if account is banned
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("status")
    .eq("id", userData.user.id)
    .single();

  if (profile?.status === "banned") {
    // Still return success to avoid revealing banned status
    return successResponse({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  }

  // Get app URL for redirect
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUrl = `${appUrl}/auth/reset-password`;

  // Send password reset email using Supabase
  const { error: resetError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: sanitizedEmail,
    options: {
      redirectTo: redirectUrl,
    },
  });

  // Always return success (security best practice)
  // Even if there's an error, we don't want to reveal information
  if (resetError) {
    // Log error for debugging but don't expose to user
    console.error("Password reset email error:", resetError);
  }

  return successResponse({
    message: "If an account with that email exists, a password reset link has been sent.",
  });
});

