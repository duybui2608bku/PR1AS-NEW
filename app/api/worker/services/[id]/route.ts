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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const service = new WorkerProfileService(supabase);

    // Get worker profile to pass profileId
    const profile = await service.getWorkerProfile(user.id);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Worker profile not found' },
        { status: 404 }
      );
    }

    await service.removeWorkerService(id, profile.id);

    return NextResponse.json({
      success: true,
      message: 'Service removed successfully',
    });
  } catch (error: unknown) {

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, 'Failed to remove service'),
      },
      { status: 500 }
    );
  }
}
