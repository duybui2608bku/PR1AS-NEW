/**
 * List Bookings API
 * GET /api/booking/list - Get bookings with filters
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/wallet/auth-helper";
import { BookingService } from "@/lib/booking/service";
import { BookingFilters, BookingStatus } from "@/lib/booking/types";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user (checks both Authorization header and cookies)
    const {
      user,
      supabase,
      error: authError,
    } = await getAuthenticatedUser(request);

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user role
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Build filters based on role
    const filters: BookingFilters = {};
    const { searchParams } = new URL(request.url);

    if (profile.role === "client") {
      filters.client_id = user.id;
    } else if (profile.role === "worker") {
      filters.worker_id = user.id;
    }
    // Admin can see all bookings

    // Apply query filters
    const statusParam = searchParams.get("status");
    if (statusParam) {
      filters.status = statusParam.split(",") as BookingStatus[];
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    filters.page = page;
    filters.limit = limit;

    const bookingService = new BookingService(supabase);
    const bookings = await bookingService.getBookings(filters);

    return NextResponse.json({
      success: true,
      bookings,
      total: bookings.length,
      page,
      limit,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
