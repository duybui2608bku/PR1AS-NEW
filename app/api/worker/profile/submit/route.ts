/**
 * PATCH /api/worker/profile/submit
 * Submit worker profile for admin review
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/wallet/auth-helper";
import { WorkerProfileService } from "@/lib/worker/service";
import { getErrorMessage } from "@/lib/utils/common";

export async function PATCH(request: NextRequest) {
  try {
    const {
      user,
      supabase,
      error: authError,
    } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      return NextResponse.json(
        { success: false, error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    const service = new WorkerProfileService(supabase);
    await service.submitProfileForReview(user.id);

    return NextResponse.json({
      success: true,
      message: "Profile submitted for review",
    });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, "Failed to submit profile");

    // Check for validation errors
    if (errorMessage.includes("avatar") || errorMessage.includes("service")) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
