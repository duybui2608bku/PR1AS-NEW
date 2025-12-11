/**
 * GET /api/admin/settings/seo/history
 * Get SEO settings history (admin only)
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

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  // Get history records
  const { data, error } = await supabase
    .from("site_settings_history")
    .select(
      `
      id,
      value,
      version_number,
      change_reason,
      created_at,
      changed_by
    `
    )
    .eq("settings_key", "seo_settings")
    .order("version_number", { ascending: false })
    .limit(limit);

  // Get user info separately since we don't have foreign key constraint
  if (data && data.length > 0) {
    const userIds = [...new Set(data.map((r) => r.changed_by).filter(Boolean))];
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("user_profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const userMap = new Map(users?.map((u) => [u.id, u]) || []);

      data.forEach((record) => {
        if (record.changed_by) {
          (record as any).user = userMap.get(record.changed_by) || null;
        }
      });
    }
  }

  if (error) {
    throw error;
  }

  // Enrich with user info
  const enrichedData = data || [];
  if (enrichedData.length > 0) {
    const userIds = [
      ...new Set(enrichedData.map((r) => r.changed_by).filter(Boolean)),
    ];
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("user_profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const userMap = new Map(users?.map((u) => [u.id, u]) || []);

      enrichedData.forEach((record) => {
        if (record.changed_by) {
          (record as any).user = userMap.get(record.changed_by) || null;
        }
      });
    }
  }

  return successResponse({
    history: enrichedData,
  });
});

