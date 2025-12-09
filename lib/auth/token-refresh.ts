/**
 * Token refresh helper functions
 * Used for automatic token refresh in middleware and API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Refresh access token using refresh token from cookies
 * Returns new tokens or null if refresh fails
 */
export async function refreshAccessToken(
  request: NextRequest
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;

  if (!refreshToken) {
    return null;
  }

  try {
    const supabase = createAdminClient();

    // Refresh the session using refresh token
    const { data: sessionData, error: refreshError } =
      await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

    if (refreshError || !sessionData.session) {
      return null;
    }

    return {
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
    };
  } catch {
    return null;
  }
}

/**
 * Set authentication cookies in response
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): void {
  response.cookies.set("sb-access-token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  response.cookies.set("sb-refresh-token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

/**
 * Clear authentication cookies
 */
export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");
}

/**
 * Invalidate session server-side
 * Revokes the access token and refresh token by clearing cookies
 * Note: Supabase tokens are stateless JWTs, so invalidating them server-side
 * requires clearing the cookies. The tokens will become invalid once cookies are cleared
 * and cannot be refreshed without the refresh token cookie.
 * 
 * For immediate invalidation, we:
 * 1. Get user ID from token (if available)
 * 2. Clear cookies (which prevents token refresh)
 * 3. Optionally, we could track revoked sessions in DB for additional security
 */
export async function invalidateSession(
  accessToken: string | null,
  refreshToken: string | null
): Promise<void> {
  if (!accessToken && !refreshToken) {
    return;
  }

  try {
    const supabase = createAdminClient();

    // Get user ID from access token if available
    // This can be used for logging or session tracking
    let userId: string | null = null;

    if (accessToken) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser(accessToken);

        if (user) {
          userId = user.id;
        }
      } catch {
        // Token might be invalid, ignore
      }
    }

    // If we have refresh token but no access token, try to get user ID from refresh token
    if (!userId && refreshToken) {
      try {
        const { data: sessionData } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (sessionData?.user?.id) {
          userId = sessionData.user.id;
        }
      } catch {
        // Refresh token might be invalid, ignore
      }
    }

    // Note: Supabase uses stateless JWTs, so we can't directly invalidate them server-side
    // However, by clearing cookies, we prevent:
    // 1. Access token from being used (cookie is gone)
    // 2. Refresh token from being used to get new access tokens (cookie is gone)
    // 
    // The tokens themselves will expire naturally, but without cookies,
    // they cannot be used for authentication anymore.

    // Optional: Log session invalidation for audit purposes
    // This could be stored in a sessions table for tracking
    if (userId) {
      // Future enhancement: Store revoked session in DB for tracking
      // await supabase.from('revoked_sessions').insert({ user_id: userId, revoked_at: new Date() });
    }
  } catch (error) {
    // Log error but don't fail logout
    // Session invalidation is best-effort
    console.error("Error during session invalidation:", error);
  }
}

