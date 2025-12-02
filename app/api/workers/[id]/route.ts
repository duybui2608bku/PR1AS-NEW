/**
 * GET /api/workers/[id]
 * Get public worker profile by ID
 */

import { NextRequest } from "next/server";
import { WorkerProfileService } from "@/lib/worker/service";
import { createAdminClient } from "@/lib/supabase/server";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

export const GET = withErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    // Use admin client so RLS does not block public read of published profiles
    const supabase = createAdminClient();
    const service = new WorkerProfileService(supabase);

    const profile = await service.getWorkerProfileById(id);

    if (!profile) {
      throw new ApiError(
        "Worker profile not found or not published",
        HttpStatus.NOT_FOUND,
        ErrorCode.WORKER_PROFILE_NOT_FOUND
      );
    }

    return successResponse(profile);
  }
);
