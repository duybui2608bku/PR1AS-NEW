/**
 * Calculate Booking Price API
 * POST /api/booking/calculate - Calculate booking price before creating
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { BookingService } from "@/lib/booking/service";
import { BookingType } from "@/lib/booking/types";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const { user, supabase } = await requireAuth(request);

  // Parse request body
  const body = await request.json();
  const { worker_service_id, booking_type, duration_hours } = body;

  if (!worker_service_id || !booking_type || !duration_hours) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Calculate price
  const bookingService = new BookingService(supabase);
  const calculation = await bookingService.calculateBookingPrice(
    user.id,
    worker_service_id,
    booking_type as BookingType,
    duration_hours
  );

  return successResponse({ calculation });
});
