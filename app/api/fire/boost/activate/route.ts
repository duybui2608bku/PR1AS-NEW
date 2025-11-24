/**
 * Boost Activation API
 * POST /api/fire/boost/activate - Activate recommendation or profile boost
 */

import { NextRequest, NextResponse } from 'next/server';
import { FireService } from '@/lib/fire/service';
import { getAuthenticatedUser, isWorker } from '@/lib/fire/auth-helper';
import { getErrorMessage } from '@/lib/utils/common';
import { ActivateBoostRequest } from '@/lib/fire/types';
import { BoostType } from '@/lib/utils/enums';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (!isWorker(user)) {
      return NextResponse.json({ error: 'Only workers can activate boosts' }, { status: 403 });
    }

    // Parse request body
    const body: ActivateBoostRequest = await request.json();

    // Validate boost type
    if (!body.boost_type || !Object.values(BoostType).includes(body.boost_type)) {
      return NextResponse.json({ error: 'Invalid boost type' }, { status: 400 });
    }

    // Activate boost
    const fireService = new FireService(supabase);
    const result = await fireService.activateBoost(user.id, body);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, 'Failed to activate boost');

    // Check for insufficient balance error
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'INSUFFICIENT_BALANCE'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
