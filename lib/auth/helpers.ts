/**
 * Server-side auth helpers
 */

import { createAdminClient } from "@/lib/supabase/server";
import { UserRole } from "./api-client";

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
