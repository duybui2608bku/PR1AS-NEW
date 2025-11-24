/**
 * POST /api/fire/purchase
 * Purchase Fire points with wallet balance
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { FireService } from "@/lib/fire/service";
import { PurchaseFireRequest, PurchaseFireResponse } from "@/lib/fire/types";

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
      console.error("Fire purchase: No authentication token provided");
      return NextResponse.json<PurchaseFireResponse>(
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
      console.error("Fire purchase: Invalid or expired token", authError);
      return NextResponse.json<PurchaseFireResponse>(
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
      console.error("Fire purchase: Worker profile not found", profileError);
      return NextResponse.json<PurchaseFireResponse>(
        { success: false, error: "Worker profile not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body: PurchaseFireRequest = await request.json();
    const { amount } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json<PurchaseFireResponse>(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Purchase Fire
    const fireService = new FireService(supabase);

    try {
      const result = await fireService.purchaseFire(
        workerProfile.id,
        user.id,
        amount
      );

      return NextResponse.json<PurchaseFireResponse>({
        success: true,
        data: {
          fires_purchased: amount,
          cost_usd: amount * 1.0, // 1 USD = 1 Fire
          new_balance: result.fire.total_fires,
          transaction: result.transaction,
        },
      });
    } catch (serviceError: any) {
      console.error("Fire service purchase error:", serviceError);
      throw serviceError;
    }
  } catch (error: any) {
    console.error("Purchase Fire error:", error);
    return NextResponse.json<PurchaseFireResponse>(
      { success: false, error: error.message || "Failed to purchase Fire" },
      { status: error.statusCode || 500 }
    );
  }
}
