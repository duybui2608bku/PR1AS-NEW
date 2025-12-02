import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { HttpStatus, UserRole } from "@/lib/utils/enums";

// POST /api/admin/users/approve-worker
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

  // Update user role to worker in auth metadata
  const { data: authData, error: authError } =
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: UserRole.WORKER },
    });

  if (authError) {
    throw authError;
  }

  // Update user profile if exists (non-blocking)
  try {
    await supabase.from("user_profiles").upsert({
      id: userId,
      role: UserRole.WORKER,
      status: "approved",
      approved_at: new Date().toISOString(),
    });
  } catch {
    // Continue even if profile update fails
  }

  // Update worker profile status
  const { error: workerError } = await supabase
    .from("worker_profiles")
    .update({
      profile_status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (workerError) {
    throw workerError;
  }

  // Get worker profile id
  const { data: workerProfile } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (workerProfile) {
    const workerProfileId = workerProfile.id;

    // Approve all worker images (non-blocking)
    try {
      await supabase
        .from("worker_images")
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
        })
        .eq("worker_profile_id", workerProfileId);
    } catch {
      // Continue even if images update fails
    }

    // Activate all worker services (non-blocking)
    try {
      await supabase
        .from("worker_services")
        .update({
          is_active: true,
        })
        .eq("worker_profile_id", workerProfileId);
    } catch {
      // Continue even if services update fails
    }
  }

  // Log admin action (non-blocking)
  try {
    await supabase.from("admin_logs").insert({
      action: "approve_worker",
      target_user_id: userId,
      details: {},
    });
  } catch {
    // Ignore logging errors
  }

  return successResponse(
    { user: authData.user },
    "Worker approved successfully"
  );
});
