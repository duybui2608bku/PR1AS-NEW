import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { email, password } = await request.json();

  // Validate input
  if (!email || !password) {
    throw new ApiError(
      "Email and password are required",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

    const supabase = createAdminClient();

    // Authenticate with Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

  if (authError) {
    throw new ApiError(
      "Invalid email or password",
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED
    );
  }

  if (!authData.user) {
    throw new ApiError(
      "Authentication failed",
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED
    );
  }

  const adminClient = createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("user_profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.NO_PROFILE),
      HttpStatus.NOT_FOUND,
      ErrorCode.NO_PROFILE
    );
  }

  if (profile.status === "banned") {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.ACCOUNT_BANNED),
      HttpStatus.FORBIDDEN,
      ErrorCode.ACCOUNT_BANNED
    );
  }

  // Create response with cookies
  const response = successResponse({
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      status: profile.status,
    },
    session: {
      access_token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
    },
  });

  // Set authentication cookies
  if (authData.session) {
    response.cookies.set("sb-access-token", authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    response.cookies.set("sb-refresh-token", authData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  return response;
});
