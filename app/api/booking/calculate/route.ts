/**
 * Calculate Booking Price API
 * POST /api/booking/calculate - Calculate booking price before creating
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/wallet/auth-helper";
import { BookingService } from "@/lib/booking/service";
import { BookingType } from "@/lib/booking/types";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user (checks both Authorization header and cookies)
    const {
      user,
      supabase,
      error: authError,
    } = await getAuthenticatedUser(request);

    if (authError || !user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: authError || "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { worker_service_id, booking_type, duration_hours } = body;

    if (!worker_service_id || !booking_type || !duration_hours) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
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

    return NextResponse.json({
      success: true,
      calculation,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        code: error.code,
      },
      { status: error.statusCode || 500 }
    );
  }
}
