/**
 * POST /api/admin/settings/seo/rollback
 * Rollback SEO settings to a previous version (admin only)
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

  // Get version ID from request body
  const body = await request.json();
  const { versionId, changeReason } = body;

  if (!versionId) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Get the history record
  const { data: historyRecord, error: historyError } = await supabase
    .from("site_settings_history")
    .select("*")
    .eq("id", versionId)
    .eq("settings_key", "seo_settings")
    .single();

  if (historyError || !historyRecord) {
    throw new ApiError(
      "History record not found",
      HttpStatus.NOT_FOUND,
      ErrorCode.NOT_FOUND
    );
  }

  // Get current settings before rollback (save to history)
  const { data: currentSettings } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "seo_settings")
    .single();

  // Save current version to history before rollback
  if (currentSettings?.value) {
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
      value: currentSettings.value,
      version_number: nextVersion,
      changed_by: user.id,
      change_reason: changeReason || `Rollback to version ${historyRecord.version_number}`,
    });
  }

  // Update site_settings with the rolled back value
  const { error: updateError } = await supabase
    .from("site_settings")
    .update({
      value: historyRecord.value,
      updated_at: new Date().toISOString(),
    })
    .eq("key", "seo_settings");

  if (updateError) {
    throw updateError;
  }

  return successResponse(
    {
      rolledBackTo: historyRecord.version_number,
      settings: historyRecord.value,
    },
    "Settings rolled back successfully"
  );
});

