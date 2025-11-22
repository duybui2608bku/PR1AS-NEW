/**
 * Worker Service Management API
 * DELETE /api/worker/services/[id] - Remove service from worker profile
 * PATCH  /api/worker/services/[id]/price - Update service pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/wallet/auth-helper';
import { WorkerProfileService } from '@/lib/worker/service';
import { getErrorMessage } from '@/lib/utils/common';

/**
 * DELETE /api/worker/services/[id]
 * Remove service from worker profile
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const service = new WorkerProfileService(supabase);
    await service.removeWorkerService(params.id);

    return NextResponse.json({
      success: true,
      message: 'Service removed successfully',
    });
  } catch (error: unknown) {
    console.error('Error removing worker service:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, 'Failed to remove service'),
      },
      { status: 500 }
    );
  }
}
