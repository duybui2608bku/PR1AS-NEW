/**
 * Create Booking API
 * POST /api/booking/create - Client creates a booking request
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/wallet/auth-helper";
import { BookingService } from "@/lib/booking/service";
import { CreateBookingRequest } from "@/lib/booking/types";

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

    // Verify user is client
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          error: "Only clients can create bookings",
        },
        { status: 403 }
      );
    }

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
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 }
      );
    }

    // Create booking
    const bookingService = new BookingService(supabase);
    const booking = await bookingService.createBooking(user.id, body);

    return NextResponse.json({
      success: true,
      booking,
      message: "Booking request created successfully",
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
