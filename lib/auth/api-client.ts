/**
 * API Client for Authentication operations
 * Provides client-side helpers to call auth API routes
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import type { ApiResponse } from "@/lib/http/response";

export type UserRole = "client" | "worker" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string | null;
  role: UserRole;
  status: "active" | "banned";
  created_at?: string;
  updated_at?: string;
}

/**
 * Get authorization header with current user's token
 */
async function getAuthHeader(): Promise<string> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  return `Bearer ${session.access_token}`;
}

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Sign up with email/password
   */
  async signUp(
    email: string,
    password: string,
    role: UserRole,
    fullName?: string
  ) {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Ensure cookies are sent/received
      body: JSON.stringify({ email, password, role, fullName }),
    });

    const json: ApiResponse<{
      user: { id: string; email: string; role: UserRole };
      session?: { access_token?: string; refresh_token?: string };
    }> = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || json.error || "Sign up failed");
    }

    // Small delay to ensure cookies are properly set before redirect
    await new Promise((resolve) => setTimeout(resolve, 100));

    return json;
  },

  /**
   * Sign up with OAuth (Google)
   * Returns the callback URL that should be used with Supabase signInWithOAuth
   */
  async signUpOAuth(role: UserRole, provider: "google" = "google") {
    const response = await fetch("/api/auth/signup-oauth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role, provider }),
    });

    const json: ApiResponse<{ callbackUrl: string }> = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || json.error || "OAuth signup failed");
    }

    return json.data!;
  },

  /**
   * Sign in with OAuth using Supabase client
   * This is a helper that combines the API call with Supabase OAuth
   */
  async signInWithGoogle(role: UserRole) {
    const supabase = getSupabaseClient();

    // Get the callback URL from our API
    const { callbackUrl } = await this.signUpOAuth(role);

    // Use Supabase to initiate OAuth flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });

    if (error) throw error;

    return data;
  },

  /**
   * Login with email/password
   */
  async login(email: string, password: string) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Ensure cookies are sent/received
      body: JSON.stringify({ email, password }),
    });

    const json: ApiResponse<{
      user: { id: string; email: string; role: UserRole; status: string };
      session?: { access_token?: string; refresh_token?: string };
    }> = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || json.error || "Login failed");
    }

    // Small delay to ensure cookies are properly set before redirect
    await new Promise((resolve) => setTimeout(resolve, 100));

    return json;
  },

  /**
   * Logout
   */
  async logout() {
    const supabase = getSupabaseClient();

    // Sign out from Supabase (client-side)
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // Also call our API endpoint for any server-side cleanup
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include", // Ensure cookies are sent for deletion
    });

    return { success: true };
  },

  /**
   * Get current user's profile
   */
  async getProfile(): Promise<UserProfile> {
    // Don't require Authorization header - API will read from httpOnly cookies
    const response = await fetch("/api/auth/profile", {
      credentials: "include", // Important: Send cookies with request
    });

    const json: ApiResponse<{ profile: UserProfile }> = await response.json();

    if (!response.ok || !json.success) {
      if (json.code === "ACCOUNT_BANNED" || json.error === "ACCOUNT_BANNED") {
        // Redirect to banned page
        window.location.href = "/banned";
      }
      throw new Error(
        json.message || json.error || "Failed to get profile"
      );
    }

    return json.data!.profile;
  },

  /**
   * Create profile for authenticated user (after OAuth)
   */
  async createProfile(role: UserRole) {
    const authHeader = await getAuthHeader();
    const response = await fetch("/api/auth/create-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ role }),
    });

    const json: ApiResponse<unknown> = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(
        json.message || json.error || "Failed to create profile"
      );
    }

    return json;
  },

  /**
   * Handle OAuth callback
   */
  async handleCallback(userId: string, email: string, role?: UserRole) {
    const response = await fetch("/api/auth/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, email, role }),
    });

    const json: ApiResponse<unknown> = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.message || json.error || "Callback failed");
    }

    return json;
  },

  /**
   * Check if user is authenticated and get session
   */
  async getSession() {
    const supabase = getSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  },
};

/**
 * Role-based redirect helper
 */
export function redirectByRole(role: UserRole): string {
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

/**
 * Check if user has required role
 */
export function hasRole(
  userRole: UserRole,
  requiredRole: UserRole | UserRole[]
): boolean {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === "admin";
}
