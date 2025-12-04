/**
 * Centralized HTTP Response Helpers
 * Provides consistent response formatting across all API routes
 */

import { NextResponse } from "next/server";
import { HttpStatus } from "@/lib/utils/enums";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  [key: string]: any;
}

/**
 * Create a success response
 */
export function successResponse<T>(
  data?: T,
  message?: string,
  status: HttpStatus = HttpStatus.OK
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  code?: string,
  additionalData?: Record<string, any>
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error,
  };

  if (code) {
    response.code = code;
  }

  if (additionalData) {
    Object.assign(response, additionalData);
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a bad request response (400)
 */
export function badRequestResponse(
  error: string,
  code?: string
): NextResponse<ApiResponse> {
  return errorResponse(error, HttpStatus.BAD_REQUEST, code);
}

/**
 * Create an unauthorized response (401)
 */
export function unauthorizedResponse(
  error: string = "Unauthorized",
  code?: string
): NextResponse<ApiResponse> {
  return errorResponse(error, HttpStatus.UNAUTHORIZED, code);
}

/**
 * Create a forbidden response (403)
 */
export function forbiddenResponse(
  error: string = "Forbidden",
  code?: string
): NextResponse<ApiResponse> {
  return errorResponse(error, HttpStatus.FORBIDDEN, code);
}

/**
 * Create a not found response (404)
 */
export function notFoundResponse(
  error: string = "Not found",
  code?: string
): NextResponse<ApiResponse> {
  return errorResponse(error, HttpStatus.NOT_FOUND, code);
}

/**
 * Create an internal server error response (500)
 */
export function internalErrorResponse(
  error: string = "Internal server error",
  code?: string
): NextResponse<ApiResponse> {
  return errorResponse(error, HttpStatus.INTERNAL_SERVER_ERROR, code);
}

/**
 * Create a created response (201)
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return successResponse(data, message, HttpStatus.CREATED);
}

