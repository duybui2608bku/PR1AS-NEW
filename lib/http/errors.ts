/**
 * Centralized Error Handling
 * Provides consistent error handling and error code constants
 */

import { NextRequest, NextResponse } from "next/server";
import { HttpStatus } from "@/lib/utils/enums";
import {
  errorResponse,
  internalErrorResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "./response";
import { errorTracker } from "@/lib/utils/error-tracker";

/**
 * Error codes used across the application
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  FORBIDDEN = "FORBIDDEN",
  ADMIN_REQUIRED = "ADMIN_REQUIRED",
  ROLE_REQUIRED = "ROLE_REQUIRED",

  // User & Profile
  USER_NOT_FOUND = "USER_NOT_FOUND",
  PROFILE_NOT_FOUND = "PROFILE_NOT_FOUND",
  NO_PROFILE = "NO_PROFILE",
  NO_PROFILE_NO_ROLE = "NO_PROFILE_NO_ROLE",
  PROFILE_ALREADY_EXISTS = "PROFILE_ALREADY_EXISTS",
  ACCOUNT_BANNED = "ACCOUNT_BANNED",
  EMAIL_ALREADY_REGISTERED = "EMAIL_ALREADY_REGISTERED",
  EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE = "EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELDS = "MISSING_REQUIRED_FIELDS",
  INVALID_ROLE = "INVALID_ROLE",
  INVALID_INPUT = "INVALID_INPUT",
  WEAK_PASSWORD = "WEAK_PASSWORD",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",

  // Wallet & Transactions
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",
  INVALID_PAYMENT_METHOD = "INVALID_PAYMENT_METHOD",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  ESCROW_NOT_FOUND = "ESCROW_NOT_FOUND",
  ESCROW_ID_REQUIRED = "ESCROW_ID_REQUIRED",

  // Booking
  BOOKING_NOT_FOUND = "BOOKING_NOT_FOUND",
  BOOKING_ALREADY_CONFIRMED = "BOOKING_ALREADY_CONFIRMED",
  BOOKING_ALREADY_DECLINED = "BOOKING_ALREADY_DECLINED",
  ONLY_CLIENTS_CAN_CREATE = "ONLY_CLIENTS_CAN_CREATE",
  ONLY_WORKERS_CAN_CONFIRM = "ONLY_WORKERS_CAN_CONFIRM",
  ONLY_WORKERS_CAN_DECLINE = "ONLY_WORKERS_CAN_DECLINE",
  ONLY_CLIENTS_CAN_COMPLETE = "ONLY_CLIENTS_CAN_COMPLETE",
  ONLY_WORKERS_CAN_COMPLETE = "ONLY_WORKERS_CAN_COMPLETE",

  // Worker Profile
  WORKER_PROFILE_NOT_FOUND = "WORKER_PROFILE_NOT_FOUND",
  WORKER_PROFILE_NOT_PUBLISHED = "WORKER_PROFILE_NOT_PUBLISHED",
  CONCURRENT_UPDATE_ERROR = "CONCURRENT_UPDATE_ERROR",

  // File Upload
  NO_FILE_PROVIDED = "NO_FILE_PROVIDED",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  UPLOAD_FAILED = "UPLOAD_FAILED",
  DELETE_FAILED = "DELETE_FAILED",

  // General
  INTERNAL_ERROR = "INTERNAL_ERROR",
  OPERATION_FAILED = "OPERATION_FAILED",
  NOT_FOUND = "NOT_FOUND",
}

/**
 * Custom error class with status code and error code
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    public code?: ErrorCode
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Map WorkerServiceError code to ErrorCode enum
 */
function mapWorkerServiceErrorCode(workerCode: string): ErrorCode {
  const codeMap: Record<string, ErrorCode> = {
    FETCH_ERROR: ErrorCode.INTERNAL_ERROR,
    CREATE_ERROR: ErrorCode.OPERATION_FAILED,
    UPDATE_ERROR: ErrorCode.OPERATION_FAILED,
    DELETE_ERROR: ErrorCode.OPERATION_FAILED,
    SAVE_ERROR: ErrorCode.OPERATION_FAILED,
    CONCURRENT_UPDATE_ERROR: ErrorCode.CONCURRENT_UPDATE_ERROR,
    DUPLICATE_ERROR: ErrorCode.VALIDATION_ERROR,
    NOT_FOUND: ErrorCode.WORKER_PROFILE_NOT_FOUND,
  };

  return codeMap[workerCode] || ErrorCode.INTERNAL_ERROR;
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(
  error: unknown,
  context?: { endpoint?: string; userId?: string }
): NextResponse {
  // Track error for monitoring
  if (error instanceof ApiError) {
    errorTracker.trackApiError(
      error,
      context?.endpoint || "unknown",
      error.statusCode,
      context?.userId
    );
    return errorResponse(error.message, error.statusCode, error.code);
  }

  // Handle WalletError (convert to ApiError)
  if (
    error instanceof Error &&
    error.name === "WalletError" &&
    "code" in error &&
    "statusCode" in error
  ) {
    const walletError = error as {
      code: string;
      statusCode: number;
      message: string;
    };
    // Map wallet error codes to API error codes
    const errorCodeMap: Record<string, ErrorCode> = {
      INSUFFICIENT_BALANCE: ErrorCode.INSUFFICIENT_BALANCE,
      ESCROW_NOT_FOUND: ErrorCode.ESCROW_NOT_FOUND,
      ESCROW_ALREADY_RELEASED: ErrorCode.OPERATION_FAILED,
      TRANSACTION_FAILED: ErrorCode.TRANSACTION_FAILED,
      UNAUTHORIZED: ErrorCode.UNAUTHORIZED,
      INVALID_PAYMENT_METHOD: ErrorCode.INVALID_PAYMENT_METHOD,
      RESOLUTION_ERROR: ErrorCode.OPERATION_FAILED,
      ESCROW_RELEASE_ERROR: ErrorCode.OPERATION_FAILED,
      WALLET_UPDATE_ERROR: ErrorCode.OPERATION_FAILED,
      INVALID_RESOLUTION: ErrorCode.VALIDATION_ERROR,
    };
    const errorCode =
      errorCodeMap[walletError.code] || ErrorCode.INTERNAL_ERROR;
    const apiError = new ApiError(
      walletError.message,
      walletError.statusCode,
      errorCode
    );
    errorTracker.trackApiError(
      apiError,
      context?.endpoint || "unknown",
      apiError.statusCode,
      context?.userId
    );
    return errorResponse(apiError.message, apiError.statusCode, apiError.code);
  }

  // Handle WorkerServiceError (convert to ApiError)
  // Check for WorkerServiceError by name and properties
  if (
    error instanceof Error &&
    error.name === "WorkerServiceError" &&
    "code" in error &&
    "statusCode" in error
  ) {
    const workerError = error as {
      code: string;
      statusCode: number;
      message: string;
    };
    const errorCode = mapWorkerServiceErrorCode(workerError.code);
    const apiError = new ApiError(
      workerError.message,
      workerError.statusCode,
      errorCode
    );
    errorTracker.trackApiError(
      apiError,
      context?.endpoint || "unknown",
      apiError.statusCode,
      context?.userId
    );
    return errorResponse(apiError.message, apiError.statusCode, apiError.code);
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Track error
    errorTracker.trackApiError(
      error,
      context?.endpoint || "unknown",
      undefined,
      context?.userId
    );

    // Check for common error patterns
    const message = error.message.toLowerCase();

    if (message.includes("unauthorized") || message.includes("invalid token")) {
      return unauthorizedResponse(error.message, ErrorCode.UNAUTHORIZED);
    }

    if (message.includes("forbidden") || message.includes("access required")) {
      return forbiddenResponse(error.message, ErrorCode.FORBIDDEN);
    }

    if (message.includes("not found")) {
      return notFoundResponse(error.message, ErrorCode.NOT_FOUND);
    }

    if (message.includes("validation") || message.includes("invalid")) {
      return badRequestResponse(error.message, ErrorCode.VALIDATION_ERROR);
    }

    // Default to internal error
    return internalErrorResponse(
      error.message || "Internal server error",
      ErrorCode.INTERNAL_ERROR
    );
  }

  // Handle string errors
  if (typeof error === "string") {
    errorTracker.trackError(new Error(error), context);
    return internalErrorResponse(error, ErrorCode.INTERNAL_ERROR);
  }

  // Unknown error type
  errorTracker.trackError(error, context);
  return internalErrorResponse(
    "An unexpected error occurred",
    ErrorCode.INTERNAL_ERROR
  );
}

/**
 * Wrap async route handlers with error handling
 * Supports both routes with and without dynamic params
 */
export function withErrorHandling<
  TRequest extends NextRequest = NextRequest,
  TContext extends { params?: Promise<Record<string, string>> } = object
>(
  handler: (request: TRequest, context: TContext) => Promise<NextResponse>
): (request: TRequest, context: TContext) => Promise<NextResponse> {
  return async (
    request: TRequest,
    context: TContext
  ): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Extract endpoint from request URL
      const endpoint = new URL(request.url).pathname;
      return handleApiError(error, { endpoint });
    }
  };
}
