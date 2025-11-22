import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Try to get token from cookies first (for httpOnly cookie authentication)
    let token = request.cookies.get("sb-access-token")?.value;

    // If no cookie, check Authorization header (for client-side auth)
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader) {
        token = authHeader.replace("Bearer ", "");
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Get user from token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: "NO_PROFILE",
          message: "Profile not found",
          userId: user.id,
          email: user.email,
        },
        { status: 404 }
      );
    }

    // Check if account is banned
    if (profile.status === "banned") {
      return NextResponse.json(
        {
          error: "ACCOUNT_BANNED",
          message: "Tài khoản này đã bị khóa",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        status: profile.status,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
    });
  } catch (error) {

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

