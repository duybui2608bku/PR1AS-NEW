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
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse {
  // Handle ApiError instances
  if (error instanceof ApiError) {
    return errorResponse(error.message, error.statusCode, error.code);
  }

  // Handle standard Error instances
  if (error instanceof Error) {
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
    return internalErrorResponse(error, ErrorCode.INTERNAL_ERROR);
  }

  // Unknown error type
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
      return handleApiError(error);
    }
  };
}
