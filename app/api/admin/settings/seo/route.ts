import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/settings/seo
 * Public endpoint to fetch SEO settings
 */
export async function GET() {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "seo_settings")
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // Return default values if no settings found
    if (!data) {
      return NextResponse.json({
        data: {
          siteName: "PR1AS",
          siteTitle: "PR1AS - Connecting Workers and Clients",
          siteDescription: "Professional service marketplace platform",
          siteKeywords: "services, marketplace, workers, professionals",
          ogImage: "",
          headerLogo: "/logo.png",
          headerTagline: "Connect. Work. Succeed.",
          headerContactPhone: "",
          headerContactEmail: "",
          footerCompanyName: "PR1AS Ltd.",
          footerAddress: "",
          footerPhone: "",
          footerEmail: "",
          footerCopyright: "© 2025 PR1AS. All rights reserved.",
          footerAbout: "",
          facebookUrl: "",
          twitterUrl: "",
          instagramUrl: "",
          linkedinUrl: "",
        },
      });
    }

    return NextResponse.json({ data: data.value });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch SEO settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/seo
 * Admin-only endpoint to update SEO settings
 */
export async function POST(request: NextRequest) {
  try {
    // Get token from cookies or Authorization header
    let token = request.cookies.get("sb-access-token")?.value;

    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader) {
        token = authHeader.replace("Bearer ", "");
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin using admin client (bypasses RLS)
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || userData?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get settings from request body
    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: "Settings are required" },
        { status: 400 }
      );
    }

    // Try to update first
    const { data: existingData, error: selectError } = await supabase
      .from("site_settings")
      .select("id")
      .eq("key", "seo_settings")
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      throw selectError;
    }

    if (existingData) {
      // Update existing record
      const { error: updateError } = await supabase
        .from("site_settings")
        .update({
          value: settings,
          updated_at: new Date().toISOString(),
        })
        .eq("key", "seo_settings");

      if (updateError) throw updateError;
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from("site_settings")
        .insert({
          key: "seo_settings",
          value: settings,
        });

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: "SEO settings updated successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update SEO settings" },
      { status: 500 }
    );
  }
}
