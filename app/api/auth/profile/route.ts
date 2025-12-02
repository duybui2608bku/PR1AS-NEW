import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user, profile, supabase } = await requireAuth(request);

  // Get full profile data
  const { data: fullProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !fullProfile) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.PROFILE_NOT_FOUND),
      HttpStatus.NOT_FOUND,
      ErrorCode.PROFILE_NOT_FOUND
    );
  }

  return successResponse({
    profile: {
      id: fullProfile.id,
      email: fullProfile.email,
      full_name: fullProfile.full_name,
      avatar_url: fullProfile.avatar_url,
      role: fullProfile.role,
      status: fullProfile.status,
      created_at: fullProfile.created_at,
      updated_at: fullProfile.updated_at,
    },
  });
});

