import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";
import type { SEOSettings } from "@/lib/admin/seo-api";

/**
 * Validate SEO settings structure and required fields
 */
function validateSEOSettings(settings: unknown): settings is SEOSettings {
  if (!settings || typeof settings !== "object") {
    return false;
  }

  const requiredFields: (keyof SEOSettings)[] = [
    "siteName",
    "siteTitle",
    "siteDescription",
    "siteKeywords",
    "ogImage",
    "headerLogo",
    "headerTagline",
    "headerContactPhone",
    "headerContactEmail",
    "footerCompanyName",
    "footerAddress",
    "footerPhone",
    "footerEmail",
    "footerCopyright",
    "footerAbout",
    "facebookUrl",
    "twitterUrl",
    "instagramUrl",
    "linkedinUrl",
  ];

  const s = settings as Record<string, unknown>;

  // Check all required fields exist and are strings
  for (const field of requiredFields) {
    if (!(field in s) || typeof s[field] !== "string") {
      return false;
    }
  }

  return true;
}

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
  const { supabase, user } = await requireAdmin(request);

  // Get settings from request body
  const body = await request.json();
  const { settings, changeReason } = body;

  if (!settings) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Validate SEO settings structure and required fields
  if (!validateSEOSettings(settings)) {
    throw new ApiError(
      "Invalid SEO settings structure. All required fields must be present and of type string.",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  // Get current settings before update (for history)
  const { data: existingData, error: selectError } = await supabase
    .from("site_settings")
    .select("id, value")
    .eq("key", "seo_settings")
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    throw selectError;
  }

  // Save current version to history before updating
  if (existingData && existingData.value) {
    // Get next version number
    const { data: maxVersion } = await supabase
      .from("site_settings_history")
      .select("version_number")
      .eq("settings_key", "seo_settings")
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (maxVersion?.version_number || 0) + 1;

    // Insert history record
    const { error: historyError } = await supabase
      .from("site_settings_history")
      .insert({
        settings_key: "seo_settings",
        value: existingData.value,
        version_number: nextVersion - 1, // Current version before update
        changed_by: user.id,
        change_reason: changeReason || "Settings updated",
      });

    // Don't fail if history insert fails, but log it
    if (historyError) {
      console.error("Failed to save settings history:", historyError);
    }
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
