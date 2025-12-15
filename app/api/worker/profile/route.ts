/**
 * Worker Profile API
 * GET    /api/worker/profile - Get current worker's profile
 * POST   /api/worker/profile - Create/Update worker profile (Step 1)
 * PATCH  /api/worker/profile/submit - Submit profile for review
 * PATCH  /api/worker/profile/publish - Publish profile
 */

import { NextRequest } from "next/server";
import { requireWorker } from "@/lib/auth/middleware";
import { WorkerProfileService } from "@/lib/worker/service";
import { WorkerProfileStep1Request } from "@/lib/worker/types";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/auth/rate-limit";
import { validateWorkerProfileStep1OrThrow } from "@/lib/worker/validation";
import { sanitizeWorkerProfileStep1 } from "@/lib/worker/security";
import {
  withCSRFProtection,
  generateCSRFResponse,
} from "@/lib/http/csrf-middleware";
import { applySecurityHeaders } from "@/lib/http/security-headers";
import { generateCSRFToken, setCSRFTokenCookie } from "@/lib/auth/csrf";

/**
 * GET /api/worker/profile
 * Get worker's own profile
 * Returns null if profile doesn't exist yet (first time setup)
 * Also sets CSRF token cookie for subsequent POST requests
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireWorker(request);

  const service = new WorkerProfileService(supabase);
  const profile = await service.getWorkerProfile(user.id);

  // Return null if profile doesn't exist yet (first time setup)
  // Frontend will handle this gracefully
  const response = successResponse(profile);
  const responseWithHeaders = applySecurityHeaders(response);

  // Set CSRF token cookie if not exists (for first-time requests)
  // This ensures CSRF protection works when user submits the form
  const existingToken = request.cookies.get("csrftoken")?.value;
  if (!existingToken) {
    const token = generateCSRFToken();
    setCSRFTokenCookie(responseWithHeaders, token);
  }

  return responseWithHeaders;
});

/**
 * POST /api/worker/profile
 * Create or update worker profile (Step 1)
 * Protected with CSRF and input sanitization
 */
export const POST = withErrorHandling(
  withCSRFProtection(async (request: NextRequest) => {
    const { user, supabase } = await requireWorker(request);

    // Rate limiting
    const rateLimitResult = checkRateLimit(
      `worker-profile:${user.id}`,
      RATE_LIMIT_CONFIGS.WORKER_PROFILE
    );

    if (!rateLimitResult.allowed) {
      throw new ApiError(
        `Too many requests. Please wait ${
          rateLimitResult.retryAfter || 60
        } seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
        ErrorCode.RATE_LIMIT_EXCEEDED
      );
    }

    const body: WorkerProfileStep1Request = await request.json();

    // Sanitize input to prevent XSS attacks
    const sanitizedBody = sanitizeWorkerProfileStep1(body);

    // Comprehensive validation
    validateWorkerProfileStep1OrThrow(sanitizedBody);

    const service = new WorkerProfileService(supabase);
    const profile = await service.saveWorkerProfile(user.id, sanitizedBody);

    const response = successResponse(profile, "Profile saved successfully");
    return applySecurityHeaders(response);
  })
);
