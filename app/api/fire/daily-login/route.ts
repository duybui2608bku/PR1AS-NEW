/**
 * Daily Login Reward API
 * POST /api/fire/daily-login - Claim daily login reward
 */

import { NextRequest, NextResponse } from 'next/server';
import { FireService } from '@/lib/fire/service';
import { getAuthenticatedUser, isWorker } from '@/lib/fire/auth-helper';
import { getErrorMessage } from '@/lib/utils/common';
import { FireErrorCode } from '@/lib/fire/types';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (!isWorker(user)) {
      return NextResponse.json(
        { error: 'Only workers can claim daily login rewards' },
        { status: 403 }
      );
    }

    // Claim daily login
    const fireService = new FireService(supabase);
    const result = await fireService.claimDailyLogin(user.id);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, 'Failed to claim daily login reward');

    // Check for specific Fire errors
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === FireErrorCode.ALREADY_CLAIMED_TODAY
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
