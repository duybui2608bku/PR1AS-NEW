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
import { sanitizeEmail } from "@/lib/auth/input-validation";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { email, password } = await request.json();

  // Validate input
  if (!email || !password) {
    throw new ApiError(
      "Email and password are required",
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

  // Rate limiting: Check by IP and email (use sanitized email)
  const clientIP = getClientIP(request);
  const ipRateLimit = checkRateLimit(
    `login:ip:${clientIP}`,
    RATE_LIMIT_CONFIGS.LOGIN
  );
  const emailRateLimit = checkRateLimit(
    `login:email:${sanitizedEmail}`,
    RATE_LIMIT_CONFIGS.LOGIN
  );

  // Use the stricter limit (whichever is locked first or more restrictive)
  const rateLimitResult =
    ipRateLimit.lockedUntil && emailRateLimit.lockedUntil
      ? ipRateLimit.lockedUntil < emailRateLimit.lockedUntil
        ? ipRateLimit
        : emailRateLimit
      : ipRateLimit.lockedUntil
      ? ipRateLimit
      : emailRateLimit.lockedUntil
      ? emailRateLimit
      : !ipRateLimit.allowed
      ? ipRateLimit
      : !emailRateLimit.allowed
      ? emailRateLimit
      : ipRateLimit.remaining < emailRateLimit.remaining
      ? ipRateLimit
      : emailRateLimit;

  if (!rateLimitResult.allowed) {
    if (rateLimitResult.lockedUntil) {
      throw new ApiError(
        getErrorMessage(ERROR_MESSAGES.ACCOUNT_LOCKED) +
          (rateLimitResult.retryAfter
            ? ` Please try again in ${Math.ceil(
                rateLimitResult.retryAfter / 60
              )} minutes.`
            : ""),
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.ACCOUNT_LOCKED
      );
    }
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED) +
        (rateLimitResult.retryAfter
          ? ` Please try again in ${Math.ceil(
              rateLimitResult.retryAfter / 60
            )} minutes.`
          : ""),
      HttpStatus.TOO_MANY_REQUESTS,
      ErrorCode.RATE_LIMIT_EXCEEDED
    );
  }

  const supabase = createAdminClient();

  // Authenticate with Supabase (use sanitized email)
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });

  if (authError) {
    // Increment rate limit on failed login
    // Rate limit is already incremented by checkRateLimit, but we need to track failures
    // The next call will increment again
    throw new ApiError(
      "Invalid email or password",
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED
    );
  }

  if (!authData.user) {
    throw new ApiError(
      "Authentication failed",
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED
    );
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("user_profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.NO_PROFILE),
      HttpStatus.NOT_FOUND,
      ErrorCode.NO_PROFILE
    );
  }

  if (profile.status === "banned") {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.ACCOUNT_BANNED),
      HttpStatus.FORBIDDEN,
      ErrorCode.ACCOUNT_BANNED
    );
  }

  // Reset rate limit on successful login (use sanitized email)
  resetRateLimit(`login:ip:${clientIP}`);
  resetRateLimit(`login:email:${sanitizedEmail}`);

  // Create response with cookies
  const response = successResponse({
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      status: profile.status,
    },
    session: {
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
    },
  });

  // Set authentication cookies
  if (authData.session) {
    response.cookies.set("sb-access-token", authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    response.cookies.set("sb-refresh-token", authData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  return response;
});
