import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/utils/enums";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { email, password, role, fullName } = await request.json();

  // Validate input
  if (!email || !password || !role) {
    throw new ApiError(
      "Email, password, and role are required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Validate role
  if (![UserRole.CLIENT, UserRole.WORKER].includes(role as UserRole)) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.INVALID_ROLE),
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_ROLE
    );
  }

    const supabase = createAdminClient();

    // Check if email already exists with a different role
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("role, status")
      .eq("email", email)
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
    if (existingProfile.role !== role) {
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

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
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
      full_name: fullName || null,
      role,
      status: "active",
    });

  if (profileError) {
    // Cleanup: delete auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw profileError;
  }

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

