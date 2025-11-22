/**
 * Worker Profile API
 * GET    /api/worker/profile - Get current worker's profile
 * POST   /api/worker/profile - Create/Update worker profile (Step 1)
 * PATCH  /api/worker/profile/submit - Submit profile for review
 * PATCH  /api/worker/profile/publish - Publish profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/wallet/auth-helper';
import { WorkerProfileService } from '@/lib/worker/service';
import { getErrorMessage } from '@/lib/utils/common';
import { WorkerProfileStep1Request } from '@/lib/worker/types';

/**
 * GET /api/worker/profile
 * Get worker's own profile
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const service = new WorkerProfileService(supabase);
    const profile = await service.getWorkerProfile(user.id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: unknown) {
    console.error('Error fetching worker profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, 'Failed to fetch profile'),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worker/profile
 * Create or update worker profile (Step 1)
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      return NextResponse.json(
        { success: false, error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: WorkerProfileStep1Request = await request.json();

    // Validation
    if (!body.full_name || !body.age) {
      return NextResponse.json(
        { success: false, error: 'Full name and age are required' },
        { status: 400 }
      );
    }

    if (body.age < 18 || body.age > 100) {
      return NextResponse.json(
        { success: false, error: 'Age must be between 18 and 100' },
        { status: 400 }
      );
    }

    const service = new WorkerProfileService(supabase);
    const profile = await service.saveWorkerProfile(user.id, body);

    return NextResponse.json({
      success: true,
      data: profile,
      message: 'Profile saved successfully',
    });
  } catch (error: unknown) {
    console.error('Error saving worker profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, 'Failed to save profile'),
      },
      { status: 500 }
    );
  }
}
