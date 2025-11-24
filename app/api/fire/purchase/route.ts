/**
 * POST /api/fire/purchase
 * Purchase Fire points with wallet balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FireService } from '@/lib/fire/service';
import { PurchaseFireRequest, PurchaseFireResponse } from '@/lib/fire/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<PurchaseFireResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get worker profile
    const { data: workerProfile, error: profileError } = await supabase
      .from('worker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !workerProfile) {
      return NextResponse.json<PurchaseFireResponse>(
        { success: false, error: 'Worker profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body: PurchaseFireRequest = await request.json();
    const { amount } = body;

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json<PurchaseFireResponse>(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Purchase Fire
    const fireService = new FireService(supabase);
    const result = await fireService.purchaseFire(workerProfile.id, user.id, amount);

    return NextResponse.json<PurchaseFireResponse>({
      success: true,
      data: {
        fires_purchased: amount,
        cost_usd: amount * 1.0, // 1 USD = 1 Fire
        new_balance: result.fire.total_fires,
        transaction: result.transaction,
      },
    });
  } catch (error: any) {
    console.error('Purchase Fire error:', error);
    return NextResponse.json<PurchaseFireResponse>(
      { success: false, error: error.message || 'Failed to purchase Fire' },
      { status: error.statusCode || 500 }
    );
  }
}
