import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

// DELETE /api/admin/users/delete
export const DELETE = withErrorHandling(async (request: NextRequest) => {
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

  // Delete user from auth (this will cascade to related tables)
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    throw error;
  }

  // Log admin action (non-blocking)
  await supabase
    .from("admin_logs")
    .insert({
      action: "delete_user",
      target_user_id: userId,
      details: {},
    })
    .match(() => {
      // Ignore logging errors
    });

  return successResponse(null, "User deleted successfully");
});
