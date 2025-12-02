/**
 * List Notifications API
 * GET /api/notifications/list - Get user notifications
 */

import { NextRequest } from "next/server";
import { NotificationFilters, NotificationType } from "@/lib/booking/types";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const { user, supabase } = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const filters: NotificationFilters = {
      user_id: user.id,
    };

    const isReadParam = searchParams.get("is_read");
    if (isReadParam !== null) {
      filters.is_read = isReadParam === "true";
    }

    const typeParam = searchParams.get("type");
    if (typeParam) {
      filters.type = typeParam.split(",") as NotificationType[];
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    filters.page = page;
    filters.limit = limit;

    // Build query
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (filters.is_read !== undefined) {
      query = query.eq("is_read", filters.is_read);
    }

    if (filters.type && filters.type.length > 0) {
      query = query.in("type", filters.type);
    }

    if (limit) {
      query = query.limit(limit);
      if (page) {
        query = query.range((page - 1) * limit, page * limit - 1);
      }
    }

    const { data: notifications, error: notificationsError } = await query;

    if (notificationsError) {
      throw notificationsError;
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    // Get total count
    const { count: totalCount } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

  return successResponse({
    notifications: notifications || [],
    unread_count: unreadCount || 0,
    total: totalCount || 0,
    page,
    limit,
  });
});

