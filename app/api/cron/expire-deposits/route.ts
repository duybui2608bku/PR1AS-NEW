/**
 * Cron Job: Expire old bank deposits
 * This endpoint should be called periodically (e.g., every 30 minutes) to expire
 * pending bank deposit QR codes that have timed out.
 *
 * Setup with Vercel Cron or similar service:
 * - Add to vercel.json: { "crons": [{ "path": "/api/cron/expire-deposits", "schedule": "every 30 minutes (e.g. 0,30 * * * *)" }] }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createBankTransferService } from "@/lib/wallet/payment-gateways";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cronSecret = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const bankService = createBankTransferService();

    // Expire old deposits
    const expiredCount = await bankService.expireOldDeposits(supabase);

    return NextResponse.json({
      success: true,
      message: "Expire deposits job completed",
      expired_count: expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to run expire deposits job",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
