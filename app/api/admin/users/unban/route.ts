import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

// POST /api/admin/users/unban
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase } = await requireAdmin(request);

  const { userId } = await request.json();

  if (!userId) {
    throw new ApiError(
      "User ID is required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });

  if (error) {
    throw error;
  }

  // Log admin action (non-blocking)
  await supabase.from("admin_logs").insert({
    action: "unban_user",
    target_user_id: userId,
    details: {},
  }).catch(() => {
    // Ignore logging errors
  });

  return successResponse(
    { user: data.user },
    "User unbanned successfully"
  );
});
