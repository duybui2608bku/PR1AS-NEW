/**
 * Booking Service
 * Business logic for booking management
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  Booking,
  BookingStatus,
  BookingType,
  CreateBookingRequest,
  BookingCalculation,
  BookingFilters,
  BookingError,
  BookingErrorCodes,
} from "./types";
import { WalletService } from "@/lib/wallet/service";
import { PaymentRequest } from "@/lib/wallet/types";

export class BookingService {
  constructor(private supabase: SupabaseClient<any>) {}

  // ===========================================================================
  // BOOKING CALCULATION
  // ===========================================================================

  /**
   * Calculate booking price based on type and duration
   */
  async calculateBookingPrice(
    clientId: string,
    workerServiceId: string,
    bookingType: BookingType,
    durationHours: number
  ): Promise<BookingCalculation> {
    // Get worker service with pricing
    const { data: workerService, error: serviceError } = await this.supabase
      .from("worker_services")
      .select(
        `
        *,
        pricing:worker_service_prices(*)
      `
      )
      .eq("id", workerServiceId)
      .eq("is_active", true)
      .single();

    if (serviceError || !workerService) {
      throw new BookingError(
        "Worker service not found",
        BookingErrorCodes.WORKER_SERVICE_NOT_FOUND,
        404
      );
    }

    // Pricing is now accessed via the alias
    const pricing = Array.isArray(workerService.pricing)
      ? workerService.pricing[0]
      : workerService.pricing;

    if (!pricing) {
      throw new BookingError(
        "Pricing not found for this service",
        BookingErrorCodes.WORKER_SERVICE_NOT_FOUND,
        404
      );
    }

    // Calculate base amount
    const hourlyRate = Number(pricing.price_usd);
    let totalAmount = hourlyRate * durationHours;
    let discountPercent = 0;

    // Apply discounts based on booking type
    if (bookingType === "daily" && pricing.daily_discount_percent) {
      discountPercent = Number(pricing.daily_discount_percent);
    } else if (bookingType === "weekly" && pricing.weekly_discount_percent) {
      discountPercent = Number(pricing.weekly_discount_percent);
    } else if (bookingType === "monthly" && pricing.monthly_discount_percent) {
      discountPercent = Number(pricing.monthly_discount_percent);
    }

    const discountAmount = totalAmount * (discountPercent / 100);
    const finalAmount = totalAmount - discountAmount;

    // Check client balance
    const walletService = new WalletService(this.supabase);
    const wallet = await walletService.getOrCreateWallet(clientId);
    // Ensure balance_usd is converted to number for comparison
    const clientBalance = Number(wallet.balance_usd) || 0;
    const canAfford = clientBalance >= finalAmount;

    return {
      hourly_rate_usd: hourlyRate,
      total_amount_usd: totalAmount,
      discount_percent: discountPercent,
      final_amount_usd: finalAmount,
      can_afford: canAfford,
      client_balance: clientBalance,
      required_amount: finalAmount,
    };
  }

  // ===========================================================================
  // BOOKING CREATION
  // ===========================================================================

  /**
   * Create a new booking request
   */
  async createBooking(
    clientId: string,
    request: CreateBookingRequest
  ): Promise<Booking> {
    // Validate duration
    if (request.duration_hours <= 0) {
      throw new BookingError(
        "Invalid duration",
        BookingErrorCodes.INVALID_DURATION,
        400
      );
    }

    // Validate dates
    const startDate = new Date(request.start_date);
    if (isNaN(startDate.getTime()) || startDate < new Date()) {
      throw new BookingError(
        "Invalid start date",
        BookingErrorCodes.INVALID_DATE,
        400
      );
    }

    // Validate end_date if provided
    if (request.end_date) {
      const endDate = new Date(request.end_date);
      if (isNaN(endDate.getTime())) {
        throw new BookingError(
          "Invalid end date",
          BookingErrorCodes.INVALID_DATE,
          400
        );
      }
      if (endDate <= startDate) {
        throw new BookingError(
          "End date must be after start date",
          BookingErrorCodes.INVALID_DATE,
          400
        );
      }
    }

    // Calculate price and check balance
    const calculation = await this.calculateBookingPrice(
      clientId,
      request.worker_service_id,
      request.booking_type,
      request.duration_hours
    );

    if (!calculation.can_afford) {
      throw new BookingError(
        `Insufficient balance. Required: $${calculation.required_amount.toFixed(
          2
        )}, Available: $${calculation.client_balance.toFixed(2)}`,
        BookingErrorCodes.INSUFFICIENT_BALANCE,
        400
      );
    }

    // Validate worker profile & underlying user (request.worker_id carries worker_profile.id from UI)
    const { data: workerProfile, error: workerProfileError } =
      await this.supabase
        .from("worker_profiles")
        .select("id, user_id")
        .eq("id", request.worker_id)
        .maybeSingle();

    if (workerProfileError) {
      throw new BookingError(
        `Worker not found: ${workerProfileError.message || "Database error"}`,
        BookingErrorCodes.WORKER_NOT_FOUND,
        404
      );
    }

    if (!workerProfile) {
      throw new BookingError(
        "Worker not found. The worker may not have a profile yet.",
        BookingErrorCodes.WORKER_NOT_FOUND,
        404
      );
    }

    // Load the associated user profile to validate role & status
    const { data: workerUserProfile, error: workerUserProfileError } =
      await this.supabase
        .from("user_profiles")
        .select("role, status")
        .eq("id", workerProfile.user_id)
        .maybeSingle();

    if (workerUserProfileError) {
      throw new BookingError(
        `Worker not found: ${
          workerUserProfileError.message || "Database error"
        }`,
        BookingErrorCodes.WORKER_NOT_FOUND,
        404
      );
    }

    if (!workerUserProfile) {
      throw new BookingError(
        "Worker not found. The worker may not have a profile yet.",
        BookingErrorCodes.WORKER_NOT_FOUND,
        404
      );
    }

    if (workerUserProfile.role !== "worker") {
      throw new BookingError(
        "Invalid worker. The specified user is not a worker",
        BookingErrorCodes.WORKER_NOT_FOUND,
        400
      );
    }

    if (workerUserProfile.status === "banned") {
      throw new BookingError(
        "Worker account is banned",
        BookingErrorCodes.WORKER_NOT_FOUND,
        403
      );
    }

    // Get worker service to get service_id and verify it belongs to this worker
    const { data: workerService, error: workerServiceError } =
      await this.supabase
        .from("worker_services")
        .select("service_id, worker_profile_id")
        .eq("id", request.worker_service_id)
        .maybeSingle();

    if (workerServiceError) {
      throw new BookingError(
        `Worker service not found: ${
          workerServiceError.message || "Database error"
        }`,
        BookingErrorCodes.WORKER_SERVICE_NOT_FOUND,
        404
      );
    }

    if (!workerService) {
      throw new BookingError(
        "Worker service not found",
        BookingErrorCodes.WORKER_SERVICE_NOT_FOUND,
        404
      );
    }

    // Verify the worker service belongs to the specified worker profile
    // At this point, request.worker_id is the worker_profile.id we already loaded above
    if (workerService.worker_profile_id !== workerProfile.id) {
      throw new BookingError(
        "Worker service does not belong to the specified worker",
        BookingErrorCodes.WORKER_SERVICE_NOT_FOUND,
        400
      );
    }

    // Load client profile to store stable display info (email, name, avatar) in metadata
    const { data: clientProfile } = await this.supabase
      .from("user_profiles")
      .select("email, full_name, avatar_url")
      .eq("id", clientId)
      .maybeSingle();

    // Create booking
    // Note: bookings.worker_id references auth.users(id), so we must use workerProfile.user_id here,
    // NOT the worker_profiles.id that comes from the UI.
    const { data: booking, error: bookingError } = await this.supabase
      .from("bookings")
      .insert({
        client_id: clientId,
        worker_id: workerProfile.user_id,
        worker_service_id: request.worker_service_id,
        service_id: workerService?.service_id,
        booking_type: request.booking_type,
        duration_hours: request.duration_hours,
        start_date: request.start_date,
        end_date: request.end_date,
        location: request.location,
        special_instructions: request.special_instructions,
        hourly_rate_usd: calculation.hourly_rate_usd,
        total_amount_usd: calculation.total_amount_usd,
        discount_percent: calculation.discount_percent,
        final_amount_usd: calculation.final_amount_usd,
        status: "pending_worker_confirmation",
        metadata: clientProfile
          ? {
              client_email: clientProfile.email,
              client_name: clientProfile.full_name,
              client_avatar_url: clientProfile.avatar_url,
            }
          : undefined,
      })
      .select()
      .single();

    if (bookingError) {
      throw new BookingError(
        `Failed to create booking: ${bookingError.message || "Database error"}`,
        BookingErrorCodes.BOOKING_CREATION_FAILED,
        500
      );
    }

    return booking as Booking;
  }

  // ===========================================================================
  // BOOKING CONFIRMATION
  // ===========================================================================

  /**
   * Worker confirms booking - deducts payment and creates escrow
   */
  async confirmBooking(bookingId: string, workerId: string): Promise<Booking> {
    // Get booking
    const { data: booking, error: bookingError } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new BookingError(
        "Booking not found",
        BookingErrorCodes.BOOKING_NOT_FOUND,
        404
      );
    }

    // Verify worker owns this booking
    if (booking.worker_id !== workerId) {
      throw new BookingError(
        "Unauthorized",
        BookingErrorCodes.UNAUTHORIZED,
        403
      );
    }

    // Check status
    if (booking.status !== "pending_worker_confirmation") {
      throw new BookingError(
        `Booking cannot be confirmed. Current status: ${booking.status}`,
        BookingErrorCodes.INVALID_BOOKING_STATUS,
        400
      );
    }

    // Process payment and create escrow
    const walletService = new WalletService(this.supabase);
    const paymentRequest: PaymentRequest = {
      employer_id: booking.client_id,
      worker_id: booking.worker_id,
      job_id: booking.id,
      amount_usd: booking.final_amount_usd,
      description: `Payment for booking ${booking.id}`,
    };

    try {
      const { escrow, transaction } = await walletService.processPayment(
        paymentRequest
      );

      // Update booking
      const { data: updatedBooking, error: updateError } = await this.supabase
        .from("bookings")
        .update({
          status: "worker_confirmed",
          escrow_id: escrow.id,
          payment_transaction_id: transaction.id,
        })
        .eq("id", bookingId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return updatedBooking as Booking;
    } catch (error) {
      // If payment fails, booking remains in pending status
      throw error;
    }
  }

  // ===========================================================================
  // BOOKING DECLINE
  // ===========================================================================

  /**
   * Worker declines booking
   */
  async declineBooking(bookingId: string, workerId: string): Promise<Booking> {
    // Get booking
    const { data: booking, error: bookingError } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new BookingError(
        "Booking not found",
        BookingErrorCodes.BOOKING_NOT_FOUND,
        404
      );
    }

    // Verify worker owns this booking
    if (booking.worker_id !== workerId) {
      throw new BookingError(
        "Unauthorized",
        BookingErrorCodes.UNAUTHORIZED,
        403
      );
    }

    // Check status
    if (booking.status !== "pending_worker_confirmation") {
      throw new BookingError(
        `Booking cannot be declined. Current status: ${booking.status}`,
        BookingErrorCodes.INVALID_BOOKING_STATUS,
        400
      );
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await this.supabase
      .from("bookings")
      .update({
        status: "worker_declined",
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      throw new BookingError(
        "Failed to decline booking",
        BookingErrorCodes.BOOKING_NOT_FOUND,
        500
      );
    }

    return updatedBooking as Booking;
  }

  // ===========================================================================
  // BOOKING COMPLETION
  // ===========================================================================

  /**
   * Worker marks booking as completed
   */
  async workerCompleteBooking(
    bookingId: string,
    workerId: string
  ): Promise<Booking> {
    const { data: booking, error: bookingError } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new BookingError(
        "Booking not found",
        BookingErrorCodes.BOOKING_NOT_FOUND,
        404
      );
    }

    if (booking.worker_id !== workerId) {
      throw new BookingError(
        "Unauthorized",
        BookingErrorCodes.UNAUTHORIZED,
        403
      );
    }

    if (
      booking.status !== "worker_confirmed" &&
      booking.status !== "in_progress"
    ) {
      throw new BookingError(
        `Booking cannot be completed. Current status: ${booking.status}`,
        BookingErrorCodes.INVALID_BOOKING_STATUS,
        400
      );
    }

    const { data: updatedBooking, error: updateError } = await this.supabase
      .from("bookings")
      .update({
        status: "worker_completed",
        worker_completed_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      throw new BookingError(
        "Failed to complete booking",
        BookingErrorCodes.BOOKING_NOT_FOUND,
        500
      );
    }

    return updatedBooking as Booking;
  }

  /**
   * Client confirms completion and releases payment
   */
  async clientCompleteBooking(
    bookingId: string,
    clientId: string
  ): Promise<Booking> {
    const { data: booking, error: bookingError } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new BookingError(
        "Booking not found",
        BookingErrorCodes.BOOKING_NOT_FOUND,
        404
      );
    }

    if (booking.client_id !== clientId) {
      throw new BookingError(
        "Unauthorized",
        BookingErrorCodes.UNAUTHORIZED,
        403
      );
    }

    if (booking.status !== "worker_completed") {
      throw new BookingError(
        `Booking cannot be confirmed. Current status: ${booking.status}`,
        BookingErrorCodes.INVALID_BOOKING_STATUS,
        400
      );
    }

    if (!booking.escrow_id) {
      throw new BookingError(
        "Escrow not found for this booking",
        BookingErrorCodes.BOOKING_NOT_FOUND,
        404
      );
    }

    // Release escrow
    const walletService = new WalletService(this.supabase);
    await walletService.releaseEscrow(booking.escrow_id);

    // Update booking
    const { data: updatedBooking, error: updateError } = await this.supabase
      .from("bookings")
      .update({
        status: "client_completed",
        client_completed_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      throw new BookingError(
        "Failed to complete booking",
        BookingErrorCodes.BOOKING_NOT_FOUND,
        500
      );
    }

    return updatedBooking as Booking;
  }

  // ===========================================================================
  // BOOKING CANCELLATION
  // ===========================================================================

  /**
   * Cancel booking (can be done by client or worker)
   */
  async cancelBooking(
    bookingId: string,
    userId: string,
    reason?: string
  ): Promise<Booking> {
    const { data: booking, error: bookingError } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new BookingError(
        "Booking not found",
        BookingErrorCodes.BOOKING_NOT_FOUND,
        404
      );
    }

    // Verify user is client or worker
    if (booking.client_id !== userId && booking.worker_id !== userId) {
      throw new BookingError(
        "Unauthorized",
        BookingErrorCodes.UNAUTHORIZED,
        403
      );
    }

    // Check if booking can be cancelled
    const cancellableStatuses: BookingStatus[] = [
      "pending_worker_confirmation",
      "worker_confirmed",
      "in_progress",
    ];

    if (!cancellableStatuses.includes(booking.status)) {
      throw new BookingError(
        `Booking cannot be cancelled. Current status: ${booking.status}`,
        BookingErrorCodes.INVALID_BOOKING_STATUS,
        400
      );
    }

    // If payment was made, refund it
    if (booking.escrow_id && booking.status !== "pending_worker_confirmation") {
      const walletService = new WalletService(this.supabase);
      // Refund logic would go here - for now, we'll just mark as cancelled
      // In production, you'd want to refund the escrow
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await this.supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_by: userId,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      throw new BookingError(
        "Failed to cancel booking",
        BookingErrorCodes.BOOKING_NOT_FOUND,
        500
      );
    }

    return updatedBooking as Booking;
  }

  // ===========================================================================
  // BOOKING QUERIES
  // ===========================================================================

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string): Promise<Booking | null> {
    const { data, error } = await this.supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Booking;
  }

  /**
   * Get bookings with filters
   */
  async getBookings(filters: BookingFilters = {}): Promise<Booking[]> {
    // Join with services table to get service name_key for better UI display
    // Result shape: { ..., service: { name_key } }
    let query = this.supabase
      .from("bookings")
      .select("*, service:services(name_key)");

    if (filters.client_id) {
      query = query.eq("client_id", filters.client_id);
    }

    if (filters.worker_id) {
      query = query.eq("worker_id", filters.worker_id);
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in("status", filters.status);
    }

    if (filters.booking_type && filters.booking_type.length > 0) {
      query = query.in("booking_type", filters.booking_type);
    }

    if (filters.date_from) {
      query = query.gte("start_date", filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte("start_date", filters.date_to);
    }

    query = query.order("created_at", { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
      if (filters.page) {
        query = query.range(
          (filters.page - 1) * filters.limit,
          filters.page * filters.limit - 1
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new BookingError(
        "Failed to fetch bookings",
        BookingErrorCodes.BOOKING_NOT_FOUND,
        500
      );
    }

    const rows = (data || []) as any[];

    // -------------------------------------------------------------------------
    // ENRICH METADATA FOR BETTER UI DISPLAY
    // -------------------------------------------------------------------------

    // If the caller is a client viewing their own bookings,
    // we can safely fetch their profile (RLS allows auth.uid() = client_id)
    // and inject stable client info into metadata for display.
    let clientEmailForClientView: string | undefined;
    let clientNameForClientView: string | undefined;
    let clientAvatarForClientView: string | undefined;
    if (filters.client_id) {
      const { data: clientProfile } = await this.supabase
        .from("user_profiles")
        .select("email, full_name, avatar_url")
        .eq("id", filters.client_id)
        .maybeSingle();

      clientEmailForClientView = clientProfile?.email || undefined;
      clientNameForClientView = clientProfile?.full_name || undefined;
      clientAvatarForClientView = clientProfile?.avatar_url || undefined;
    }

    // If the caller is a worker viewing their bookings,
    // try to backfill client info (email, name, avatar) for each booking based on client_id.
    // NOTE: This relies on RLS allowing workers to see basic client info.
    let clientProfileMap:
      | Map<string, { email?: string; full_name?: string; avatar_url?: string }>
      | undefined;
    if (filters.worker_id && rows.length > 0) {
      const clientIds = Array.from(
        new Set(
          rows.map((row) => row.client_id as string | undefined).filter(Boolean)
        )
      );

      if (clientIds.length > 0) {
        const { data: clientProfiles } = await this.supabase
          .from("user_profiles")
          .select("id, email, full_name, avatar_url")
          .in("id", clientIds);

        if (clientProfiles && clientProfiles.length > 0) {
          clientProfileMap = new Map(
            clientProfiles
              .filter((p: any) => p?.id)
              .map((p: any) => [
                p.id as string,
                {
                  email: p.email as string | undefined,
                  full_name: p.full_name as string | undefined,
                  avatar_url: p.avatar_url as string | undefined,
                },
              ])
          );
        }
      }
    }

    // Map joined info into booking.metadata for frontend (non-breaking)
    return rows.map((row) => {
      const serviceNameKey = row.service?.name_key as string | undefined;

      const existingMetadata = (row.metadata || {}) as Record<string, unknown>;

      const metadata: Record<string, unknown> = {
        ...existingMetadata,
      };

      if (serviceNameKey && !metadata.service_name_key) {
        metadata.service_name_key = serviceNameKey;
      }

      // For client side, backfill client info into existing bookings
      if (clientEmailForClientView && !metadata.client_email) {
        metadata.client_email = clientEmailForClientView;
      }
      if (clientNameForClientView && !metadata.client_name) {
        metadata.client_name = clientNameForClientView;
      }
      if (clientAvatarForClientView && !metadata.client_avatar_url) {
        metadata.client_avatar_url = clientAvatarForClientView;
      }

      // For worker side, try to attach client info using the map above
      if (clientProfileMap) {
        const clientId = row.client_id as string | undefined;
        const profile = clientId ? clientProfileMap.get(clientId) : undefined;

        if (profile) {
          if (!metadata.client_email && profile.email) {
            metadata.client_email = profile.email;
          }
          if (!metadata.client_name && profile.full_name) {
            metadata.client_name = profile.full_name;
          }
          if (!metadata.client_avatar_url && profile.avatar_url) {
            metadata.client_avatar_url = profile.avatar_url;
          }
        }
      }

      return {
        ...row,
        metadata,
      } as Booking;
    });
  }
}
