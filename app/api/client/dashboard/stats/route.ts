/**
 * Client Dashboard Stats API
 * GET /api/client/dashboard/stats - Get client dashboard statistics
 */

import { NextRequest } from "next/server";
import { requireClient } from "@/lib/auth/middleware";
import { BookingService } from "@/lib/booking/service";
import { WalletService } from "@/lib/wallet/service";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require client authentication
  const { user, supabase } = await requireClient(request);

  // Parse query parameters for date filter
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  const bookingService = new BookingService(supabase);
  const walletService = new WalletService(supabase);

  // Get all client bookings
  let bookings = await bookingService.getBookings({
    client_id: user.id,
    limit: 1000, // Get all for stats calculation
  });

  // Filter bookings by date if provided
  if (dateFrom || dateTo) {
    bookings = bookings.filter((booking) => {
      const createdAt = new Date(booking.created_at);
      if (dateFrom && createdAt < new Date(dateFrom)) return false;
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire end date
        if (createdAt > toDate) return false;
      }
      return true;
    });
  }

  // Calculate stats
  const now = dayjs();
  const startOfMonth = now.startOf("month");
  const startOfLastMonth = now.subtract(1, "month").startOf("month");
  const endOfLastMonth = now.subtract(1, "month").endOf("month");

  // Total bookings (this month)
  const totalBookingsThisMonth = bookings.filter((booking) =>
    dayjs(booking.created_at).isSameOrAfter(startOfMonth, "day")
  ).length;

  // Total bookings (last month) for trend calculation
  const totalBookingsLastMonth = bookings.filter((booking) => {
    const bookingDate = dayjs(booking.created_at);
    return (
      bookingDate.isSameOrAfter(startOfLastMonth, "day") &&
      bookingDate.isSameOrBefore(endOfLastMonth, "day")
    );
  }).length;

  // Calculate bookings trend percentage
  const bookingsTrend =
    totalBookingsLastMonth > 0
      ? Math.round(
          ((totalBookingsThisMonth - totalBookingsLastMonth) /
            totalBookingsLastMonth) *
            100
        )
      : totalBookingsThisMonth > 0
      ? 100
      : 0;

  // Active services (in progress) - includes pending, confirmed, in_progress, and worker_completed
  const activeServices = bookings.filter(
    (booking) =>
      booking.status === "pending_worker_confirmation" ||
      booking.status === "worker_confirmed" ||
      booking.status === "in_progress" ||
      booking.status === "worker_completed"
  ).length;

  // Debug logging
  console.log(`[Client Dashboard Stats] User: ${user.id}`);
  console.log(`[Client Dashboard Stats] Total bookings: ${bookings.length}`);
  console.log(
    `[Client Dashboard Stats] Bookings by status:`,
    bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );
  console.log(`[Client Dashboard Stats] Active services: ${activeServices}`);

  // Get transactions for more accurate total spent calculation
  const { transactions } = await walletService.getTransactions({
    user_id: user.id,
    type: ["payment", "escrow_hold"],
    status: ["completed"],
  });

  // Calculate total spent from transactions (more accurate)
  const totalSpentFromTransactions = transactions
    .filter((t) => t.type === "payment")
    .reduce((sum, t) => sum + Number(t.amount_usd), 0);

  // Total spent this month
  const totalSpentThisMonth = transactions
    .filter(
      (t) =>
        t.type === "payment" &&
        dayjs(t.created_at).isSameOrAfter(startOfMonth, "day")
    )
    .reduce((sum, t) => sum + Number(t.amount_usd), 0);

  // Total spent last month
  const totalSpentLastMonth = transactions
    .filter((t) => {
      if (t.type !== "payment") return false;
      const transactionDate = dayjs(t.created_at);
      return (
        transactionDate.isSameOrAfter(startOfLastMonth, "day") &&
        transactionDate.isSameOrBefore(endOfLastMonth, "day")
      );
    })
    .reduce((sum, t) => sum + Number(t.amount_usd), 0);

  // Calculate total spent trend percentage
  const totalSpentTrend =
    totalSpentLastMonth > 0
      ? Math.round(
          ((totalSpentThisMonth - totalSpentLastMonth) /
            totalSpentLastMonth) *
            100
        )
      : totalSpentThisMonth > 0
      ? 100
      : 0;

  // Favorite workers count (workers the client has booked with)
  // For now, we'll count unique workers the client has booked with
  const uniqueWorkers = new Set(
    bookings.map((booking) => booking.worker_id)
  ).size;

  // Prepare chart data (bookings by date)
  const bookingsByDate: Record<string, number> = {};
  bookings.forEach((booking) => {
    const date = dayjs(booking.created_at).format("YYYY-MM-DD");
    bookingsByDate[date] = (bookingsByDate[date] || 0) + 1;
  });

  // Convert to array format for chart
  const bookingsChartData = Object.entries(bookingsByDate)
    .map(([date, count]) => ({
      date,
      bookings: count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Prepare spending chart data (spending by date)
  const spendingByDate: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "payment")
    .forEach((transaction) => {
      const date = dayjs(transaction.created_at).format("YYYY-MM-DD");
      spendingByDate[date] =
        (spendingByDate[date] || 0) + Number(transaction.amount_usd);
    });

  // Convert to array format for chart
  const spendingChartData = Object.entries(spendingByDate)
    .map(([date, amount]) => ({
      date,
      spending: amount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Bookings by status for chart
  const bookingsByStatus = {
    pending: bookings.filter(
      (b) => b.status === "pending_worker_confirmation"
    ).length,
    confirmed: bookings.filter((b) => b.status === "worker_confirmed").length,
    inProgress: bookings.filter((b) => b.status === "in_progress").length,
    completed: bookings.filter((b) => b.status === "client_completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return successResponse({
    stats: {
      totalBookings: bookings.length,
      totalBookingsThisMonth,
      bookingsTrend,
      activeServices,
      totalSpent: totalSpentFromTransactions,
      totalSpentTrend,
      favoriteWorkers: uniqueWorkers,
    },
    chartData: {
      bookings: bookingsChartData,
      spending: spendingChartData,
      bookingsByStatus,
    },
  });
});

