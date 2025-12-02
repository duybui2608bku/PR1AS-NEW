/**
 * GET /api/services/categories
 * Get all service categories
 */

import { createAdminClient } from "@/lib/supabase/server";
import { WorkerProfileService } from "@/lib/worker/service";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const GET = withErrorHandling(async () => {
  const supabase = createAdminClient();
  const service = new WorkerProfileService(supabase);

  const categories = await service.getServiceCategories();

  return successResponse(categories);
});
