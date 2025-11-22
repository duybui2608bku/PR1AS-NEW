import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
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

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminSupabase();

    // Get users from auth.users
    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Get user profiles for additional info
    const { data: profiles, error: profileError } = await supabase
      .from("user_profiles")
      .select("*");

    if (profileError) {
      console.error("Profile error:", profileError);
      // Continue without profiles if table doesn't exist
    }

    // Merge auth users with profile data
    const users = authUsers.users.map((user) => {
      const profile = profiles?.find((p) => p.id === user.id);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        banned_until: (user as any).banned_until, // Supabase auth user type doesn't include this
        user_metadata: {
          ...user.user_metadata,
          role: user.user_metadata?.role || profile?.role || "client",
          full_name: user.user_metadata?.full_name || profile?.full_name,
        },
        profile: profile || null,
      };
    });

    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
