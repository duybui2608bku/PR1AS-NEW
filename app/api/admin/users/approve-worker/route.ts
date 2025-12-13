import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { HttpStatus, UserRole } from "@/lib/utils/enums";

// POST /api/admin/users/approve-worker
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { user: adminUser, supabase } = await requireAdmin(request);

  const { userId } = await request.json();

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
      "Worker profile not found. User must have a worker profile to be approved.",
      HttpStatus.NOT_FOUND,
      ErrorCode.NOT_FOUND
    );
  }

  // Check if worker is already approved/published
  if (
    workerProfile.profile_status === "published" ||
    workerProfile.profile_status === "approved"
  ) {
    throw new ApiError(
      "Worker profile is already approved",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
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
  let profileUpdateError: Error | null = null;
  try {
    const { error } = await supabase.from("user_profiles").upsert({
      id: userId,
      role: UserRole.WORKER,
      status: "approved",
      approved_at: new Date().toISOString(),
    });
    if (error) {
      profileUpdateError = error;
    }
  } catch (error) {
    profileUpdateError = error as Error;
  }

  // Update worker profile status to published (approved and live)
  const { error: workerError } = await supabase
    .from("worker_profiles")
    .update({
      profile_status: "published",
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUser.id,
    })
    .eq("user_id", userId);

  if (workerError) {
    throw workerError;
  }

  const workerProfileId = workerProfile.id;
  const errors: string[] = [];

  // Approve all worker images (non-blocking but log errors)
  try {
    const { error: imagesError } = await supabase
      .from("worker_images")
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
      })
      .eq("worker_profile_id", workerProfileId);

    if (imagesError) {
      errors.push(`Failed to approve images: ${imagesError.message}`);
      console.error("Failed to approve worker images:", imagesError);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    errors.push(`Failed to approve images: ${errorMessage}`);
    console.error("Failed to approve worker images:", error);
  }

  // Activate all worker services (non-blocking but log errors)
  try {
    const { error: servicesError } = await supabase
      .from("worker_services")
      .update({
        is_active: true,
      })
      .eq("worker_profile_id", workerProfileId);

    if (servicesError) {
      errors.push(`Failed to activate services: ${servicesError.message}`);
      console.error("Failed to activate worker services:", servicesError);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    errors.push(`Failed to activate services: ${errorMessage}`);
    console.error("Failed to activate worker services:", error);
  }

  // Log admin action (non-blocking)
  try {
    await supabase.from("admin_logs").insert({
      action: "approve_worker",
      target_user_id: userId,
      admin_user_id: adminUser.id,
      details: {
        profile_update_error: profileUpdateError?.message || null,
        partial_errors: errors.length > 0 ? errors : null,
      },
    });
  } catch (logError) {
    console.error("Failed to log admin action:", logError);
  }

  // Return success with warnings if there were partial errors
  const message =
    errors.length > 0
      ? `Worker approved successfully, but some operations failed: ${errors.join(
          ", "
        )}`
      : "Worker approved successfully";

  return successResponse(
    {
      user: authData.user,
      warnings: errors.length > 0 ? errors : undefined,
    },
    message
  );
});
