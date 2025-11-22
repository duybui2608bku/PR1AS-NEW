/**
 * PATCH /api/worker/services/[id]/price
 * Update service pricing
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/wallet/auth-helper';
import { WorkerProfileService } from '@/lib/worker/service';
import { getErrorMessage } from '@/lib/utils/common';
import { UpdateServicePriceRequest } from '@/lib/worker/types';

export async function PATCH(
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

    const body: UpdateServicePriceRequest = await request.json();

    // Validation
    if (!body.hourly_rate || body.hourly_rate <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid hourly rate is required' },
        { status: 400 }
      );
    }

    const service = new WorkerProfileService(supabase);
    const updatedPrice = await service.updateWorkerServicePrice(params.id, body);

    return NextResponse.json({
      success: true,
      data: updatedPrice,
      message: 'Pricing updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error updating service price:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, 'Failed to update pricing'),
      },
      { status: 500 }
    );
  }
}
