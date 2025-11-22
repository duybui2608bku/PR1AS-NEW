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

// POST /api/admin/users/unban
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });

    if (error) {

      return NextResponse.json(
        { error: "Failed to unban user" },
        { status: 500 }
      );
    }

    // Log admin action
    const { error: logError } = await supabase.from("admin_logs").insert({
      action: "unban_user",
      target_user_id: userId,
      details: {},
    });

    if (logError) {

    }

    return NextResponse.json({
      message: "User unbanned successfully",
      user: data.user,
    });
  } catch (error) {

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
