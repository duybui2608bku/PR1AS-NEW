/**
 * API Client for Authentication operations
 * Migrated to use Axios for consistent error handling
 */

import { axiosClient } from "@/lib/http/axios-client";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
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
 * Authentication API Client
 * All methods use Axios for consistent error handling
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
    try {
      const { data } = await axiosClient.post<
        ApiResponse<{
          user: { id: string; email: string; role: UserRole };
          session?: { access_token?: string; refresh_token?: string };
        }>
      >("/auth/signup", { email, password, role, fullName });

      if (!data.success) {
        throw new Error(data.message || data.error || "Sign up failed");
      }

      // Small delay to ensure cookies are properly set
      await new Promise((resolve) => setTimeout(resolve, 100));

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Sign up failed");
    }
  },

  /**
   * Sign up with OAuth (Google)
   * Returns the callback URL for Supabase signInWithOAuth
   */
  async signUpOAuth(role: UserRole, provider: "google" = "google") {
    try {
      const { data } = await axiosClient.post<
        ApiResponse<{ callbackUrl: string }>
      >("/auth/signup-oauth", { role, provider });

      if (!data.success || !data.data) {
        throw new Error(data.message || data.error || "OAuth signup failed");
      }

      return data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("OAuth signup failed");
    }
  },

  /**
   * Sign in with Google OAuth
   * Combines API call with Supabase OAuth flow
   */
  async signInWithGoogle(role: UserRole) {
    const supabase = getSupabaseClient();

    // Get callback URL from API
    const { callbackUrl } = await this.signUpOAuth(role);

    // Initiate OAuth flow with Supabase
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
    try {
      const { data } = await axiosClient.post<
        ApiResponse<{
          user: { id: string; email: string; role: UserRole; status: string };
          session?: { access_token?: string; refresh_token?: string };
        }>
      >("/auth/login", { email, password });

      if (!data.success) {
        throw new Error(data.message || data.error || "Login failed");
      }

      // Small delay to ensure cookies are properly set
      await new Promise((resolve) => setTimeout(resolve, 100));

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Login failed");
    }
  },

  /**
   * Logout current user
   */
  async logout() {
    const supabase = getSupabaseClient();

    // Sign out from Supabase (client-side)
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // Call API endpoint for server-side cleanup
    try {
      await axiosClient.post("/auth/logout");
    } catch {
      // Ignore errors on logout API call
    }

    return { success: true };
  },

  /**
   * Get current user's profile
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const { data } = await axiosClient.get<
        ApiResponse<{ profile: UserProfile }>
      >("/auth/profile");

      if (!data.success || !data.data?.profile) {
        if (data.code === "ACCOUNT_BANNED" || data.error === "ACCOUNT_BANNED") {
          // Redirect to banned page
          window.location.href = "/banned";
        }
        throw new Error(
          data.message ||
            data.error ||
            getErrorMessage(ERROR_MESSAGES.GET_PROFILE_FAILED)
        );
      }

      return data.data.profile;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.GET_PROFILE_FAILED));
    }
  },

  /**
   * Create profile for authenticated user (after OAuth)
   */
  async createProfile(role: UserRole) {
    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const { data } = await axiosClient.post<ApiResponse<unknown>>(
        "/auth/create-profile",
        { role },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!data.success) {
        throw new Error(
          data.message ||
            data.error ||
            getErrorMessage(ERROR_MESSAGES.CREATE_PROFILE_FAILED)
        );
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(getErrorMessage(ERROR_MESSAGES.CREATE_PROFILE_FAILED));
    }
  },

  /**
   * Handle OAuth callback
   */
  async handleCallback(userId: string, email: string, role?: UserRole) {
    try {
      const { data } = await axiosClient.post<ApiResponse<unknown>>(
        "/auth/callback",
        { userId, email, role }
      );

      if (!data.success) {
        throw new Error(data.message || data.error || "Callback failed");
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Callback failed");
    }
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
   * Get current user from Supabase
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
