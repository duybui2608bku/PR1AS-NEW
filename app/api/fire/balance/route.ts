/**
 * GET /api/fire/balance
 * Get worker's Fire points balance and active boosts
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { FireService } from "@/lib/fire/service";
import { GetFireBalanceResponse } from "@/lib/fire/types";

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
      return NextResponse.json<GetFireBalanceResponse>(
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
      return NextResponse.json<GetFireBalanceResponse>(
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
      return NextResponse.json<GetFireBalanceResponse>(
        { success: false, error: "Worker profile not found" },
        { status: 404 }
      );
    }

    // Get Fire balance
    const fireService = new FireService(supabase);
    const balance = await fireService.getOrCreateFireBalance(workerProfile.id);
    const activeBoosts = await fireService.getActiveBoosts(workerProfile.id);

    return NextResponse.json<GetFireBalanceResponse>({
      success: true,
      data: {
        total_fires: balance.total_fires,
        lifetime_fires_earned: balance.lifetime_fires_earned,
        lifetime_fires_spent: balance.lifetime_fires_spent,
        active_boosts: activeBoosts,
      },
    });
  } catch (error: any) {
    console.error("Fire balance error:", error);
    return NextResponse.json<GetFireBalanceResponse>(
      {
        success: false,
        error: error.message || "Failed to fetch Fire balance",
      },
      { status: error.statusCode || 500 }
    );
  }
}
