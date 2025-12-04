/**
 * Error Message Constants
 * Centralized error messages that can be used with i18n
 * These keys map to message files (messages/{lang}.json)
 */

/**
 * Error message keys for i18n
 * These should be added to message files under errors.api.*
 */
export const ERROR_MESSAGES = {
  // Authentication & Authorization
  UNAUTHORIZED: "errors.api.unauthorized",
  INVALID_TOKEN: "errors.api.invalidToken",
  TOKEN_EXPIRED: "errors.api.tokenExpired",
  FORBIDDEN: "errors.api.forbidden",
  ADMIN_REQUIRED: "errors.api.adminRequired",
  ROLE_REQUIRED: "errors.api.roleRequired",

  // User & Profile
  USER_NOT_FOUND: "errors.api.userNotFound",
  PROFILE_NOT_FOUND: "errors.api.profileNotFound",
  NO_PROFILE: "errors.api.noProfile",
  NO_PROFILE_NO_ROLE: "errors.api.noProfileNoRole",
  PROFILE_ALREADY_EXISTS: "errors.api.profileAlreadyExists",
  ACCOUNT_BANNED: "errors.api.accountBanned",
  EMAIL_ALREADY_REGISTERED: "errors.api.emailAlreadyRegistered",
  EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE:
    "errors.api.emailAlreadyRegisteredWithDifferentRole",

  // Validation
  VALIDATION_ERROR: "errors.api.validationError",
  MISSING_REQUIRED_FIELDS: "errors.api.missingRequiredFields",
  INVALID_ROLE: "errors.api.invalidRole",
  INVALID_INPUT: "errors.api.invalidInput",

  // Wallet & Transactions
  INSUFFICIENT_BALANCE: "errors.api.insufficientBalance",
  INVALID_PAYMENT_METHOD: "errors.api.invalidPaymentMethod",
  TRANSACTION_FAILED: "errors.api.transactionFailed",
  ESCROW_NOT_FOUND: "errors.api.escrowNotFound",
  ESCROW_ID_REQUIRED: "errors.api.escrowIdRequired",

  // Booking
  BOOKING_NOT_FOUND: "errors.api.bookingNotFound",
  BOOKING_ALREADY_CONFIRMED: "errors.api.bookingAlreadyConfirmed",
  BOOKING_ALREADY_DECLINED: "errors.api.bookingAlreadyDeclined",
  ONLY_CLIENTS_CAN_CREATE: "errors.api.onlyClientsCanCreate",
  ONLY_WORKERS_CAN_CONFIRM: "errors.api.onlyWorkersCanConfirm",
  ONLY_WORKERS_CAN_DECLINE: "errors.api.onlyWorkersCanDecline",
  ONLY_CLIENTS_CAN_COMPLETE: "errors.api.onlyClientsCanComplete",
  ONLY_WORKERS_CAN_COMPLETE: "errors.api.onlyWorkersCanComplete",

  // Worker Profile
  WORKER_PROFILE_NOT_FOUND: "errors.api.workerProfileNotFound",
  WORKER_PROFILE_NOT_PUBLISHED: "errors.api.workerProfileNotPublished",

  // File Upload
  NO_FILE_PROVIDED: "errors.api.noFileProvided",
  FILE_TOO_LARGE: "errors.api.fileTooLarge",
  INVALID_FILE_TYPE: "errors.api.invalidFileType",
  UPLOAD_FAILED: "errors.api.uploadFailed",
  DELETE_FAILED: "errors.api.deleteFailed",

  // General
  INTERNAL_ERROR: "errors.api.internalError",
  OPERATION_FAILED: "errors.api.operationFailed",
  NOT_FOUND: "errors.api.notFound",
} as const;

/**
 * Fallback error messages (English)
 * Used when i18n is not available or key is missing
 */
export const ERROR_MESSAGES_FALLBACK: Record<string, string> = {
  [ERROR_MESSAGES.UNAUTHORIZED]: "Unauthorized",
  [ERROR_MESSAGES.INVALID_TOKEN]: "Invalid or expired token",
  [ERROR_MESSAGES.TOKEN_EXPIRED]: "Token has expired",
  [ERROR_MESSAGES.FORBIDDEN]: "Forbidden",
  [ERROR_MESSAGES.ADMIN_REQUIRED]: "Admin access required",
  [ERROR_MESSAGES.ROLE_REQUIRED]: "Role access required",

  [ERROR_MESSAGES.USER_NOT_FOUND]: "User not found",
  [ERROR_MESSAGES.PROFILE_NOT_FOUND]: "Profile not found",
  [ERROR_MESSAGES.NO_PROFILE]: "No profile found",
  [ERROR_MESSAGES.NO_PROFILE_NO_ROLE]: "Profile not found. Please select a role.",
  [ERROR_MESSAGES.PROFILE_ALREADY_EXISTS]: "Profile already exists",
  [ERROR_MESSAGES.ACCOUNT_BANNED]: "Account is banned",
  [ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED]: "Email already registered",
  [ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE]:
    "Email already registered with different role",

  [ERROR_MESSAGES.VALIDATION_ERROR]: "Validation error",
  [ERROR_MESSAGES.MISSING_REQUIRED_FIELDS]: "Missing required fields",
  [ERROR_MESSAGES.INVALID_ROLE]: "Invalid role",
  [ERROR_MESSAGES.INVALID_INPUT]: "Invalid input",

  [ERROR_MESSAGES.INSUFFICIENT_BALANCE]: "Insufficient balance",
  [ERROR_MESSAGES.INVALID_PAYMENT_METHOD]: "Invalid payment method",
  [ERROR_MESSAGES.TRANSACTION_FAILED]: "Transaction failed",
  [ERROR_MESSAGES.ESCROW_NOT_FOUND]: "Escrow not found",
  [ERROR_MESSAGES.ESCROW_ID_REQUIRED]: "Escrow ID is required",

  [ERROR_MESSAGES.BOOKING_NOT_FOUND]: "Booking not found",
  [ERROR_MESSAGES.BOOKING_ALREADY_CONFIRMED]: "Booking already confirmed",
  [ERROR_MESSAGES.BOOKING_ALREADY_DECLINED]: "Booking already declined",
  [ERROR_MESSAGES.ONLY_CLIENTS_CAN_CREATE]: "Only clients can create bookings",
  [ERROR_MESSAGES.ONLY_WORKERS_CAN_CONFIRM]: "Only workers can confirm bookings",
  [ERROR_MESSAGES.ONLY_WORKERS_CAN_DECLINE]: "Only workers can decline bookings",
  [ERROR_MESSAGES.ONLY_CLIENTS_CAN_COMPLETE]:
    "Only clients can confirm completion",
  [ERROR_MESSAGES.ONLY_WORKERS_CAN_COMPLETE]: "Only workers can complete bookings",

  [ERROR_MESSAGES.WORKER_PROFILE_NOT_FOUND]: "Worker profile not found",
  [ERROR_MESSAGES.WORKER_PROFILE_NOT_PUBLISHED]:
    "Worker profile not found or not published",

  [ERROR_MESSAGES.NO_FILE_PROVIDED]: "No file provided",
  [ERROR_MESSAGES.FILE_TOO_LARGE]: "File size exceeds 5MB limit",
  [ERROR_MESSAGES.INVALID_FILE_TYPE]: "Invalid file type",
  [ERROR_MESSAGES.UPLOAD_FAILED]: "Failed to upload file",
  [ERROR_MESSAGES.DELETE_FAILED]: "Failed to delete file",

  [ERROR_MESSAGES.INTERNAL_ERROR]: "Internal server error",
  [ERROR_MESSAGES.OPERATION_FAILED]: "Operation failed",
  [ERROR_MESSAGES.NOT_FOUND]: "Not found",
};

/**
 * Get error message (with fallback)
 * In the future, this can be enhanced to use i18n
 */
export function getErrorMessage(key: string): string {
  return ERROR_MESSAGES_FALLBACK[key] || key;
}

