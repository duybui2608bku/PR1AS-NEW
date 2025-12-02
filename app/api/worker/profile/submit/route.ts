/**
 * PATCH /api/worker/profile/submit
 * Submit worker profile for admin review
 */

import { NextRequest } from "next/server";
import { requireWorker } from "@/lib/auth/middleware";
import { WorkerProfileService } from "@/lib/worker/service";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { HttpStatus } from "@/lib/utils/enums";

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireWorker(request);

  const service = new WorkerProfileService(supabase);
  await service.submitProfileForReview(user.id);

  return successResponse(null, "Profile submitted for review");
});
