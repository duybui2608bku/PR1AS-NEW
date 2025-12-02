import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET: Lấy thông tin thiết lập cơ bản của client
export async function GET(request: NextRequest) {
  try {
    // Lấy access token từ cookie hoặc Authorization header
    let token = request.cookies.get("sb-access-token")?.value;

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

    // Lấy user từ token
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

    // Lấy profile từ bảng user_profiles
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select(
        `
        id,
        email,
        full_name,
        role,
        status,
        avatar_url,
        gender,
        date_of_birth,
        country,
        language,
        address,
        created_at,
        updated_at
      `
      )
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: "NO_PROFILE",
          message: "Profile not found",
        },
        { status: 404 }
      );
    }

    if (profile.status === "banned") {
      return NextResponse.json(
        {
          error: "ACCOUNT_BANNED",
          message: "Tài khoản này đã bị khóa",
        },
        { status: 403 }
      );
    }

    if (profile.role !== "client") {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "Chỉ client mới được truy cập trang này",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật thông tin thiết lập cơ bản của client
export async function PUT(request: NextRequest) {
  try {
    let token = request.cookies.get("sb-access-token")?.value;

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

    const body = await request.json();
    const {
      full_name,
      avatar_url,
      gender,
      date_of_birth,
      country,
      language,
      address,
    } = body ?? {};

    // Lấy profile để kiểm tra role
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, role, status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "NO_PROFILE", message: "Profile not found" },
        { status: 404 }
      );
    }

    if (profile.status === "banned") {
      return NextResponse.json(
        {
          error: "ACCOUNT_BANNED",
          message: "Tài khoản này đã bị khóa",
        },
        { status: 403 }
      );
    }

    if (profile.role !== "client") {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "Chỉ client mới được cập nhật profile này",
        },
        { status: 403 }
      );
    }

    // Chuẩn hóa dữ liệu cập nhật
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof full_name === "string") updates.full_name = full_name;
    if (typeof avatar_url === "string" || avatar_url === null) {
      updates.avatar_url = avatar_url;
    }
    if (typeof gender === "string" || gender === null) {
      updates.gender = gender;
    }
    if (typeof date_of_birth === "string" || date_of_birth === null) {
      updates.date_of_birth = date_of_birth;
    }
    if (typeof country === "string" || country === null) {
      updates.country = country;
    }
    if (typeof language === "string" || language === null) {
      updates.language = language;
    }
    if (typeof address === "string" || address === null) {
      updates.address = address;
    }

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "UPDATE_FAILED", message: "Không thể cập nhật profile" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


