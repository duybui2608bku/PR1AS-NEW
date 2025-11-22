import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin Supabase client with service role key
const getAdminSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// POST /api/admin/users/ban
export async function POST(request: NextRequest) {
  try {
    const { userId, duration } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    // Calculate ban duration (default 1 year if not specified)
    const banDuration = duration || "8760h"; // 1 year in hours

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
    });

    if (error) {
      console.error("Ban user error:", error);
      return NextResponse.json(
        { error: "Failed to ban user" },
        { status: 500 }
      );
    }

    // Log admin action
    const { error: logError } = await supabase.from("admin_logs").insert({
      action: "ban_user",
      target_user_id: userId,
      details: { duration: banDuration },
    });

    if (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return NextResponse.json({
      message: "User banned successfully",
      user: data.user,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
