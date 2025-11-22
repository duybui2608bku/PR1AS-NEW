/**
 * Cron Job: Auto-release escrows
 * This endpoint should be called periodically (e.g., every hour) to automatically
 * release escrows that have completed their cooling period with no complaints.
 * 
 * Setup with Vercel Cron or similar service:
 * - Add to vercel.json: { "crons": [{ "path": "/api/cron/release-escrows", "schedule": "0 * * * *" }] }
 * - Or use external cron service to call this endpoint hourly
 * 
 * Security: Add CRON_SECRET to environment variables and verify it
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WalletService } from '@/lib/wallet/service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const cronSecret = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const walletService = new WalletService(supabase);

    // Get escrows ready for release
    const escrows = await walletService.getEscrowsReadyForRelease();

    const results = {
      total: escrows.length,
      released: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Release each escrow
    for (const escrow of escrows) {
      try {
        await walletService.releaseEscrow(escrow.escrow_id);
        results.released++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          escrow_id: escrow.escrow_id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-release job completed',
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to run auto-release job',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}

