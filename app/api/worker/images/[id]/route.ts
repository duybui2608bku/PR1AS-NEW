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
    await service.deleteWorkerImage(params.id);

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, 'Failed to delete image'),
      },
      { status: 500 }
    );
  }
}
