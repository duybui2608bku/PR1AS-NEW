/**
 * GET /api/fire/boosts/active
 * Get worker's active Fire boosts
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { FireService } from "@/lib/fire/service";
import { GetActiveBoostsResponse, FireBoostType } from "@/lib/fire/types";

export async function GET(request: NextRequest) {
  try {
    // Try to get token from cookies first (for httpOnly cookie authentication)
    let token = request.cookies.get("sb-access-token")?.value;

    // If no cookie, check Authorization header (for client-side auth)
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader) {
        token = authHeader.replace("Bearer ", "");
      }
    }

    if (!token) {
      return NextResponse.json<GetActiveBoostsResponse>(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const supabase = await createAdminClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<GetActiveBoostsResponse>(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get worker profile
    const { data: workerProfile, error: profileError } = await supabase
      .from("worker_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !workerProfile) {
      return NextResponse.json<GetActiveBoostsResponse>(
        { success: false, error: "Worker profile not found" },
        { status: 404 }
      );
    }

    // Get active boosts
    const fireService = new FireService(supabase);
    const activeBoosts = await fireService.getActiveBoosts(workerProfile.id);

    // Check which boost types are active
    const hasFeaturedBoost = activeBoosts.some(
      (boost) => boost.boost_type === FireBoostType.FEATURED_RECOMMENDATION
    );
    const hasProfileBoost = activeBoosts.some(
      (boost) => boost.boost_type === FireBoostType.TOP_PROFILE
    );

    return NextResponse.json<GetActiveBoostsResponse>({
      success: true,
      data: {
        active_boosts: activeBoosts,
        has_featured_boost: hasFeaturedBoost,
        has_profile_boost: hasProfileBoost,
      },
    });
  } catch (error: any) {
    console.error("Get active boosts error:", error);
    return NextResponse.json<GetActiveBoostsResponse>(
      {
        success: false,
        error: error.message || "Failed to fetch active boosts",
      },
      { status: error.statusCode || 500 }
    );
  }
}
