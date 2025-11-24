/**
 * POST /api/fire/boost
 * Activate Fire boost
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { FireService } from "@/lib/fire/service";
import {
  ActivateBoostRequest,
  ActivateBoostResponse,
  FireBoostType,
} from "@/lib/fire/types";

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
      return NextResponse.json<ActivateBoostResponse>(
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
      return NextResponse.json<ActivateBoostResponse>(
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
      return NextResponse.json<ActivateBoostResponse>(
        { success: false, error: "Worker profile not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body: ActivateBoostRequest = await request.json();
    const { boost_type } = body;

    // Validate boost type
    if (!boost_type || !Object.values(FireBoostType).includes(boost_type)) {
      return NextResponse.json<ActivateBoostResponse>(
        { success: false, error: "Invalid boost type" },
        { status: 400 }
      );
    }

    // Activate boost
    const fireService = new FireService(supabase);
    const result = await fireService.activateBoost(
      workerProfile.id,
      boost_type
    );

    // Calculate time remaining
    const expiresAt = new Date(result.boost.expires_at);
    const now = new Date();
    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));

    return NextResponse.json<ActivateBoostResponse>({
      success: true,
      data: {
        boost: result.boost,
        new_balance: result.fire.total_fires,
        expires_at: result.boost.expires_at,
        time_remaining_minutes: remainingMinutes,
      },
    });
  } catch (error: any) {
    console.error("Activate boost error:", error);
    return NextResponse.json<ActivateBoostResponse>(
      { success: false, error: error.message || "Failed to activate boost" },
      { status: error.statusCode || 500 }
    );
  }
}
