/**
 * GET /api/services
 * Get all available services with categories and options
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { WorkerProfileService } from "@/lib/worker/service";
import { getErrorMessage } from "@/lib/utils/common";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id");

    const supabase = createAdminClient();
    const service = new WorkerProfileService(supabase);

    const services = await service.getServices(categoryId || undefined);

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to fetch services"),
      },
      { status: 500 }
    );
  }
}
