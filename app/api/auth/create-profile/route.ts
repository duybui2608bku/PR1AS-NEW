import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/auth/api-client";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const { role } = await request.json();

    if (!role || !["client", "worker"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'client' or 'worker'" },
        { status: 400 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
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

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        {
          error: "PROFILE_ALREADY_EXISTS",
          message: "Profile already exists",
          role: existingProfile.role,
        },
        { status: 409 }
      );
    }

    // Check if email is already used with different role
    const { data: emailProfile } = await supabase
      .from("user_profiles")
      .select("role, status")
      .eq("email", user.email)
      .single();

    if (emailProfile) {
      if (emailProfile.status === "banned") {
        return NextResponse.json(
          {
            error: "ACCOUNT_BANNED",
            message: "Tài khoản này đã bị khóa",
          },
          { status: 403 }
        );
      }

      if (emailProfile.role !== role) {
        const roleNames: Record<UserRole, string> = {
          client: "KHÁCH HÀNG",
          worker: "THỢ",
          admin: "ADMIN",
        };

        return NextResponse.json(
          {
            error: "EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE",
            message: `Email này đã được đăng ký với vai trò ${roleNames[emailProfile.role as UserRole]}. Vui lòng đăng nhập hoặc sử dụng email khác.`,
            existingRole: emailProfile.role,
          },
          { status: 409 }
        );
      }
    }

    // Create profile
    const { error: insertError } = await supabase
      .from("user_profiles")
      .insert({
        id: user.id,
        email: user.email,
        role,
        status: "active",
      });

    if (insertError) {

      return NextResponse.json(
        { error: "Failed to create profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        role,
        status: "active",
      },
    });
  } catch (error) {

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

