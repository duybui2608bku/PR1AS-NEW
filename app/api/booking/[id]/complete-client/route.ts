/**
 * Client Complete Booking API
 * POST /api/booking/[id]/complete-client - Client confirms completion and releases payment
 */

import { NextRequest } from "next/server";
import { requireClient } from "@/lib/auth/middleware";
import { BookingService } from "@/lib/booking/service";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const POST = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await context.params;

    // Require client authentication
    const { user, supabase } = await requireClient(request);

    const bookingService = new BookingService(supabase);
    const booking = await bookingService.clientCompleteBooking(id, user.id);

    return successResponse(
      { booking },
      "Booking completed. Payment has been released to worker."
    );
  }
);

