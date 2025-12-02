/**
 * PATCH /api/worker/profile/publish
 * Publish worker profile (after admin approval)
 */

import { NextRequest } from "next/server";
import { requireWorker } from "@/lib/auth/middleware";
import { WorkerProfileService } from "@/lib/worker/service";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireWorker(request);

  const service = new WorkerProfileService(supabase);
  await service.publishProfile(user.id);

  return successResponse(null, "Profile published successfully");
});
