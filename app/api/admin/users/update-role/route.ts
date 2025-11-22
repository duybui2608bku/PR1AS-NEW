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

// POST /api/admin/users/update-role
export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    const validRoles = ["client", "worker", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // Update user role in auth metadata
    const { data: authData, error: authError } =
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role },
      });

    if (authError) {
      console.error("Update auth metadata error:", authError);
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      );
    }

    // Update user profile if exists
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        role: role,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Update profile error:", profileError);
      // Continue even if profile update fails
    }

    // Log admin action
    const { error: logError } = await supabase.from("admin_logs").insert({
      action: "update_user_role",
      target_user_id: userId,
      details: { new_role: role },
    });

    if (logError) {
      console.error("Failed to log admin action:", logError);
    }

    return NextResponse.json({
      message: `User role updated to ${role} successfully`,
      user: authData.user,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
