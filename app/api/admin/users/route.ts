import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

// GET /api/admin/users - Get all users with filters and pagination
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase } = await requireAdmin(request);

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || ""; // 'active' | 'banned' | 'all'
  const dateFrom = searchParams.get("date_from") || "";
  const dateTo = searchParams.get("date_to") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  // Get users from auth.users
  // Note: Supabase Admin API doesn't support filtering directly, so we'll filter after fetching
  const { data: authUsers, error: authError } =
    await supabase.auth.admin.listUsers();

  if (authError) {
    throw authError;
  }

  // Get user profiles for additional info
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("*");

  // Merge auth users with profile data
  let users = authUsers.users.map((user) => {
    const profile = profiles?.find((p) => p.id === user.id);
    // banned_until is stored in user_metadata, not directly on user object
    const bannedUntil =
      (user.user_metadata as Record<string, unknown>)?.banned_until as
        | string
        | undefined;
    const isBanned =
      bannedUntil && new Date(bannedUntil) > new Date();
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at,
      banned_until: bannedUntil,
      user_metadata: {
        ...user.user_metadata,
        role: user.user_metadata?.role || profile?.role || "client",
        full_name: user.user_metadata?.full_name || profile?.full_name,
      },
      profile: profile || null,
      is_banned: isBanned,
    };
  });

  // Apply filters
  // Filter by search (email or full_name)
  if (search) {
    const searchLower = search.toLowerCase();
    users = users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchLower) ||
        user.user_metadata?.full_name?.toLowerCase().includes(searchLower)
    );
  }

  // Filter by role
  if (role && role !== "all") {
    users = users.filter(
      (user) => (user.user_metadata?.role || "client") === role
    );
  }

  // Filter by status
  if (status && status !== "all") {
    if (status === "banned") {
      users = users.filter((user) => user.is_banned);
    } else if (status === "active") {
      users = users.filter((user) => !user.is_banned);
    }
  }

  // Filter by date range (created_at)
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    users = users.filter(
      (user) => new Date(user.created_at) >= fromDate
    );
  }
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999); // End of day
    users = users.filter((user) => new Date(user.created_at) <= toDate);
  }

  // Get total count before pagination
  const total = users.length;

  // Apply pagination
  const paginatedUsers = users.slice(offset, offset + limit);

  return successResponse({
    users: paginatedUsers,
    total,
    pagination: {
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  });
});
