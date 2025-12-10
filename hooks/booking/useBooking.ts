/**
 * React Query hooks for Booking operations
 * Uses useMutation and useQuery for data fetching and mutations
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingAPI } from "@/lib/booking/api-client";
import { showMessage } from "@/lib/utils/toast";
import type {
  Booking,
  CreateBookingRequest,
  BookingCalculation,
} from "@/lib/booking/types";

/**
 * Query keys for React Query caching
 */
export const bookingKeys = {
  all: ["bookings"] as const,
  lists: () => [...bookingKeys.all, "list"] as const,
  list: (filters?: Record<string, any>) =>
    [...bookingKeys.lists(), { filters }] as const,
  detail: (id: string) => [...bookingKeys.all, "detail", id] as const,
  calculation: (params: {
    workerServiceId: string;
    bookingType: string;
    durationHours: number;
  }) => [...bookingKeys.all, "calculation", params] as const,
};

/**
 * Fetch bookings list
 */
export function useBookings(filters?: {
  status?: string[];
  page?: number;
  limit?: number;
  date_from?: string;
  date_to?: string;
}) {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: async () => {
      try {
        console.log("[useBookings] Fetching bookings with filters:", filters);
        const result = await bookingAPI.getBookings(filters);
        console.log("[useBookings] Successfully fetched bookings:", result.length);
        return result;
      } catch (error) {
        console.error("[useBookings] Error fetching bookings:", error);
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1, // Only retry once on failure
  });
}

/**
 * Calculate booking price
 */
export function useCalculatePrice() {
  return useMutation({
    mutationFn: ({
      workerServiceId,
      bookingType,
      durationHours,
    }: {
      workerServiceId: string;
      bookingType: "hourly" | "daily" | "weekly" | "monthly";
      durationHours: number;
    }) => bookingAPI.calculatePrice(workerServiceId, bookingType, durationHours),
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to calculate price");
    },
  });
}

/**
 * Create a new booking
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateBookingRequest) =>
      bookingAPI.createBooking(request),
    onSuccess: () => {
      // Invalidate and refetch bookings list
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      showMessage.success("Booking created successfully");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to create booking");
    },
  });
}

/**
 * Confirm booking (Worker action)
 */
export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingAPI.confirmBooking(bookingId),
    onSuccess: (data) => {
      // Update specific booking in cache
      queryClient.setQueryData(bookingKeys.detail(data.id), data);
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      showMessage.success("Booking confirmed successfully");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to confirm booking");
    },
  });
}

/**
 * Decline booking (Worker action)
 */
export function useDeclineBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => bookingAPI.declineBooking(bookingId),
    onSuccess: (data) => {
      queryClient.setQueryData(bookingKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      showMessage.success("Booking declined");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to decline booking");
    },
  });
}

/**
 * Complete booking (Worker marks as done)
 */
export function useWorkerCompleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) =>
      bookingAPI.workerCompleteBooking(bookingId),
    onSuccess: (data) => {
      queryClient.setQueryData(bookingKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      showMessage.success("Booking marked as completed");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to complete booking");
    },
  });
}

/**
 * Complete booking (Client confirms and releases payment)
 */
export function useClientCompleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) =>
      bookingAPI.clientCompleteBooking(bookingId),
    onSuccess: (data) => {
      queryClient.setQueryData(bookingKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      showMessage.success("Booking completed and payment released");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to complete booking");
    },
  });
}
