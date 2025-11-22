/**
 * GET /api/services/[id]
 * Get service by ID with options
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { WorkerProfileService } from "@/lib/worker/service";
import { getErrorMessage } from "@/lib/utils/common";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient();
    const service = new WorkerProfileService(supabase);

    const serviceData = await service.getServiceById(params.id);

    return NextResponse.json({
      success: true,
      data: serviceData,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to fetch service"),
      },
      { status: 404 }
    );
  }
}
