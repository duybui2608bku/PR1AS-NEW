/**
 * Fire Balance API
 * GET /api/fire/balance - Get worker's Fire balance with active boosts
 */

import { NextRequest, NextResponse } from 'next/server';
import { FireService } from '@/lib/fire/service';
import { getAuthenticatedUser, isWorker } from '@/lib/fire/auth-helper';
import { getErrorMessage } from '@/lib/utils/common';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (!isWorker(user)) {
      return NextResponse.json({ error: 'Only workers can access Fire system' }, { status: 403 });
    }

    // Get Fire balance
    const fireService = new FireService(supabase);
    const balanceResponse = await fireService.getFireBalanceResponse(user.id);

    return NextResponse.json({
      success: true,
      ...balanceResponse,
    });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, 'Failed to fetch Fire balance');
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
