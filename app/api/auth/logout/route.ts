import { NextRequest } from "next/server";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";
import {
  clearAuthCookies,
  invalidateSession,
} from "@/lib/auth/token-refresh";
import { getTokenFromRequest } from "@/lib/auth/helpers";

/**
 * Logout endpoint
 * Invalidates session server-side and clears cookies
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Get tokens from request
  const accessToken = getTokenFromRequest(request);
  const refreshToken = request.cookies.get("sb-refresh-token")?.value || null;

  // Invalidate session server-side using Supabase Admin API
  // This revokes the access token and refresh token immediately
  await invalidateSession(accessToken, refreshToken);

  // Create response
  const response = successResponse(null, "Logged out successfully");

  // Clear authentication cookies
  clearAuthCookies(response);

  return response;
});

