/**
 * GET /api/workers/[id]
 * Get public worker profile by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { WorkerProfileService } from "@/lib/worker/service";
import { createAdminClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/utils/common";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Use admin client so RLS does not block public read of published profiles
    const supabase = createAdminClient();
    const service = new WorkerProfileService(supabase);

    const profile = await service.getWorkerProfileById(id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Worker profile not found or not published" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to fetch worker profile"),
      },
      { status: 500 }
    );
  }
}
