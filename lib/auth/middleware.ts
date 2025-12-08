/**
 * Authentication & Authorization Middleware Helpers
 * Centralized auth checks for API routes
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { getTokenFromRequest, getUserProfile } from "@/lib/auth/helpers";
import { UserRole } from "@/lib/utils/enums";
import { ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

export interface AuthContext {
  user: {
    id: string;
    email?: string;
  };
  profile: {
    id: string;
    role: UserRole;
    status: "active" | "banned";
  };
  supabase: SupabaseClient<any>;
}

/**
 * Get authenticated user from request
 * Throws ApiError if authentication fails
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext> {
  const token = getTokenFromRequest(request);

  if (!token) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.UNAUTHORIZED),
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED
    );
  }

  const supabase = createAdminClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.INVALID_TOKEN),
      HttpStatus.UNAUTHORIZED,
      ErrorCode.INVALID_TOKEN
    );
  }

  const profile = await getUserProfile(token);

  if (!profile) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.PROFILE_NOT_FOUND),
      HttpStatus.NOT_FOUND,
      ErrorCode.PROFILE_NOT_FOUND
    );
  }

  if (profile.status === "banned") {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.ACCOUNT_BANNED),
      HttpStatus.FORBIDDEN,
      ErrorCode.ACCOUNT_BANNED
    );
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile: {
      id: profile.id,
      role: profile.role,
      status: profile.status,
    },
    supabase,
  };
}

/**
 * Require admin role
 * Throws ApiError if user is not admin
 */
export async function requireAdmin(request: NextRequest): Promise<AuthContext> {
  const auth = await requireAuth(request);

  if (auth.profile.role !== UserRole.ADMIN) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.ADMIN_REQUIRED),
      HttpStatus.FORBIDDEN,
      ErrorCode.ADMIN_REQUIRED
    );
  }

  return auth;
}

/**
 * Require specific role(s)
 * Throws ApiError if user doesn't have required role
 */
export async function requireRole(
  request: NextRequest,
  requiredRole: UserRole | UserRole[]
): Promise<AuthContext> {
  const auth = await requireAuth(request);

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!roles.includes(auth.profile.role)) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.ROLE_REQUIRED),
      HttpStatus.FORBIDDEN,
      ErrorCode.ROLE_REQUIRED
    );
  }

  return auth;
}

/**
 * Require client role
 */
export async function requireClient(
  request: NextRequest
): Promise<AuthContext> {
  return requireRole(request, UserRole.CLIENT);
}

/**
 * Require worker role
 */
export async function requireWorker(
  request: NextRequest
): Promise<AuthContext> {
  return requireRole(request, UserRole.WORKER);
}
