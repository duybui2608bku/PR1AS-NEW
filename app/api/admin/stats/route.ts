/**
 * Admin Dashboard Statistics API
 * GET /api/admin/stats - Get dashboard statistics
 */

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";
import { createAdminClient } from "@/lib/supabase/server";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase } = await requireAdmin(request);
  const adminSupabase = createAdminClient();

  // Parse query parameters for date range filter
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  // 1. Total Users (from auth.users)
  const { data: authUsers, error: usersError } =
    await adminSupabase.auth.admin.listUsers();
  if (usersError) {
    throw usersError;
  }

  let totalUsers = authUsers.users.length;

  // Filter by date range if provided
  if (dateFrom || dateTo) {
    totalUsers = authUsers.users.filter((user) => {
      const createdAt = new Date(user.created_at);
      if (dateFrom && createdAt < new Date(dateFrom)) return false;
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (createdAt > toDate) return false;
      }
      return true;
    }).length;
  }

  // 2. Active Workers (published workers)
  let activeWorkersQuery = supabase
    .from("worker_profiles")
    .select("*", { count: "exact", head: true })
    .eq("profile_status", "published");

  if (dateFrom) {
    activeWorkersQuery = activeWorkersQuery.gte("created_at", dateFrom);
  }
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    activeWorkersQuery = activeWorkersQuery.lte("created_at", toDate.toISOString());
  }

  const { count: activeWorkers, error: workersError } =
    await activeWorkersQuery;

  if (workersError) {
    throw workersError;
  }

  // 3. Total Jobs (from bookings table)
  let bookingsQuery = supabase
    .from("bookings")
    .select("*", { count: "exact", head: true });

  if (dateFrom) {
    bookingsQuery = bookingsQuery.gte("created_at", dateFrom);
  }
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    bookingsQuery = bookingsQuery.lte("created_at", toDate.toISOString());
  }

  const { count: totalJobs, error: jobsError } = await bookingsQuery;

  if (jobsError) {
    throw jobsError;
  }

  // 4. Revenue (platform fees from transactions)
  let revenueQuery = supabase
    .from("transactions")
    .select("amount_usd")
    .eq("type", "platform_fee")
    .eq("status", "completed");

  if (dateFrom) {
    revenueQuery = revenueQuery.gte("created_at", dateFrom);
  }
  if (dateTo) {
    const toDate = new Date(dateTo);
    toDate.setHours(23, 59, 59, 999);
    revenueQuery = revenueQuery.lte("created_at", toDate.toISOString());
  }

  const { data: revenueData, error: revenueError } = await revenueQuery;

  if (revenueError) {
    throw revenueError;
  }

  const revenue =
    revenueData?.reduce((sum, t) => sum + Number(t.amount_usd || 0), 0) || 0;

  return successResponse({
    totalUsers: totalUsers || 0,
    activeWorkers: activeWorkers || 0,
    totalJobs: totalJobs || 0,
    revenue: revenue,
  });
});

