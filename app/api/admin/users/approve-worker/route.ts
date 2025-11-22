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

    console.log("Approve worker request for userId:", userId);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    // Update user role to worker in auth metadata
    console.log("Updating auth metadata for user:", userId);
    const { data: authData, error: authError } =
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: "worker" },
      });

    if (authError) {
      console.error("Update auth metadata error:", authError);
      return NextResponse.json(
        { error: `Failed to update user role: ${authError.message}` },
        { status: 500 }
      );
    }

    console.log("Auth metadata updated successfully");

    // Update user profile if exists
    console.log("Updating user profile for user:", userId);
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: userId,
        role: "worker",
        status: "approved",
        approved_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Update profile error:", profileError);
      // Continue even if profile update fails
    } else {
      console.log("User profile updated successfully");
    }

    // Update worker profile status
    console.log("Updating worker profile for user:", userId);
    const { error: workerError } = await supabase
      .from("worker_profiles")
      .update({
        profile_status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (workerError) {
      console.error("Update worker profile error:", workerError);
      return NextResponse.json(
        { error: `Failed to update worker profile: ${workerError.message}` },
        { status: 500 }
      );
    }

    console.log("Worker profile updated successfully");

    // Get worker profile id
    const { data: workerProfile, error: getProfileError } = await supabase
      .from("worker_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (getProfileError || !workerProfile) {
      console.error("Get worker profile error:", getProfileError);
      // Continue even if we can't get profile
    } else {
      const workerProfileId = workerProfile.id;

      // Approve all worker images
      console.log("Approving worker images for profile:", workerProfileId);
      const { error: imagesError } = await supabase
        .from("worker_images")
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
        })
        .eq("worker_profile_id", workerProfileId);

      if (imagesError) {
        console.error("Update worker images error:", imagesError);
        // Continue even if images update fails
      } else {
        console.log("Worker images approved successfully");
      }

      // Activate all worker services
      console.log("Activating worker services for profile:", workerProfileId);
      const { error: servicesError } = await supabase
        .from("worker_services")
        .update({
          is_active: true,
        })
        .eq("worker_profile_id", workerProfileId);

      if (servicesError) {
        console.error("Update worker services error:", servicesError);
        // Continue even if services update fails
      } else {
        console.log("Worker services activated successfully");
      }
    }

    // Try to log admin action (optional - table may not exist)
    try {
      await supabase.from("admin_logs").insert({
        action: "approve_worker",
        target_user_id: userId,
        details: {},
      });
      console.log("Admin action logged");
    } catch (logError) {
      console.warn(
        "Failed to log admin action (table may not exist):",
        logError
      );
      // Ignore logging errors
    }

    console.log("Worker approval completed successfully");
    return NextResponse.json({
      message: "Worker approved successfully",
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
