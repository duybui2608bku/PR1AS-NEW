/**
 * Worker Profile Validation API
 * Endpoints for validating and fixing data consistency issues
 */

import { NextRequest } from "next/server";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";
import { requireWorker } from "@/lib/auth/middleware";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  validateStepState,
  recalculateCompletedSteps,
  validateAndFixProfile,
  cleanupAllOrphanedData,
} from "@/lib/worker/data-consistency";
import { WorkerProfileService } from "@/lib/worker/service";

/**
 * GET /api/worker/profile/validate
 * Validate current user's profile for inconsistencies
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const user = await requireWorker(request);
  const supabase = getSupabaseServerClient();

  const service = new WorkerProfileService(supabase);
  const profile = await service.getWorkerProfile(user.id, false); // Don't auto-fix

  if (!profile) {
    return successResponse({
      valid: false,
      inconsistencies: [],
      message: "Profile not found",
    });
  }

  const inconsistencies = validateStepState(profile);

  return successResponse({
    valid: inconsistencies.length === 0,
    inconsistencies,
    profileId: profile.id,
    currentSteps: profile.profile_completed_steps,
  });
});

/**
 * POST /api/worker/profile/validate/fix
 * Fix inconsistencies in current user's profile
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const user = await requireWorker(request);
  const supabase = getSupabaseServerClient();

  const service = new WorkerProfileService(supabase);
  const profile = await service.getWorkerProfile(user.id, false);

  if (!profile) {
    return successResponse({
      fixed: false,
      message: "Profile not found",
    });
  }

  const result = await validateAndFixProfile(supabase, profile.id);

  return successResponse({
    fixed: result.fixed,
    inconsistencies: result.inconsistencies,
    errors: result.errors,
    profileId: profile.id,
  });
});

/**
 * PATCH /api/worker/profile/validate/recalculate
 * Recalculate completed steps for current user's profile
 */
export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const user = await requireWorker(request);
  const supabase = getSupabaseServerClient();

  const service = new WorkerProfileService(supabase);
  const profile = await service.getWorkerProfile(user.id, false);

  if (!profile) {
    return successResponse({
      updated: false,
      message: "Profile not found",
    });
  }

  const result = await recalculateCompletedSteps(supabase, profile.id);

  return successResponse({
    updated: result.updated,
    oldSteps: result.oldSteps,
    newSteps: result.newSteps,
    profileId: profile.id,
  });
});

