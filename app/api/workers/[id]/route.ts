/**
 * GET /api/workers/[id]
 * Get public worker profile by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { WorkerProfileService } from '@/lib/worker/service';
import { createClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/utils/common';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const service = new WorkerProfileService(supabase);

    const profile = await service.getWorkerProfileById(params.id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Worker profile not found or not published' },
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
        error: getErrorMessage(error, 'Failed to fetch worker profile'),
      },
      { status: 500 }
    );
  }
}
