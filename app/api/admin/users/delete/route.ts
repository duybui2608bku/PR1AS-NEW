import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

// DELETE /api/admin/users/delete
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { user, supabase } = await requireAdmin(request);

  const { userId } = await request.json();

  if (!userId) {
    throw new ApiError(
      "User ID is required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Prevent admin from deleting themselves
  if (userId === user.id) {
    throw new ApiError(
      "You cannot delete yourself",
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN
    );
  }

  // Check if target user is an admin (prevent deleting admin accounts)
  const { data: targetProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new ApiError(
      "Failed to check user profile",
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR
    );
  }

  if (targetProfile?.role === "admin") {
    throw new ApiError(
      "Cannot delete admin accounts",
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN
    );
  }

  // Check for important dependencies before deletion
  // Note: Most tables have ON DELETE CASCADE, but we check for active data
  const [bookingsCheck, escrowsCheck, transactionsCheck] = await Promise.all([
    supabase
      .from("bookings")
      .select("id")
      .or(`client_id.eq.${userId},worker_id.eq.${userId}`)
      .limit(1),
    supabase
      .from("escrow_holds")
      .select("id")
      .or(`employer_id.eq.${userId},worker_id.eq.${userId}`)
      .eq("status", "held")
      .limit(1),
    supabase
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .limit(1),
  ]);

  const hasActiveBookings = bookingsCheck.data && bookingsCheck.data.length > 0;
  const hasActiveEscrows = escrowsCheck.data && escrowsCheck.data.length > 0;
  const hasTransactions = transactionsCheck.data && transactionsCheck.data.length > 0;

  // Warn if user has active data (but don't block deletion)
  const warnings: string[] = [];
  if (hasActiveBookings) {
    warnings.push("User has active bookings");
  }
  if (hasActiveEscrows) {
    warnings.push("User has active escrow holds");
  }
  if (hasTransactions) {
    warnings.push("User has transaction history");
  }

  // Delete user from auth (this will cascade to related tables via ON DELETE CASCADE)
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    throw error;
  }

  // Log admin action (non-blocking)
  try {
    await supabase.from("admin_logs").insert({
      action: "delete_user",
      target_user_id: userId,
      admin_user_id: user.id,
      details: {
        warnings: warnings.length > 0 ? warnings : null,
        had_bookings: hasActiveBookings,
        had_escrows: hasActiveEscrows,
        had_transactions: hasTransactions,
      },
    });
  } catch (logError) {
    console.error("Failed to log admin action:", logError);
  }

  const message =
    warnings.length > 0
      ? `User deleted successfully. Note: ${warnings.join(", ")}`
      : "User deleted successfully";

  return successResponse(
    {
      warnings: warnings.length > 0 ? warnings : undefined,
    },
    message
  );
});
