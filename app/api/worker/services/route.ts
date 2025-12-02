/**
 * Worker Services API
 * GET    /api/worker/services - Get worker's services with pricing
 * POST   /api/worker/services - Add service to worker profile
 */

import { NextRequest } from 'next/server';
import { requireWorker } from '@/lib/auth/middleware';
import { WorkerProfileService } from '@/lib/worker/service';
import { AddWorkerServiceRequest } from '@/lib/worker/types';
import { successResponse } from '@/lib/http/response';
import { withErrorHandling, ApiError, ErrorCode } from '@/lib/http/errors';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/constants/errors';
import { HttpStatus } from '@/lib/utils/enums';

/**
 * GET /api/worker/services
 * Get worker's services with pricing
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireWorker(request);

  const service = new WorkerProfileService(supabase);

  // Get worker profile
  const profile = await service.getWorkerProfile(user.id);
  if (!profile) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.WORKER_PROFILE_NOT_FOUND),
      HttpStatus.NOT_FOUND,
      ErrorCode.WORKER_PROFILE_NOT_FOUND
    );
  }

  // Get services
  const services = await service.getWorkerServices(profile.id);

  return successResponse(services);
});

/**
 * POST /api/worker/services
 * Add service to worker profile (Step 2)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireWorker(request);

  const body: AddWorkerServiceRequest = await request.json();

  // Validation
  if (!body.service_id) {
    throw new ApiError(
      'Service ID is required',
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  if (!body.pricing || !body.pricing.hourly_rate || !body.pricing.primary_currency) {
    throw new ApiError(
      'Pricing information is required',
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  if (body.pricing.hourly_rate <= 0) {
    throw new ApiError(
      'Hourly rate must be greater than 0',
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  const service = new WorkerProfileService(supabase);

  // Get worker profile
  const profile = await service.getWorkerProfile(user.id);
  if (!profile) {
    throw new ApiError(
      'Profile not found. Please complete Step 1 first.',
      HttpStatus.NOT_FOUND,
      ErrorCode.WORKER_PROFILE_NOT_FOUND
    );
  }

  // Add service
  const result = await service.addWorkerService(profile.id, body);

  return successResponse(result, 'Service added successfully');
});
