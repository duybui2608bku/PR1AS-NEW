/**
 * Decline Booking API
 * POST /api/booking/[id]/decline - Worker declines booking
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/wallet/auth-helper";
import { BookingService } from "@/lib/booking/service";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

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

    // Verify user is worker
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "worker") {
      return NextResponse.json(
        {
          success: false,
          error: "Only workers can decline bookings",
        },
        { status: 403 }
      );
    }

    // Decline booking
    const bookingService = new BookingService(supabase);
    const booking = await bookingService.declineBooking(id, user.id);

    return NextResponse.json({
      success: true,
      booking,
      message: "Booking declined",
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

