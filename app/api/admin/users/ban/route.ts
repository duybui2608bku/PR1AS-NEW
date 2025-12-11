import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { HttpStatus } from "@/lib/utils/enums";

// Ban duration options in hours
const BAN_DURATIONS: Record<string, string> = {
  "1d": "24h", // 1 day
  "1w": "168h", // 1 week
  "1m": "720h", // 1 month (30 days)
  "1y": "8760h", // 1 year
  permanent: "permanent", // Permanent ban
};

// POST /api/admin/users/ban
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { user, supabase } = await requireAdmin(request);

  const { userId, duration, reason } = await request.json();

  if (!userId) {
    throw new ApiError(
      "User ID is required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Prevent admin from banning themselves
  if (userId === user.id) {
    throw new ApiError(
      "You cannot ban yourself",
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN
    );
  }

  // Get current user to check if already banned
  const { data: currentUser, error: getUserError } =
    await supabase.auth.admin.getUserById(userId);

  if (getUserError) {
    throw new ApiError(
      "Failed to get user information",
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR
    );
  }

  // Check if user is already banned
  const currentBannedUntil = (currentUser.user as any).banned_until;
  const isCurrentlyBanned =
    currentBannedUntil && new Date(currentBannedUntil) > new Date();

  // Validate and calculate ban duration
  let banDuration: string;
  if (duration && BAN_DURATIONS[duration]) {
    banDuration = BAN_DURATIONS[duration];
  } else if (duration && duration.match(/^\d+[hdwmy]$/)) {
    // Allow custom duration format (e.g., "24h", "7d", "30d")
    banDuration = duration;
  } else {
    // Default to 1 year if not specified or invalid
    banDuration = BAN_DURATIONS["1y"];
  }

  // If user is already banned and new ban is not permanent, extend the ban
  if (isCurrentlyBanned && banDuration !== "permanent") {
    const currentBanEnd = new Date(currentBannedUntil);
    const now = new Date();
    const remainingHours = Math.max(
      0,
      Math.ceil((currentBanEnd.getTime() - now.getTime()) / (1000 * 60 * 60))
    );

    // Parse new duration and convert to hours
    let newDurationHours = 0;
    const hourMatch = banDuration.match(/^(\d+)h$/);
    const dayMatch = banDuration.match(/^(\d+)d$/);
    const weekMatch = banDuration.match(/^(\d+)w$/);
    const monthMatch = banDuration.match(/^(\d+)m$/);
    const yearMatch = banDuration.match(/^(\d+)y$/);

    if (hourMatch) {
      newDurationHours = parseInt(hourMatch[1], 10);
    } else if (dayMatch) {
      newDurationHours = parseInt(dayMatch[1], 10) * 24;
    } else if (weekMatch) {
      newDurationHours = parseInt(weekMatch[1], 10) * 168;
    } else if (monthMatch) {
      newDurationHours = parseInt(monthMatch[1], 10) * 720; // 30 days
    } else if (yearMatch) {
      newDurationHours = parseInt(yearMatch[1], 10) * 8760;
    } else {
      // Fallback: try to parse as hours if it's a number
      const numMatch = banDuration.match(/^(\d+)$/);
      if (numMatch) {
        newDurationHours = parseInt(numMatch[1], 10);
      }
    }

    // Calculate total hours and set as new ban duration
    const totalHours = remainingHours + newDurationHours;
    banDuration = `${totalHours}h`;
  }

  // Update user ban
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: banDuration === "permanent" ? "876000h" : banDuration, // Use very long duration for permanent
  });

  if (error) {
    throw error;
  }

  // Log admin action (non-blocking)
  try {
    await supabase.from("admin_logs").insert({
      action: "ban_user",
      target_user_id: userId,
      admin_user_id: user.id,
      details: {
        duration: banDuration,
        reason: reason || null,
        was_already_banned: isCurrentlyBanned,
        previous_ban_until: currentBannedUntil || null,
      },
    });
  } catch (logError) {
    // Log error but don't fail the request
    console.error("Failed to log admin action:", logError);
  }

  const message = isCurrentlyBanned
    ? `User ban extended successfully${reason ? `: ${reason}` : ""}`
    : `User banned successfully${reason ? `: ${reason}` : ""}`;

  return successResponse({ user: data.user }, message);
});
