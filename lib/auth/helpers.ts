/**
 * Server-side auth helpers
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/utils/enums";

/**
 * Get authentication token from request
 * Checks both Authorization header (Bearer token) and httpOnly cookies
 * @param request - Next.js request object
 * @returns Token string or null if not found
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Try to get token from httpOnly cookie first
  let token = request.cookies.get("sb-access-token")?.value || null;

  // Fallback: try Authorization header (Bearer token)
  if (!token) {
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    }
  }

  return token || null;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  status: "active" | "banned";
}

/**
 * Get user profile from token (server-side)
 */
export async function getUserProfile(
  token: string
): Promise<UserProfile | null> {
  try {
    const supabase = createAdminClient();

    // Get user from token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return null;
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user is admin (server-side)
 */
export async function isAdmin(token: string): Promise<boolean> {
  const profile = await getUserProfile(token);
  return profile?.role === "admin";
}

/**
 * Check if user has required role (server-side)
 */
export async function hasRole(
  token: string,
  requiredRole: UserRole | UserRole[]
): Promise<boolean> {
  const profile = await getUserProfile(token);
  if (!profile) return false;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(profile.role);
  }

  return profile.role === requiredRole;
}

/**
 * Check if user is banned (server-side)
 */
export async function isBanned(token: string): Promise<boolean> {
  const profile = await getUserProfile(token);
  return profile?.status === "banned";
}

/**
 * Get redirect URL based on user role
 */
export function getRedirectByRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "client":
      return "/client/dashboard";
    case "worker":
      return "/worker/dashboard";
    default:
      return "/";
  }
}
