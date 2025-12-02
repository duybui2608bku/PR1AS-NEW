/**
 * Create Booking API
 * POST /api/booking/create - Client creates a booking request
 */

import { NextRequest } from "next/server";
import { BookingService } from "@/lib/booking/service";
import { CreateBookingRequest } from "@/lib/booking/types";
import { requireClient } from "@/lib/auth/middleware";
import { successResponse, badRequestResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require client authentication
  const { user, supabase } = await requireClient(request);

  // Parse request body
  const body: CreateBookingRequest = await request.json();
  const {
    worker_id,
    worker_service_id,
    booking_type,
    duration_hours,
    start_date,
  } = body;

  // Validate required fields
  if (
    !worker_id ||
    !worker_service_id ||
    !booking_type ||
    !duration_hours ||
    !start_date
  ) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Create booking
  const bookingService = new BookingService(supabase);
  const booking = await bookingService.createBooking(user.id, body);

  return successResponse(
    { booking },
    "Booking request created successfully"
  );
});
