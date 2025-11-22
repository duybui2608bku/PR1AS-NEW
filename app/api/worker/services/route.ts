/**
 * Worker Services API
 * GET    /api/worker/services - Get worker's services with pricing
 * POST   /api/worker/services - Add service to worker profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/wallet/auth-helper';
import { WorkerProfileService } from '@/lib/worker/service';
import { getErrorMessage } from '@/lib/utils/common';
import { AddWorkerServiceRequest } from '@/lib/worker/types';

/**
 * GET /api/worker/services
 * Get worker's services with pricing
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

    // Get worker profile
    const profile = await service.getWorkerProfile(user.id);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get services
    const services = await service.getWorkerServices(profile.id);

    return NextResponse.json({
      success: true,
      data: services,
    });
  } catch (error: unknown) {

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, 'Failed to fetch services'),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worker/services
 * Add service to worker profile (Step 2)
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

    const body: AddWorkerServiceRequest = await request.json();

    // Validation
    if (!body.service_id) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }

    if (!body.pricing || !body.pricing.hourly_rate || !body.pricing.primary_currency) {
      return NextResponse.json(
        { success: false, error: 'Pricing information is required' },
        { status: 400 }
      );
    }

    if (body.pricing.hourly_rate <= 0) {
      return NextResponse.json(
        { success: false, error: 'Hourly rate must be greater than 0' },
        { status: 400 }
      );
    }

    const service = new WorkerProfileService(supabase);

    // Get worker profile
    const profile = await service.getWorkerProfile(user.id);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found. Please complete Step 1 first.' },
        { status: 404 }
      );
    }

    // Add service
    const result = await service.addWorkerService(profile.id, body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Service added successfully',
    });
  } catch (error: unknown) {

    const errorMessage = getErrorMessage(error, 'Failed to add service');

    // Check for duplicate error
    if (errorMessage.includes('already added')) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
