/**
 * POST /api/admin/settings/seo/import
 * Import SEO settings from JSON (admin only)
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase, user } = await requireAdmin(request);

  // Get JSON data from request body
  const body = await request.json();
  const { settings, changeReason } = body;

  if (!settings) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Validate settings structure (basic check)
  if (typeof settings !== "object" || Array.isArray(settings)) {
    throw new ApiError(
      "Invalid settings format. Expected JSON object.",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  // Get current settings before import (for history)
  const { data: existingData } = await supabase
    .from("site_settings")
    .select("id, value")
    .eq("key", "seo_settings")
    .single();

  // Save current version to history before importing
  if (existingData && existingData.value) {
    const { data: maxVersion } = await supabase
      .from("site_settings_history")
      .select("version_number")
      .eq("settings_key", "seo_settings")
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (maxVersion?.version_number || 0) + 1;

    await supabase.from("site_settings_history").insert({
      settings_key: "seo_settings",
      value: existingData.value,
      version_number: nextVersion - 1,
      changed_by: user.id,
      change_reason: changeReason || "Settings imported from JSON",
    });
  }

  // Update or insert settings
  if (existingData) {
    const { error: updateError } = await supabase
      .from("site_settings")
      .update({
        value: settings,
        updated_at: new Date().toISOString(),
      })
      .eq("key", "seo_settings");

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase.from("site_settings").insert({
      key: "seo_settings",
      value: settings,
    });

    if (insertError) throw insertError;
  }

  return successResponse(
    {
      importedSettings: settings,
    },
    "Settings imported successfully"
  );
});

