/**
 * Worker Profile API
 * GET    /api/worker/profile - Get current worker's profile
 * POST   /api/worker/profile - Create/Update worker profile (Step 1)
 * PATCH  /api/worker/profile/submit - Submit profile for review
 * PATCH  /api/worker/profile/publish - Publish profile
 */

import { NextRequest } from "next/server";
import { requireWorker } from "@/lib/auth/middleware";
import { WorkerProfileService } from "@/lib/worker/service";
import { WorkerProfileStep1Request } from "@/lib/worker/types";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

/**
 * GET /api/worker/profile
 * Get worker's own profile
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireWorker(request);

  const service = new WorkerProfileService(supabase);
  const profile = await service.getWorkerProfile(user.id);

  if (!profile) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.WORKER_PROFILE_NOT_FOUND),
      HttpStatus.NOT_FOUND,
      ErrorCode.WORKER_PROFILE_NOT_FOUND
    );
  }

  return successResponse(profile);
});

/**
 * POST /api/worker/profile
 * Create or update worker profile (Step 1)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireWorker(request);

  const body: WorkerProfileStep1Request = await request.json();

  // Validation
  if (!body.full_name || !body.age) {
    throw new ApiError(
      "Full name and age are required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  if (body.age < 18 || body.age > 100) {
    throw new ApiError(
      "Age must be between 18 and 100",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  const service = new WorkerProfileService(supabase);
  const profile = await service.saveWorkerProfile(user.id, body);

  return successResponse(profile, "Profile saved successfully");
});
