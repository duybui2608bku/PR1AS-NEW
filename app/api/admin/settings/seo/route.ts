import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

/**
 * GET /api/admin/settings/seo
 * Public endpoint to fetch SEO settings
 */
export const GET = withErrorHandling(async () => {
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
    return successResponse({
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
    });
  }

  return successResponse(data.value);
});

/**
 * POST /api/admin/settings/seo
 * Admin-only endpoint to update SEO settings
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase } = await requireAdmin(request);

  // Get settings from request body
  const body = await request.json();
  const { settings } = body;

  if (!settings) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
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
    const { error: insertError } = await supabase.from("site_settings").insert({
      key: "seo_settings",
      value: settings,
    });

    if (insertError) throw insertError;
  }

  return successResponse(null, "SEO settings updated successfully");
});
