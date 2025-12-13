/**
 * Security headers utilities
 * Provides security headers for Next.js responses
 */

import { NextResponse } from "next/server";

/**
 * Apply security headers to response
 * @param response - NextResponse object
 * @returns Response with security headers
 */
export function applySecurityHeaders<T = any>(
  response: NextResponse<T>
): NextResponse<T> {
  // X-Content-Type-Options: Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // X-Frame-Options: Prevent clickjacking attacks
  response.headers.set("X-Frame-Options", "DENY");

  // X-XSS-Protection: Enable XSS filtering (legacy but still useful)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer-Policy: Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions-Policy: Control browser features
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );

  // Strict-Transport-Security (HSTS): Force HTTPS
  // Only set in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Content-Security-Policy: Prevent XSS attacks
  // Note: This is a basic CSP, adjust based on your needs
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // 'unsafe-inline' needed for Next.js
    "style-src 'self' 'unsafe-inline'", // 'unsafe-inline' needed for CSS-in-JS
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.supabase.com",
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

/**
 * Create a response with security headers
 * @param response - NextResponse object
 * @returns Response with security headers applied
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  return applySecurityHeaders(response);
}
