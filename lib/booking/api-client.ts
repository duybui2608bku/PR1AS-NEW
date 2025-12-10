/**
 * Booking API Client
 * Client-side API wrapper for booking operations using Axios
 */

import { axiosClient } from "@/lib/http/axios-client";
import { getAccessToken } from "@/lib/auth/client-helpers";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import {
  Booking,
  CreateBookingRequest,
  BookingCalculation,
} from "./types";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Booking API Client
 * All methods use Axios for consistent error handling
 */
export const bookingAPI = {
  /**
   * Calculate booking price before creating
   */
  async calculatePrice(
    workerServiceId: string,
    bookingType: "hourly" | "daily" | "weekly" | "monthly",
    durationHours: number
  ): Promise<BookingCalculation> {
    try {
      const accessToken = await getAccessToken();
      const { data } = await axiosClient.post<ApiResponse<{ calculation: BookingCalculation }>>(
        "/booking/calculate",
        {
          worker_service_id: workerServiceId,
          booking_type: bookingType,
          duration_hours: durationHours,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!data.success || !data.data?.calculation) {
        throw new Error(data.error || getErrorMessage(ERROR_MESSAGES.CALCULATE_PRICE_FAILED));
      }

      return data.data.calculation;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.CALCULATE_PRICE_FAILED));
    }
  },

  /**
   * Create a new booking request
   */
  async createBooking(request: CreateBookingRequest): Promise<Booking> {
    try {
      const accessToken = await getAccessToken();
      const { data } = await axiosClient.post<ApiResponse<{ booking: Booking }>>(
        "/booking/create",
        request,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!data.success || !data.data?.booking) {
        throw new Error(data.error || getErrorMessage(ERROR_MESSAGES.CREATE_BOOKING_FAILED));
      }

      return data.data.booking;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.CREATE_BOOKING_FAILED));
    }
  },

  /**
   * Get bookings list with optional filters
   * Uses cookies for authentication (via withCredentials: true in axios config)
   */
  async getBookings(filters?: {
    status?: string[];
    page?: number;
    limit?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<Booking[]> {
    try {
      console.log("[bookingAPI.getBookings] Starting request with filters:", filters);
      
      const params: Record<string, string> = {};

      if (filters?.status && filters.status.length > 0) {
        params.status = filters.status.join(",");
      }
      if (filters?.page) {
        params.page = filters.page.toString();
      }
      if (filters?.limit) {
        params.limit = filters.limit.toString();
      }
      if (filters?.date_from) {
        params.date_from = filters.date_from;
      }
      if (filters?.date_to) {
        params.date_to = filters.date_to;
      }

      console.log("[bookingAPI.getBookings] Making request to /booking/list with params:", params);
      // Note: Authentication is handled via cookies (withCredentials: true)
      // The API route uses requireAuth() middleware which reads from cookies
      const { data } = await axiosClient.get<ApiResponse<{ bookings: Booking[] }>>(
        "/booking/list",
        {
          params,
        }
      );

      console.log("[bookingAPI.getBookings] Received response:", data);

      if (!data.success) {
        const errorMsg = data.error || getErrorMessage(ERROR_MESSAGES.FETCH_BOOKINGS_FAILED);
        console.error("[bookingAPI.getBookings] API returned error:", errorMsg);
        throw new Error(errorMsg);
      }

      const bookings = data.data?.bookings || [];
      console.log("[bookingAPI.getBookings] Returning bookings:", bookings.length);
      return bookings;
    } catch (error) {
      console.error("[bookingAPI.getBookings] Error caught:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.FETCH_BOOKINGS_FAILED));
    }
  },

  /**
   * Worker confirms booking
   */
  async confirmBooking(bookingId: string): Promise<Booking> {
    try {
      const accessToken = await getAccessToken();
      const { data } = await axiosClient.post<ApiResponse<{ booking: Booking }>>(
        `/booking/${bookingId}/confirm`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!data.success || !data.data?.booking) {
        throw new Error(data.error || getErrorMessage(ERROR_MESSAGES.CONFIRM_BOOKING_FAILED));
      }

      return data.data.booking;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.CONFIRM_BOOKING_FAILED));
    }
  },

  /**
   * Worker declines booking
   */
  async declineBooking(bookingId: string): Promise<Booking> {
    try {
      const accessToken = await getAccessToken();
      const { data } = await axiosClient.post<ApiResponse<{ booking: Booking }>>(
        `/booking/${bookingId}/decline`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!data.success || !data.data?.booking) {
        throw new Error(data.error || getErrorMessage(ERROR_MESSAGES.DECLINE_BOOKING_FAILED));
      }

      return data.data.booking;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.DECLINE_BOOKING_FAILED));
    }
  },

  /**
   * Worker marks booking as completed
   */
  async workerCompleteBooking(bookingId: string): Promise<Booking> {
    try {
      const accessToken = await getAccessToken();
      const { data } = await axiosClient.post<ApiResponse<{ booking: Booking }>>(
        `/booking/${bookingId}/complete-worker`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!data.success || !data.data?.booking) {
        throw new Error(data.error || getErrorMessage(ERROR_MESSAGES.COMPLETE_BOOKING_FAILED));
      }

      return data.data.booking;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.COMPLETE_BOOKING_FAILED));
    }
  },

  /**
   * Client confirms completion and releases payment
   */
  async clientCompleteBooking(bookingId: string): Promise<Booking> {
    try {
      const accessToken = await getAccessToken();
      const { data } = await axiosClient.post<ApiResponse<{ booking: Booking }>>(
        `/booking/${bookingId}/complete-client`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!data.success || !data.data?.booking) {
        throw new Error(data.error || getErrorMessage(ERROR_MESSAGES.COMPLETE_BOOKING_FAILED));
      }

      return data.data.booking;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.COMPLETE_BOOKING_FAILED));
    }
  },
};
