/**
 * GET /api/services
 * Get all available services with categories and options
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { WorkerProfileService } from "@/lib/worker/service";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category_id");

  const supabase = createAdminClient();
  const service = new WorkerProfileService(supabase);

  const services = await service.getServices(categoryId || undefined);

  return successResponse(services);
});
