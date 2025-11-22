/**
 * GET /api/services/categories
 * Get all service categories
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { WorkerProfileService } from "@/lib/worker/service";
import { getErrorMessage } from "@/lib/utils/common";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const service = new WorkerProfileService(supabase);

    const categories = await service.getServiceCategories();

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to fetch service categories"),
      },
      { status: 500 }
    );
  }
}
