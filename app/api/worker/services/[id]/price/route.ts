/**
 * PATCH /api/worker/services/[id]/price
 * Update service pricing
 */

import { NextRequest } from 'next/server';
import { requireWorker } from '@/lib/auth/middleware';
import { WorkerProfileService } from '@/lib/worker/service';
import { UpdateServicePriceRequest } from '@/lib/worker/types';
import { successResponse } from '@/lib/http/response';
import { withErrorHandling, ApiError, ErrorCode } from '@/lib/http/errors';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/constants/errors';
import { HttpStatus } from '@/lib/utils/enums';

export const PATCH = withErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const { user, supabase } = await requireWorker(request);

    const body: UpdateServicePriceRequest = await request.json();

    // Validation
    if (!body.hourly_rate || body.hourly_rate <= 0) {
      throw new ApiError(
        'Valid hourly rate is required',
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const service = new WorkerProfileService(supabase);

    // Get worker profile to pass profileId
    const profile = await service.getWorkerProfile(user.id);
    if (!profile) {
      throw new ApiError(
        getErrorMessage(ERROR_MESSAGES.WORKER_PROFILE_NOT_FOUND),
        HttpStatus.NOT_FOUND,
        ErrorCode.WORKER_PROFILE_NOT_FOUND
      );
    }

    const updatedPrice = await service.updateWorkerServicePrice(id, profile.id, body);

    return successResponse(updatedPrice, 'Pricing updated successfully');
  }
);
