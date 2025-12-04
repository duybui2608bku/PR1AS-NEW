/**
 * Booking System Type Definitions
 * Types for booking management between clients and workers
 */

// =============================================================================
// BOOKING TYPES
// =============================================================================

export type BookingType = 'hourly' | 'daily' | 'weekly' | 'monthly';

export type BookingStatus =
  | 'pending_worker_confirmation'  // Client created, waiting for worker
  | 'worker_confirmed'              // Worker accepted, payment deducted
  | 'worker_declined'               // Worker declined
  | 'in_progress'                   // Service is being performed
  | 'worker_completed'              // Worker marked as completed
  | 'client_completed'              // Client confirmed completion, payment released
  | 'cancelled'                     // Cancelled by either party
  | 'disputed';                     // Dispute filed

export interface Booking {
  id: string;
  client_id: string;
  worker_id: string;
  worker_service_id?: string;
  service_id?: string;
  booking_type: BookingType;
  duration_hours: number;
  start_date: string;
  end_date?: string;
  location?: string;
  special_instructions?: string;
  hourly_rate_usd: number;
  total_amount_usd: number;
  discount_percent: number;
  final_amount_usd: number;
  status: BookingStatus;
  escrow_id?: string;
  payment_transaction_id?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  worker_completed_at?: string;
  client_completed_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// BOOKING REQUEST TYPES
// =============================================================================

export interface CreateBookingRequest {
  worker_id: string;
  worker_service_id: string;
  booking_type: BookingType;
  duration_hours: number;
  start_date: string;
  end_date?: string;
  location?: string;
  special_instructions?: string;
}

export interface BookingCalculation {
  hourly_rate_usd: number;
  total_amount_usd: number;
  discount_percent: number;
  final_amount_usd: number;
  can_afford: boolean;
  client_balance: number;
  required_amount: number;
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export type NotificationType =
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_declined'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'payment_received'
  | 'payment_released'
  | 'escrow_released'
  | 'system_announcement';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  related_booking_id?: string;
  related_transaction_id?: string;
  related_escrow_id?: string;
  created_at: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface BookingResponse {
  success: boolean;
  booking: Booking;
  message?: string;
}

export interface BookingListResponse {
  success: boolean;
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
}

export interface BookingCalculationResponse {
  success: boolean;
  calculation: BookingCalculation;
}

export interface NotificationResponse {
  success: boolean;
  notification: Notification;
}

export interface NotificationListResponse {
  success: boolean;
  notifications: Notification[];
  unread_count: number;
  total: number;
}

// =============================================================================
// QUERY FILTERS
// =============================================================================

export interface BookingFilters {
  client_id?: string;
  worker_id?: string;
  status?: BookingStatus[];
  booking_type?: BookingType[];
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface NotificationFilters {
  user_id?: string;
  type?: NotificationType[];
  is_read?: boolean;
  page?: number;
  limit?: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export class BookingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'BookingError';
  }
}

export const BookingErrorCodes = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  INVALID_BOOKING_STATUS: 'INVALID_BOOKING_STATUS',
  BOOKING_ALREADY_CONFIRMED: 'BOOKING_ALREADY_CONFIRMED',
  BOOKING_ALREADY_DECLINED: 'BOOKING_ALREADY_DECLINED',
  BOOKING_ALREADY_CANCELLED: 'BOOKING_ALREADY_CANCELLED',
  INVALID_DURATION: 'INVALID_DURATION',
  INVALID_DATE: 'INVALID_DATE',
  WORKER_SERVICE_NOT_FOUND: 'WORKER_SERVICE_NOT_FOUND',
  WORKER_NOT_FOUND: 'WORKER_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  BOOKING_CREATION_FAILED: 'BOOKING_CREATION_FAILED',
} as const;

