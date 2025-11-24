/**
 * POST /api/fire/daily-login
 * Claim daily login reward
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { FireService } from "@/lib/fire/service";
import { ClaimDailyLoginResponse } from "@/lib/fire/types";

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
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
      return NextResponse.json(
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
      return NextResponse.json<ClaimDailyLoginResponse>(
        { success: false, error: "Worker profile not found" },
        { status: 404 }
      );
    }

    // Claim daily login
    const fireService = new FireService(supabase);

    try {
      const result = await fireService.claimDailyLogin(workerProfile.id);

      // Calculate next claim time (tomorrow at 00:00)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      return NextResponse.json<ClaimDailyLoginResponse>({
        success: true,
        data: {
          fires_awarded: result.transaction.fires_amount,
          new_balance: result.fire.total_fires,
          already_claimed_today: false,
          next_claim_available: tomorrow.toISOString(),
        },
      });
    } catch (error: any) {
      // Check if already claimed
      if (error.code === "ALREADY_CLAIMED_TODAY") {
        const balance = await fireService.getFireBalance(workerProfile.id);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        return NextResponse.json<ClaimDailyLoginResponse>({
          success: true,
          data: {
            fires_awarded: 0,
            new_balance: balance?.total_fires || 0,
            already_claimed_today: true,
            next_claim_available: tomorrow.toISOString(),
          },
        });
      }

      throw error;
    }
  } catch (error: any) {
    return NextResponse.json<ClaimDailyLoginResponse>(
      { success: false, error: error.message || "Failed to claim daily login" },
      { status: error.statusCode || 500 }
    );
  }
}
