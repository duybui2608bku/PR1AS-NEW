/**
 * GET /api/services/[id]
 * Get service by ID with options
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { WorkerProfileService } from "@/lib/worker/service";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const GET = withErrorHandling(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await params;
    const supabase = createAdminClient();
    const service = new WorkerProfileService(supabase);

    const serviceData = await service.getServiceById(id);

    return successResponse(serviceData);
  }
);
