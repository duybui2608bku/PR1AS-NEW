/**
 * Common Enums and Constants
 * Centralized enums for commonly used string literals
 */

// =============================================================================
// USER ROLES
// =============================================================================

export enum UserRole {
  ADMIN = 'admin',
  CLIENT = 'client',
  WORKER = 'worker',
}

// =============================================================================
// USER STATUS
// =============================================================================

export enum UserStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
}

// =============================================================================
// WALLET STATUS
// =============================================================================

export enum WalletStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  SUSPENDED = 'suspended',
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  PAYMENT = 'payment',
  EARNING = 'earning',
  PLATFORM_FEE = 'platform_fee',
  INSURANCE_FEE = 'insurance_fee',
  REFUND = 'refund',
  ESCROW_HOLD = 'escrow_hold',
  ESCROW_RELEASE = 'escrow_release',
}

// =============================================================================
// TRANSACTION STATUS
// =============================================================================

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// =============================================================================
// PAYMENT METHODS
// =============================================================================

export enum PaymentMethod {
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  ESCROW = 'escrow',
  INTERNAL = 'internal',
}

// =============================================================================
// ESCROW STATUS
// =============================================================================

export enum EscrowStatus {
  HELD = 'held',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
}

// =============================================================================
// BANK DEPOSIT STATUS
// =============================================================================

export enum BankDepositStatus {
  PENDING = 'pending',
  VERIFYING = 'verifying',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

// =============================================================================
// COMPLAINT RESOLUTION ACTIONS
// =============================================================================

export enum ComplaintResolutionAction {
  RELEASE_TO_WORKER = 'release_to_worker',
  REFUND_TO_EMPLOYER = 'refund_to_employer',
  PARTIAL_REFUND = 'partial_refund',
}

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

// =============================================================================
// ERROR MESSAGES
// =============================================================================

export enum ErrorMessage {
  UNAUTHORIZED = 'Unauthorized',
  NOT_AUTHENTICATED = 'Not authenticated',
  FORBIDDEN = 'Forbidden',
  NOT_FOUND = 'Not found',
  INTERNAL_ERROR = 'Internal server error',
  VALIDATION_ERROR = 'Validation error',
}

// =============================================================================
// COMMON CONSTANTS
// =============================================================================

// =============================================================================
// WORKER PROFILE STATUS
// =============================================================================

export enum WorkerProfileStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
}

// =============================================================================
// AVAILABILITY TYPES
// =============================================================================

export enum AvailabilityType {
  ALL_DAY = 'all_day',
  TIME_RANGE = 'time_range',
  NOT_AVAILABLE = 'not_available',
  CUSTOM = 'custom',    
}

// =============================================================================
// WORKER IMAGE TYPES
// =============================================================================

export enum WorkerImageType {
  AVATAR = 'avatar',
  GALLERY = 'gallery',
}

// =============================================================================
// TAG TYPES
// =============================================================================

export enum TagType {
  INTEREST = 'interest',
  HOBBY = 'hobby',
  SKILL = 'skill',
}

// =============================================================================
// CURRENCIES
// =============================================================================

export enum Currency {
  USD = 'USD',
  VND = 'VND',
  JPY = 'JPY',
  KRW = 'KRW',
  CNY = 'CNY',
}

// =============================================================================
// DAY OF WEEK
// =============================================================================

export enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 7,
}

// =============================================================================
// COMMON CONSTANTS
// =============================================================================

export const DEFAULT_CURRENCY = 'USD';
export const USD_TO_VND_RATE = 24000;
export const DEPOSIT_EXPIRY_MINUTES = 30;
export const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

// Worker pricing constants
export const HOURS_PER_DAY = 8;
export const HOURS_PER_WEEK = 56; // 8 hours × 7 days
export const HOURS_PER_MONTH = 160; // 8 hours × 20 working days
export const MAX_DISCOUNT_PERCENT = 100;
export const DEFAULT_PLATFORM_FEE_PERCENT = 10;
export const DEFAULT_INSURANCE_FEE_PERCENT = 2;

