/**
 * PATCH /api/worker/profile/publish
 * Publish worker profile (after admin approval)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/wallet/auth-helper';
import { WorkerProfileService } from '@/lib/worker/service';
import { getErrorMessage } from '@/lib/utils/common';

export async function PATCH(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const service = new WorkerProfileService(supabase);
    await service.publishProfile(user.id);

    return NextResponse.json({
      success: true,
      message: 'Profile published successfully',
    });
  } catch (error: unknown) {
    console.error('Error publishing profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, 'Failed to publish profile'),
      },
      { status: 500 }
    );
  }
}
