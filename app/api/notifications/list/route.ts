/**
 * List Notifications API
 * GET /api/notifications/list - Get user notifications
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { NotificationFilters, NotificationType } from "@/lib/booking/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

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

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      total: totalCount || 0,
      page,
      limit,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

