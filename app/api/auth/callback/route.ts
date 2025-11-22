import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/auth/api-client";

export async function POST(request: NextRequest) {
  try {
    const { userId, email, role } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "UserId and email are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // If profile exists, return it
    if (existingProfile) {
      // Check if banned
      if (existingProfile.status === "banned") {
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
        created: false,
        user: {
          id: existingProfile.id,
          email: existingProfile.email,
          role: existingProfile.role,
          status: existingProfile.status,
        },
      });
    }

    // No profile exists, need to create one
    if (!role) {
      // Need role to create profile
      return NextResponse.json(
        {
          error: "NO_PROFILE_NO_ROLE",
          message: "Email này chưa có tài khoản. Bạn muốn đăng ký Client hay Worker?",
          userId,
          email,
        },
        { status: 404 }
      );
    }

    // Validate role
    if (!["client", "worker"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'client' or 'worker'" },
        { status: 400 }
      );
    }

    // Check if email is already used with different account
    const { data: emailProfile } = await supabase
      .from("user_profiles")
      .select("role, status")
      .eq("email", email)
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

    // Create new profile
    const { error: insertError } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        email,
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
      created: true,
      user: {
        id: userId,
        email,
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

