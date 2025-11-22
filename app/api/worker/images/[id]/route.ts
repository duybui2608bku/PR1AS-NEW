/**
 * DELETE /api/worker/images/[id]
 * Delete worker image
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/wallet/auth-helper';
import { WorkerProfileService } from '@/lib/worker/service';
import { getErrorMessage } from '@/lib/utils/common';

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

    // Get worker profile to pass profileId
    const profile = await service.getWorkerProfile(user.id);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Worker profile not found' },
        { status: 404 }
      );
    }

    await service.deleteWorkerImage(params.id, profile.id);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: unknown) {

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, 'Failed to delete image'),
      },
      { status: 500 }
    );
  }
}
