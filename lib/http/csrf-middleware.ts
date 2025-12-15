/**
 * CSRF Protection Middleware
 * Validates CSRF tokens for state-changing operations
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateCSRFToken,
  requiresCSRFProtection,
  generateCSRFToken,
  setCSRFTokenCookie,
} from "@/lib/auth/csrf";
import { errorResponse } from "./response";
import { HttpStatus } from "@/lib/utils/enums";
import { ErrorCode } from "./errors";

/**
 * CSRF protection middleware wrapper
 * Validates CSRF token for state-changing operations
 *
 * Since CSRF token cookie is httpOnly, we validate:
 * 1. Cookie exists (sent automatically with withCredentials: true)
 * 2. Origin/Referer header matches expected origin (prevents cross-origin requests)
 *
 * This provides CSRF protection without requiring JavaScript to read the cookie.
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const method = request.method;

    // Only protect state-changing operations
    if (!requiresCSRFProtection(method)) {
      return handler(request);
    }

    // Get CSRF token from session cookie
    const sessionToken = request.cookies.get("csrftoken")?.value || null;

    // CSRF token cookie should exist (set by GET request or login)
    // If not, this is likely a first-time request - we'll be lenient and generate one
    // but in production you might want to be stricter
    if (!sessionToken) {
      // Generate token and set it, but still validate origin
      const token = generateCSRFToken();

      // Validate origin first (main CSRF protection)
      if (!validateOrigin(request)) {
        return errorResponse(
          "Invalid origin",
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN
        );
      }

      // Origin is valid, proceed with handler and set token
      const response = await handler(request);
      setCSRFTokenCookie(response, token);
      return response;
    }

    // Validate origin/referer to prevent cross-origin requests
    // This is the main CSRF protection since cookie is httpOnly
    if (!validateOrigin(request)) {
      return errorResponse(
        "Invalid origin",
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN
      );
    }

    // Optional: Validate CSRF token from header if provided (for extra security)
    // But don't require it since cookie is httpOnly
    const headerToken = request.headers.get("X-CSRF-Token");
    if (headerToken) {
      // If header token is provided, validate it matches cookie token
      if (!validateCSRFToken(request, sessionToken)) {
        return errorResponse(
          "Invalid CSRF token",
          HttpStatus.FORBIDDEN,
          ErrorCode.FORBIDDEN
        );
      }
    }

    // Token is valid, proceed with handler
    return handler(request);
  };
}

/**
 * Generate and set CSRF token for GET requests
 * This should be called when serving forms or pages that need CSRF protection
 */
export function generateCSRFResponse(request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Generate new CSRF token if not exists
  const existingToken = request.cookies.get("csrftoken")?.value;
  if (!existingToken) {
    const token = generateCSRFToken();
    setCSRFTokenCookie(response, token);
  }

  return response;
}

/**
 * Check origin header for CSRF protection
 * Validates that request origin matches expected origin
 * This is a simpler alternative to CSRF tokens for API routes
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Get expected origin from environment or request
  const expectedOrigin = process.env.NEXT_PUBLIC_SITE_URL || "";
  const requestUrl = new URL(request.url);
  const expectedHost = expectedOrigin
    ? new URL(expectedOrigin).hostname
    : requestUrl.hostname;

  // Check origin header
  if (origin) {
    try {
      const originUrl = new URL(origin);
      return originUrl.hostname === expectedHost;
    } catch {
      return false;
    }
  }

  // Fallback: check referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return refererUrl.hostname === expectedHost;
    } catch {
      return false;
    }
  }

  // If no origin/referer, allow (could be from same origin or API client)
  // In production, you might want to be stricter
  return true;
}
