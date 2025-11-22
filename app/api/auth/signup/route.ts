import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/auth/api-client";

export async function POST(request: NextRequest) {
  try {
    const { email, password, role, fullName } = await request.json();

    // Validate input
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["client", "worker"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'client' or 'worker'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check if email already exists with a different role
    const { data: existingProfile } = await supabase
      .from("user_profiles")
      .select("role, status")
      .eq("email", email)
      .single();

    if (existingProfile) {
      // Check if account is banned
      if (existingProfile.status === "banned") {
        return NextResponse.json(
          {
            error: "ACCOUNT_BANNED",
            message: "Tài khoản này đã bị khóa",
          },
          { status: 403 }
        );
      }

      // Check if trying to register with different role
      if (existingProfile.role !== role) {
        const roleNames: Record<UserRole, string> = {
          client: "KHÁCH HÀNG",
          worker: "THỢ",
          admin: "ADMIN",
        };

        return NextResponse.json(
          {
            error: "EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE",
            message: `Email này đã được đăng ký với vai trò ${roleNames[existingProfile.role as UserRole]}. Vui lòng đăng nhập hoặc sử dụng email khác.`,
            existingRole: existingProfile.role,
          },
          { status: 409 }
        );
      }

      // Email already registered with same role
      return NextResponse.json(
        {
          error: "Email already registered",
          message: "Email này đã được đăng ký. Vui lòng đăng nhập.",
        },
        { status: 409 }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for demo
    });

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName || null,
        role,
        status: "active",
      });

    if (profileError) {
      console.error("Profile error:", profileError);
      // Cleanup: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: "Failed to create profile" },
        { status: 500 }
      );
    }

    // Auto-login after signup by creating a session
    const { data: sessionData, error: sessionError } = 
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (sessionError || !sessionData.session) {
      console.error("Auto-login error:", sessionError);
      // User created but auto-login failed - they can login manually
      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role,
        },
        message: "Account created. Please login.",
      });
    }

    // Create response with cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
      },
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      },
    });

    // Set authentication cookies
    response.cookies.set("sb-access-token", sessionData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    response.cookies.set("sb-refresh-token", sessionData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

