/**
 * Payment API
 * POST /api/wallet/payment - Employer pays worker (creates escrow hold)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { WalletService } from "@/lib/wallet/service";
import { PaymentRequest } from "@/lib/wallet/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Verify user is employer/client
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          error: "Only employers/clients can make payments",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body: PaymentRequest = await request.json();
    const { worker_id, job_id, amount_usd, description, cooling_period_days } =
      body;

    // Validate worker exists and is a worker
    const { data: worker } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", worker_id)
      .single();

    if (!worker || worker.role !== "worker") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid worker ID",
        },
        { status: 400 }
      );
    }

    // Process payment
    const walletService = new WalletService(supabase);
    const result = await walletService.processPayment({
      employer_id: user.id,
      worker_id,
      job_id,
      amount_usd,
      description,
      cooling_period_days,
    });

    return NextResponse.json({
      success: true,
      message: "Payment processed and held in escrow",
      escrow: result.escrow,
      transaction: result.transaction,
    });
  } catch (error: any) {
    console.error("[Wallet Payment] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process payment",
        code: error.code,
      },
      { status: error.statusCode || 500 }
    );
  }
}
