/**
 * Boost Status API
 * GET /api/fire/boost/status - Get active boosts status
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
      return NextResponse.json({ error: 'Only workers can check boost status' }, { status: 403 });
    }

    // Get boost status
    const fireService = new FireService(supabase);
    const status = await fireService.getBoostStatus(user.id);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, 'Failed to fetch boost status');
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
