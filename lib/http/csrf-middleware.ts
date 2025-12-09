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
 * Note: Next.js has built-in CSRF protection for API routes using cookies,
 * but this adds an extra layer of security with explicit token validation.
 * 
 * For most cases, SameSite cookies provide sufficient CSRF protection.
 * Use this middleware for extra-sensitive operations.
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

    // Validate CSRF token
    if (!validateCSRFToken(request, sessionToken)) {
      return errorResponse(
        "Invalid CSRF token",
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN
      );
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

