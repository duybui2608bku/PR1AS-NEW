import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/utils/enums";
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
import { validatePasswordForAPI } from "@/lib/auth/password-validation";
import {
  sanitizeEmail,
  sanitizeName,
  sanitizeRole,
} from "@/lib/auth/input-validation";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { email, password, role, fullName } = await request.json();

  // Validate and sanitize input
  if (!email || !password || !role) {
    throw new ApiError(
      "Email, password, and role are required",
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

  // Sanitize role
  const sanitizedRole = sanitizeRole(role, [UserRole.CLIENT, UserRole.WORKER]);
  if (!sanitizedRole) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.INVALID_ROLE),
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_ROLE
    );
  }

  // Sanitize fullName if provided
  let sanitizedFullName: string | null = null;
  if (fullName) {
    sanitizedFullName = sanitizeName(fullName);
    if (!sanitizedFullName) {
      throw new ApiError(
        "Invalid name format",
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }
  }

  // Validate password strength
  const passwordValidation = validatePasswordForAPI(password);
  if (!passwordValidation.valid) {
    // Log for debugging
    console.log("[Signup] Password validation failed:", {
      passwordLength: password.length,
      errors: passwordValidation.message,
    });
    
    throw new ApiError(
      passwordValidation.message || "Password does not meet security requirements",
      HttpStatus.BAD_REQUEST,
      ErrorCode.WEAK_PASSWORD
    );
  }

  // Rate limiting: Check by IP and email (use sanitized email)
  const clientIP = getClientIP(request);
  const ipRateLimit = checkRateLimit(
    `signup:ip:${clientIP}`,
    RATE_LIMIT_CONFIGS.SIGNUP_IP
  );
  const emailRateLimit = checkRateLimit(
    `signup:email:${sanitizedEmail}`,
    RATE_LIMIT_CONFIGS.SIGNUP_EMAIL
  );

  // Use the stricter limit
  const rateLimitResult = !ipRateLimit.allowed
    ? ipRateLimit
    : !emailRateLimit.allowed
    ? emailRateLimit
    : ipRateLimit;

  if (!rateLimitResult.allowed) {
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

  // Check if email already exists with a different role (use sanitized email)
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("role, status")
    .eq("email", sanitizedEmail)
    .single();

  if (existingProfile) {
    // Check if account is banned
    if (existingProfile.status === "banned") {
      throw new ApiError(
        getErrorMessage(ERROR_MESSAGES.ACCOUNT_BANNED),
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCOUNT_BANNED
      );
    }

    // Check if trying to register with different role
    if (existingProfile.role !== sanitizedRole) {
      throw new ApiError(
        getErrorMessage(ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE),
        HttpStatus.BAD_REQUEST,
        ErrorCode.EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE
      );
    }

    // Email already registered with same role
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED),
      HttpStatus.BAD_REQUEST,
      ErrorCode.EMAIL_ALREADY_REGISTERED
    );
  }

    // Create auth user (use sanitized values)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true, // Auto-confirm for demo
    });

  if (authError) {
    throw authError;
  }

  if (!authData.user) {
    throw new ApiError(
      "Failed to create user",
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.OPERATION_FAILED
    );
  }

  // Create user profile
  const { error: profileError } = await supabase
    .from("user_profiles")
    .insert({
      id: authData.user.id,
      email: authData.user.email,
      full_name: sanitizedFullName || null,
      role: sanitizedRole,
      status: "active",
    });

  if (profileError) {
    // Cleanup: delete auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw profileError;
  }

  // Reset rate limit on successful signup
  resetRateLimit(`signup:ip:${clientIP}`);
  resetRateLimit(`signup:email:${email.toLowerCase()}`);

  // Auto-login after signup by creating a session
  const { data: sessionData, error: sessionError } = 
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (sessionError || !sessionData.session) {
    // User created but auto-login failed - they can login manually
    return successResponse({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
      },
    }, "Account created. Please login.");
  }

  // Create response with cookies
  const response = successResponse({
    user: {
      id: authData.user.id,
      email: authData.user.email,
      role,
    },
    session: {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    },
  });

  // Set authentication cookies
  response.cookies.set("sb-access-token", sessionData.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  response.cookies.set("sb-refresh-token", sessionData.session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
});

