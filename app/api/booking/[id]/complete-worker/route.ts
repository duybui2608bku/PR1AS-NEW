/**
 * Worker Complete Booking API
 * POST /api/booking/[id]/complete-worker - Worker marks booking as completed
 */

import { NextRequest } from "next/server";
import { requireWorker } from "@/lib/auth/middleware";
import { BookingService } from "@/lib/booking/service";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const POST = withErrorHandling(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    const { id } = await context.params;

    // Require worker authentication
    const { user, supabase } = await requireWorker(request);

    const bookingService = new BookingService(supabase);
    const booking = await bookingService.workerCompleteBooking(id, user.id);

    return successResponse(
      { booking },
      "Booking marked as completed. Waiting for client confirmation."
    );
  }
);

