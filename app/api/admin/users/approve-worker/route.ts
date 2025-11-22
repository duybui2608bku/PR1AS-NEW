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

// POST /api/admin/users/approve-worker
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

    // Update user role to worker in auth metadata
    const { data: authData, error: authError } =
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: "worker" },
      });

    if (authError) {
      return NextResponse.json(
        { error: `Failed to update user role: ${authError.message}` },
        { status: 500 }
      );
    }

    // Update user profile if exists
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        role: "worker",
        status: "approved",
        approved_at: new Date().toISOString(),
      });

    if (profileError) {
      // Continue even if profile update fails
    }

    // Update worker profile status
    const { error: workerError } = await supabase
      .from("worker_profiles")
      .update({
        profile_status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (workerError) {
      return NextResponse.json(
        { error: `Failed to update worker profile: ${workerError.message}` },
        { status: 500 }
      );
    }

    // Get worker profile id
    const { data: workerProfile, error: getProfileError } = await supabase
      .from("worker_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (getProfileError || !workerProfile) {
      // Continue even if we can't get profile
    } else {
      const workerProfileId = workerProfile.id;

      // Approve all worker images
      const { error: imagesError } = await supabase
        .from("worker_images")
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
        })
        .eq("worker_profile_id", workerProfileId);

      if (imagesError) {
        // Continue even if images update fails
      }

      // Activate all worker services
      const { error: servicesError } = await supabase
        .from("worker_services")
        .update({
          is_active: true,
        })
        .eq("worker_profile_id", workerProfileId);

      if (servicesError) {
        // Continue even if services update fails
      }
    }

    // Try to log admin action (optional - table may not exist)
    try {
      await supabase.from("admin_logs").insert({
        action: "approve_worker",
        target_user_id: userId,
        details: {},
      });
    } catch (logError) {
      // Ignore logging errors
    }

    return NextResponse.json({
      message: "Worker approved successfully",
      user: authData.user,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
