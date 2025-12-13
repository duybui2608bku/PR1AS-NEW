import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { HttpStatus } from "@/lib/utils/enums";
import { setAuthCookies, clearAuthCookies } from "@/lib/auth/token-refresh";

/**
 * Refresh access token using refresh token from cookie
 * Implements refresh token rotation for better security
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Get refresh token from cookie
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;

  if (!refreshToken) {
    throw new ApiError(
      "Refresh token not found",
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED
    );
  }

  const supabase = createAdminClient();

  // Refresh the session using refresh token
  const { data: sessionData, error: refreshError } =
    await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

  if (refreshError || !sessionData.session || !sessionData.user) {
    // Invalid or expired refresh token
    // Clear cookies and return error
    const response = successResponse(
      null,
      "Refresh token expired or invalid",
      HttpStatus.UNAUTHORIZED
    );

    // Clear authentication cookies
    clearAuthCookies(response);

    throw new ApiError(
      "Refresh token expired or invalid",
      HttpStatus.UNAUTHORIZED,
      ErrorCode.TOKEN_EXPIRED
    );
  }

  // Get user profile to verify account status
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, email, role, status")
    .eq("id", sessionData.user.id)
    .single();

  if (profileError || !profile) {
    throw new ApiError(
      "User profile not found",
      HttpStatus.NOT_FOUND,
      ErrorCode.NO_PROFILE
    );
  }

  // Check if account is banned
  if (profile.status === "banned") {
    // Clear cookies for banned user
    const response = successResponse(
      null,
      "Account is banned",
      HttpStatus.FORBIDDEN
    );
    clearAuthCookies(response);

    throw new ApiError(
      "Account is banned",
      HttpStatus.FORBIDDEN,
      ErrorCode.ACCOUNT_BANNED
    );
  }

  // Create response with new tokens
  const response = successResponse({
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      status: profile.status,
    },
    session: {
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    },
  });

  // Set new authentication cookies with refresh token rotation
  // Refresh token rotation: old refresh token is invalidated, new one is issued
  setAuthCookies(
    response,
    sessionData.session.access_token,
    sessionData.session.refresh_token
  );

  return response;
});
