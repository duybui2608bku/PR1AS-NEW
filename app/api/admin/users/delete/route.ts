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

// DELETE /api/admin/users/delete
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    // Delete user from auth (this will cascade to related tables)
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {

      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }

    // Log admin action
    const { error: logError } = await supabase.from("admin_logs").insert({
      action: "delete_user",
      target_user_id: userId,
      details: {},
    });

    if (logError) {

    }

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
