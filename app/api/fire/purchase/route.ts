/**
 * Fire Purchase API
 * POST /api/fire/purchase - Purchase Fire with money
 */

import { NextRequest, NextResponse } from 'next/server';
import { FireService } from '@/lib/fire/service';
import { getAuthenticatedUser, isWorker } from '@/lib/fire/auth-helper';
import { getErrorMessage } from '@/lib/utils/common';
import { PurchaseFireRequest } from '@/lib/fire/types';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (!isWorker(user)) {
      return NextResponse.json({ error: 'Only workers can purchase Fire' }, { status: 403 });
    }

    // Parse request body
    const body: PurchaseFireRequest = await request.json();

    // Validate request
    if (!body.fire_amount || body.fire_amount <= 0) {
      return NextResponse.json({ error: 'Invalid Fire amount' }, { status: 400 });
    }

    if (!body.payment_method) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    // Purchase Fire
    const fireService = new FireService(supabase);
    const result = await fireService.purchaseFire(user.id, body);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, 'Failed to purchase Fire');
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
