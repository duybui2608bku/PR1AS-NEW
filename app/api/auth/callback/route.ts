import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/utils/enums";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { userId, email, role } = await request.json();

  if (!userId || !email) {
    throw new ApiError(
      "UserId and email are required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

    const supabase = createAdminClient();

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

  // If profile exists, return it
  if (existingProfile) {
    // Check if banned
    if (existingProfile.status === "banned") {
      throw new ApiError(
        getErrorMessage(ERROR_MESSAGES.ACCOUNT_BANNED),
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCOUNT_BANNED
      );
    }

    return successResponse({
      created: false,
      user: {
        id: existingProfile.id,
        email: existingProfile.email,
        role: existingProfile.role,
        status: existingProfile.status,
      },
    });
  }

  // No profile exists, need to create one
  if (!role) {
    // Need role to create profile
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.NO_PROFILE_NO_ROLE),
      HttpStatus.NOT_FOUND,
      ErrorCode.NO_PROFILE_NO_ROLE
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

  // Check if email is already used with different account
  const { data: emailProfile } = await supabase
    .from("user_profiles")
    .select("role, status")
    .eq("email", email)
    .single();

  if (emailProfile) {
    if (emailProfile.status === "banned") {
      throw new ApiError(
        getErrorMessage(ERROR_MESSAGES.ACCOUNT_BANNED),
        HttpStatus.FORBIDDEN,
        ErrorCode.ACCOUNT_BANNED
      );
    }

    if (emailProfile.role !== role) {
      throw new ApiError(
        getErrorMessage(ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE),
        HttpStatus.BAD_REQUEST,
        ErrorCode.EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE
      );
    }
  }

  // Create new profile
  const { error: insertError } = await supabase
    .from("user_profiles")
    .insert({
      id: userId,
      email,
      role,
      status: "active",
    });

  if (insertError) {
    throw insertError;
  }

  return successResponse({
    created: true,
    user: {
      id: userId,
      email,
      role,
      status: "active",
    },
  });
});

