/**
 * Client-side auth helpers
 * Reusable functions for authentication in client components
 */

import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * Get authentication headers for API requests
 * Includes Authorization header if user is authenticated
 * @returns Headers object with Content-Type and optional Authorization
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add Authorization header if session exists
  // If not, API route will check cookies instead
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  return headers;
}

/**
 * Get current access token from Supabase session
 * @throws Error if user is not authenticated
 * @returns Access token string
 */
export async function getAccessToken(): Promise<string> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  return session.access_token;
}

/**
 * Check if user is currently authenticated
 * @returns true if user has active session
 */
export async function isAuthenticated(): Promise<boolean> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return !!session?.access_token;
}
