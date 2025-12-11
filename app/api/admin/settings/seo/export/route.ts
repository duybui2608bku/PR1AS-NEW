/**
 * GET /api/admin/settings/seo/export
 * Export SEO settings as JSON (admin only)
 */

import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  await requireAdmin(request);
  const supabase = createAdminClient();

  // Get current settings
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("key", "seo_settings")
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  const settings = data?.value || {};

  // Return JSON response
  return successResponse({
    exportDate: new Date().toISOString(),
    version: "1.0",
    settings,
  });
});

