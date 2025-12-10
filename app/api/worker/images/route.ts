/**
 * Worker Images API
 * POST   /api/worker/images - Add image to worker profile
 */

import { NextRequest } from 'next/server';
import { requireWorker } from '@/lib/auth/middleware';
import { WorkerProfileService } from '@/lib/worker/service';
import { UploadImageRequest } from '@/lib/worker/types';
import { successResponse } from '@/lib/http/response';
import { withErrorHandling, ApiError, ErrorCode } from '@/lib/http/errors';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/constants/errors';
import { HttpStatus } from '@/lib/utils/enums';
import { sanitizeImageUrl } from '@/lib/worker/security';
import { applySecurityHeaders } from '@/lib/http/security-headers';
import { withCSRFProtection } from '@/lib/http/csrf-middleware';

/**
 * POST /api/worker/images
 * Add image to worker profile
 * Protected with CSRF and input sanitization
 */
export const POST = withErrorHandling(
  withCSRFProtection(async (request: NextRequest) => {
    const { user, supabase } = await requireWorker(request);

    const body: UploadImageRequest = await request.json();

    // Validation
    if (!body.image_url || !body.image_type) {
      throw new ApiError(
        'Image URL and type are required',
        HttpStatus.BAD_REQUEST,
        ErrorCode.MISSING_REQUIRED_FIELDS
      );
    }

    // Sanitize image URL
    const sanitizedUrl = sanitizeImageUrl(body.image_url);
    if (!sanitizedUrl) {
      throw new ApiError(
        'Invalid image URL',
        HttpStatus.BAD_REQUEST,
        ErrorCode.INVALID_FILE_TYPE
      );
    }

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

    // Add image with sanitized URL
    const image = await service.addWorkerImage(profile.id, {
      image_url: sanitizedUrl,
      image_type: body.image_type,
      file_name: body.file_name,
      file_size_bytes: body.file_size_bytes,
      mime_type: body.mime_type,
      width_px: body.width_px,
      height_px: body.height_px,
    });

    const response = successResponse(image, 'Image added successfully');
    return applySecurityHeaders(response);
  })
);
