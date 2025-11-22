/**
 * Fee Calculation API
 * GET /api/wallet/fees?amount=100 - Calculate fees for a given amount
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WalletService } from '@/lib/wallet/service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const amount = Number(searchParams.get('amount'));

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid amount parameter is required',
        },
        { status: 400 }
      );
    }

    // Calculate fees
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const walletService = new WalletService(supabase);
    const calculation = await walletService.calculateFees(amount);

    return NextResponse.json({
      success: true,
      calculation,
    });
  } catch (error: any) {
    console.error('[Wallet Fees] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to calculate fees',
      },
      { status: 500 }
    );
  }
}

