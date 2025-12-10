/**
 * List Bookings API
 * GET /api/booking/list - Get bookings with filters
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { BookingService } from "@/lib/booking/service";
import { BookingFilters, BookingStatus } from "@/lib/booking/types";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";
import { UserRole } from "@/lib/utils/enums";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const { user, profile, supabase } = await requireAuth(request);

  // Build filters based on role
  const filters: BookingFilters = {};
  const { searchParams } = new URL(request.url);

  if (profile.role === UserRole.CLIENT) {
    filters.client_id = user.id;
  } else if (profile.role === UserRole.WORKER) {
    filters.worker_id = user.id;
  }
  // Admin can see all bookings

  // Apply query filters
  const statusParam = searchParams.get("status");
  if (statusParam) {
    filters.status = statusParam.split(",") as BookingStatus[];
  }

  const dateFromParam = searchParams.get("date_from");
  if (dateFromParam) {
    filters.date_from = dateFromParam;
  }

  const dateToParam = searchParams.get("date_to");
  if (dateToParam) {
    filters.date_to = dateToParam;
  }

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  filters.page = page;
  filters.limit = limit;

  const bookingService = new BookingService(supabase);
  const bookings = await bookingService.getBookings(filters);

  return successResponse({
    bookings,
    total: bookings.length,
    page,
    limit,
  });
});
