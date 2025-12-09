/**
 * React Query hooks for Authentication
 * Provides type-safe auth operations with caching
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authAPI, type UserRole, type UserProfile } from "@/lib/auth/api-client";
import { showMessage } from "@/lib/utils/toast";

/**
 * Query keys for auth operations
 */
export const authKeys = {
  all: ["auth"] as const,
  profile: () => [...authKeys.all, "profile"] as const,
  session: () => [...authKeys.all, "session"] as const,
  currentUser: () => [...authKeys.all, "currentUser"] as const,
};

/**
 * Get current user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authAPI.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on auth failures
  });
}

/**
 * Sign up with email/password
 */
export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      email,
      password,
      role,
      fullName,
    }: {
      email: string;
      password: string;
      role: UserRole;
      fullName?: string;
    }) => authAPI.signUp(email, password, role, fullName),
    onSuccess: () => {
      // Invalidate profile to refetch
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      showMessage.success("Account created successfully!");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Sign up failed");
    },
  });
}

/**
 * Login with email/password
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => authAPI.login(email, password),
    onSuccess: () => {
      // Invalidate profile to refetch with new session
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      showMessage.success("Login successful!");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Login failed");
    },
  });
}

/**
 * Logout current user
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      // Clear all auth-related cache
      queryClient.removeQueries({ queryKey: authKeys.all });
      // Clear all cached data on logout for security
      queryClient.clear();
      showMessage.success("Logged out successfully");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Logout failed");
    },
  });
}

/**
 * Create profile after OAuth
 */
export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role: UserRole) => authAPI.createProfile(role),
    onSuccess: () => {
      // Invalidate profile to refetch
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
      showMessage.success("Profile created successfully!");
    },
    onError: (error: Error) => {
      showMessage.error(error.message || "Failed to create profile");
    },
  });
}

/**
 * Get current session
 */
export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: () => authAPI.getSession(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get current Supabase user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => authAPI.getCurrentUser(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
