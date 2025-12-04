/**
 * Booking API Client
 * Client-side API wrapper for booking operations
 */

import {
  Booking,
  CreateBookingRequest,
  BookingCalculation,
} from "./types";

const API_BASE = "/api/booking";

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = (await import("@/lib/supabase/client")).getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if session exists
  // If not, API route will check cookies instead
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

export const bookingAPI = {
  /**
   * Calculate booking price before creating
   */
  async calculatePrice(
    workerServiceId: string,
    bookingType: "hourly" | "daily" | "weekly" | "monthly",
    durationHours: number
  ): Promise<BookingCalculation> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/calculate`, {
      method: "POST",
      headers,
      credentials: "include", // Important: Send cookies with request
      body: JSON.stringify({
        worker_service_id: workerServiceId,
        booking_type: bookingType,
        duration_hours: durationHours,
      }),
    });

    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(json?.error || "Failed to calculate price");
    }

    return json.data?.calculation as BookingCalculation;
  },

  /**
   * Create a new booking request
   */
  async createBooking(request: CreateBookingRequest): Promise<Booking> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/create`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(json?.error || "Failed to create booking");
    }

    return json.data?.booking as Booking;
  },

  /**
   * Get bookings list
   */
  async getBookings(filters?: {
    status?: string[];
    page?: number;
    limit?: number;
  }): Promise<Booking[]> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (filters?.status) {
      params.append("status", filters.status.join(","));
    }
    if (filters?.page) {
      params.append("page", filters.page.toString());
    }
    if (filters?.limit) {
      params.append("limit", filters.limit.toString());
    }

    const response = await fetch(`${API_BASE}/list?${params.toString()}`, {
      method: "GET",
      headers,
    });

    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(json?.error || "Failed to fetch bookings");
    }

    return (json.data?.bookings || []) as Booking[];
  },

  /**
   * Worker confirms booking
   */
  async confirmBooking(bookingId: string): Promise<Booking> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${bookingId}/confirm`, {
      method: "POST",
      headers,
    });

    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(json?.error || "Failed to confirm booking");
    }

    return json.data?.booking as Booking;
  },

  /**
   * Worker declines booking
   */
  async declineBooking(bookingId: string): Promise<Booking> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${bookingId}/decline`, {
      method: "POST",
      headers,
    });

    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(json?.error || "Failed to decline booking");
    }

    return json.data?.booking as Booking;
  },

  /**
   * Worker marks booking as completed
   */
  async workerCompleteBooking(bookingId: string): Promise<Booking> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${bookingId}/complete-worker`, {
      method: "POST",
      headers,
    });

    const contentType = response.headers.get("content-type") || "";

    // Guard against non-JSON responses (HTML error pages, redirects, etc.)
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error(
        "[workerCompleteBooking] Non-JSON response:",
        response.status,
        text.slice(0, 200)
      );
      throw new Error("Server returned an invalid response when completing booking.");
    }

    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(json?.error || "Failed to complete booking");
    }

    return json.data?.booking as Booking;
  },

  /**
   * Client confirms completion and releases payment
   */
  async clientCompleteBooking(bookingId: string): Promise<Booking> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE}/${bookingId}/complete-client`, {
      method: "POST",
      headers,
    });

    const json = await response.json();

    if (!response.ok || !json?.success) {
      throw new Error(json?.error || "Failed to complete booking");
    }

    return json.data?.booking as Booking;
  },
};
