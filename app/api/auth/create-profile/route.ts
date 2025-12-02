import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/utils/enums";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const { user, supabase } = await requireAuth(request);

  const { role } = await request.json();

  if (!role || ![UserRole.CLIENT, UserRole.WORKER].includes(role as UserRole)) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.INVALID_ROLE),
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_ROLE
    );
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existingProfile) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.PROFILE_ALREADY_EXISTS),
      HttpStatus.BAD_REQUEST,
      ErrorCode.PROFILE_ALREADY_EXISTS
    );
  }

  // Check if email is already used with different role
  const { data: emailProfile } = await supabase
    .from("user_profiles")
    .select("role, status")
    .eq("email", user.email)
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

  // Create profile
  const { error: insertError } = await supabase
    .from("user_profiles")
    .insert({
      id: user.id,
      email: user.email,
      role,
      status: "active",
    });

  if (insertError) {
    throw insertError;
  }

  return successResponse({
    profile: {
      id: user.id,
      email: user.email,
      role,
      status: "active",
    },
  });
});

