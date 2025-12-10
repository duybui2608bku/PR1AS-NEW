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

    // Enrich notifications with booking and user info
    let enrichedNotifications = notifications || [];
    if (notifications && notifications.length > 0) {
      const bookingIds = notifications
        .map((n: any) => n.related_booking_id)
        .filter(Boolean);

      if (bookingIds.length > 0) {
        // Get bookings with service info
        const { data: bookings } = await supabase
          .from("bookings")
          .select(
            `
            id,
            status,
            start_date,
            end_date,
            final_amount_usd,
            worker_id,
            client_id,
            service:services(name_key)
          `
          )
          .in("id", bookingIds);

        // Get worker profiles
        const workerIds = bookings
          ?.map((b: any) => b.worker_id)
          .filter(Boolean) || [];
        let workerProfilesMap = new Map();
        if (workerIds.length > 0) {
          const { data: workerProfiles } = await supabase
            .from("worker_profiles")
            .select("user_id, full_name")
            .in("user_id", workerIds);

          if (workerProfiles) {
            workerProfilesMap = new Map(
              workerProfiles.map((wp: any) => [wp.user_id, wp])
            );
          }
        }

        // Get client profiles
        const clientIds = bookings
          ?.map((b: any) => b.client_id)
          .filter(Boolean) || [];
        let clientProfilesMap = new Map();
        if (clientIds.length > 0) {
          const { data: clientProfiles } = await supabase
            .from("user_profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", clientIds);

          if (clientProfiles) {
            clientProfilesMap = new Map(
              clientProfiles.map((cp: any) => [cp.id, cp])
            );
          }
        }

        // Enrich notifications with booking and user info
        enrichedNotifications = notifications.map((notification: any) => {
          if (notification.related_booking_id && bookings) {
            const booking = bookings.find(
              (b: any) => b.id === notification.related_booking_id
            );
            if (booking) {
              const workerProfile = workerProfilesMap.get(booking.worker_id);
              const clientProfile = clientProfilesMap.get(booking.client_id);

              return {
                ...notification,
                booking: {
                  ...booking,
                  worker: workerProfile
                    ? {
                        full_name: workerProfile.full_name,
                        user_id: workerProfile.user_id,
                      }
                    : null,
                  client: clientProfile
                    ? {
                        full_name: clientProfile.full_name,
                        email: clientProfile.email,
                        avatar_url: clientProfile.avatar_url,
                      }
                    : null,
                },
              };
            }
          }
          return notification;
        });
      }
    }

    return successResponse({
      notifications: enrichedNotifications,
      unread_count: unreadCount || 0,
      total: totalCount || 0,
      page,
      limit,
    });
});

