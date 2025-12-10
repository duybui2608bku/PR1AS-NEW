/**
 * Worker Dashboard Stats API
 * GET /api/worker/dashboard/stats - Get worker dashboard statistics
 */

import { NextRequest } from "next/server";
import { WalletService } from "@/lib/wallet/service";
import { requireWorker } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require worker authentication
  const { user, supabase } = await requireWorker(request);

  // Parse query parameters for date filter
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  const walletService = new WalletService(supabase);

  // Get escrows for this worker
  const { escrows } = await walletService.getEscrows({
    worker_id: user.id,
    limit: 1000, // Get all for stats calculation
  });

  // Filter escrows by date if provided
  let filteredEscrows = escrows;
  if (dateFrom || dateTo) {
    filteredEscrows = escrows.filter((escrow) => {
      const createdAt = new Date(escrow.created_at);
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
  const availableJobs = filteredEscrows.filter(
    (e) => e.status === "held"
  ).length;
  const inProgress = filteredEscrows.filter(
    (e) => e.status === "held" || e.status === "disputed"
  ).length;
  const completed = filteredEscrows.filter(
    (e) => e.status === "released"
  ).length;

  // Get transactions for earnings calculation
  const transactionFilters: any = {
    user_id: user.id,
    type: ["earning", "escrow_release"],
    status: ["completed"],
  };

  if (dateFrom) {
    transactionFilters.date_from = dateFrom;
  }
  if (dateTo) {
    transactionFilters.date_to = dateTo;
  }

  const { transactions } = await walletService.getTransactions(
    transactionFilters
  );

  // Calculate total earnings
  const totalEarnings = transactions.reduce(
    (sum, t) => sum + Number(t.amount_usd),
    0
  );

  // Prepare chart data (earnings by date)
  const earningsByDate: Record<string, number> = {};
  transactions.forEach((t) => {
    const date = new Date(t.created_at).toISOString().split("T")[0];
    earningsByDate[date] = (earningsByDate[date] || 0) + Number(t.amount_usd);
  });

  // Convert to array format for chart
  const chartData = Object.entries(earningsByDate)
    .map(([date, amount]) => ({
      date,
      earnings: amount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate escrows by status for chart
  const escrowsByStatus = {
    held: filteredEscrows.filter((e) => e.status === "held").length,
    released: filteredEscrows.filter((e) => e.status === "released").length,
    disputed: filteredEscrows.filter((e) => e.status === "disputed").length,
    refunded: filteredEscrows.filter((e) => e.status === "refunded").length,
  };

  return successResponse({
    stats: {
      availableJobs,
      inProgress,
      completed,
      totalEarnings,
    },
    chartData: {
      earnings: chartData,
      escrowsByStatus,
    },
  });
});

