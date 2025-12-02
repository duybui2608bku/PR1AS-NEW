/**
 * Worker Service Management API
 * DELETE /api/worker/services/[id] - Remove service from worker profile
 */

import { NextRequest } from 'next/server';
import { requireWorker } from '@/lib/auth/middleware';
import { WorkerProfileService } from '@/lib/worker/service';
import { successResponse } from '@/lib/http/response';
import { withErrorHandling, ApiError, ErrorCode } from '@/lib/http/errors';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/constants/errors';
import { HttpStatus } from '@/lib/utils/enums';

/**
 * DELETE /api/worker/services/[id]
 * Remove service from worker profile
 */
export const DELETE = withErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const { user, supabase } = await requireWorker(request);

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

    await service.removeWorkerService(id, profile.id);

    return successResponse(null, 'Service removed successfully');
  }
);
