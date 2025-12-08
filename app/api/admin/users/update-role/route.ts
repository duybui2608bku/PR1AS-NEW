import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { HttpStatus, UserRole } from "@/lib/utils/enums";

// POST /api/admin/users/update-role
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase } = await requireAdmin(request);

  const { userId, role } = await request.json();

  if (!userId || !role) {
    throw new ApiError(
      "User ID and role are required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  const validRoles = [UserRole.CLIENT, UserRole.WORKER, UserRole.ADMIN];
  if (!validRoles.includes(role as UserRole)) {
    throw new ApiError(
      "Invalid role",
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_ROLE
    );
  }

  // Update user role in auth metadata
  const { data: authData, error: authError } =
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    });

  if (authError) {
    throw authError;
  }

  // Update user profile if exists (non-blocking)
  await supabase
    .from("user_profiles")
    .upsert({
      id: userId,
      role: role,
      updated_at: new Date().toISOString(),
    })
    .match(() => {
      // Continue even if profile update fails
    });

  // Log admin action (non-blocking)
  await supabase
    .from("admin_logs")
    .insert({
      action: "update_user_role",
      target_user_id: userId,
      details: { new_role: role },
    })
    .match(() => {
      // Ignore logging errors
    });

  return successResponse(
    { user: authData.user },
    `User role updated to ${role} successfully`
  );
});
