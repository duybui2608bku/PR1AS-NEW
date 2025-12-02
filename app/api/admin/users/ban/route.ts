import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

// POST /api/admin/users/ban
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase } = await requireAdmin(request);

  const { userId, duration } = await request.json();

  if (!userId) {
    throw new ApiError(
      "User ID is required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Calculate ban duration (default 1 year if not specified)
  const banDuration = duration || "8760h"; // 1 year in hours

  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: banDuration,
  });

  if (error) {
    throw error;
  }

  // Log admin action (non-blocking)
  await supabase.from("admin_logs").insert({
    action: "ban_user",
    target_user_id: userId,
    details: { duration: banDuration },
  }).catch(() => {
    // Ignore logging errors
  });

  return successResponse(
    { user: data.user },
    "User banned successfully"
  );
});
