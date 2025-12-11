import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { HttpStatus } from "@/lib/utils/enums";

// POST /api/admin/users/reject-worker
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { user: adminUser, supabase } = await requireAdmin(request);

  const { userId, reason } = await request.json();

  if (!userId) {
    throw new ApiError(
      "User ID is required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Validate worker profile exists
  const { data: workerProfile, error: workerProfileError } = await supabase
    .from("worker_profiles")
    .select("id, profile_status, user_id")
    .eq("user_id", userId)
    .single();

  if (workerProfileError || !workerProfile) {
    throw new ApiError(
      "Worker profile not found",
      HttpStatus.NOT_FOUND,
      ErrorCode.NOT_FOUND
    );
  }

  // Check if worker is already rejected
  if (workerProfile.profile_status === "rejected") {
    throw new ApiError(
      "Worker profile is already rejected",
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_REQUEST
    );
  }

  // Update worker profile status to rejected
  const { error: updateError } = await supabase
    .from("worker_profiles")
    .update({
      profile_status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id,
      rejection_reason: reason || null,
    })
    .eq("user_id", userId);

  if (updateError) {
    throw new ApiError(
      "Failed to reject worker profile",
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR
    );
  }

  // Log admin action (non-blocking)
  try {
    await supabase.from("admin_logs").insert({
      action: "reject_worker",
      target_user_id: userId,
      admin_user_id: adminUser.id,
      details: {
        reason: reason || null,
        previous_status: workerProfile.profile_status,
      },
    });
  } catch (logError) {
    console.error("Failed to log admin action:", logError);
  }

  // TODO: Send notification email to worker about rejection
  // This can be implemented later with an email service

  return successResponse(
    { workerProfileId: workerProfile.id },
    reason
      ? `Worker application rejected: ${reason}`
      : "Worker application rejected successfully"
  );
});

