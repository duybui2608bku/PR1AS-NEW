/**
 * CSRF Protection utilities
 * Implements CSRF token generation and validation
 */

import { NextRequest } from "next/server";
import { randomBytes } from "crypto";

/**
 * Generate CSRF token
 * @returns CSRF token string
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Get CSRF token from request
 * Checks both header and cookie
 * @param request - NextRequest object
 * @returns CSRF token or null if not found
 */
export function getCSRFToken(request: NextRequest): string | null {
  // Try to get from header first (X-CSRF-Token)
  const headerToken = request.headers.get("X-CSRF-Token");

  if (headerToken) {
    return headerToken;
  }

  // Fallback: try cookie (csrftoken)
  const cookieToken = request.cookies.get("csrftoken")?.value;

  return cookieToken || null;
}

/**
 * Validate CSRF token
 * Compares token from header/cookie with session token
 * @param request - NextRequest object
 * @param sessionToken - Token stored in session/cookie
 * @returns true if token is valid
 */
export function validateCSRFToken(
  request: NextRequest,
  sessionToken: string | null
): boolean {
  if (!sessionToken) {
    return false;
  }

  const requestToken = getCSRFToken(request);

  if (!requestToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return constantTimeEqual(requestToken, sessionToken);
}

/**
 * Constant-time string comparison
 * Prevents timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Check if request method requires CSRF protection
 * @param method - HTTP method
 * @returns true if method requires CSRF protection
 */
export function requiresCSRFProtection(method: string): boolean {
  const protectedMethods = ["POST", "PUT", "PATCH", "DELETE"];
  return protectedMethods.includes(method.toUpperCase());
}

/**
 * Set CSRF token in response cookie
 * @param response - NextResponse object
 * @param token - CSRF token
 */
export function setCSRFTokenCookie(
  response: NextResponse,
  token: string
): void {
  response.cookies.set("csrftoken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

