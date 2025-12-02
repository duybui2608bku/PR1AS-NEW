/**
 * Admin Transactions API
 * GET /api/admin/transactions - Get all transactions with filters
 */

import { NextRequest } from "next/server";
import { WalletService } from "@/lib/wallet/service";
import { TransactionFilters, TransactionType, TransactionStatus } from "@/lib/wallet/types";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase } = await requireAdmin(request);

  // Parse filters
  const { searchParams } = new URL(request.url);
  const filters: TransactionFilters = {};

  const typeParam = searchParams.get("type");
  if (typeParam) {
    filters.type = typeParam.split(",") as TransactionType[];
  }

  const statusParam = searchParams.get("status");
  if (statusParam) {
    filters.status = statusParam.split(",") as TransactionStatus[];
  }

  const dateFrom = searchParams.get("date_from");
  if (dateFrom) {
    filters.date_from = dateFrom;
  }

  const dateTo = searchParams.get("date_to");
  if (dateTo) {
    filters.date_to = dateTo;
  }

  // Get transactions (list + total count)
  const walletService = new WalletService(supabase);
  const { transactions, total } = await walletService.getTransactions(filters);

  // Calculate statistics
  const totalTransactions = total;
  const totalAmount = transactions.reduce(
    (sum, t) => sum + Number(t.amount_usd),
    0
  );
  const totalDeposits = transactions
    .filter((t) => t.type === "deposit" && t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount_usd), 0);
  const totalWithdrawals = transactions
    .filter((t) => t.type === "withdrawal" && t.status === "completed")
    .reduce((sum, t) => sum + Math.abs(Number(t.amount_usd)), 0);
  const totalPayments = transactions
    .filter((t) => t.type === "payment" && t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount_usd), 0);

  return successResponse({
    transactions,
    stats: {
      total_transactions: totalTransactions,
      total_amount: totalAmount,
      total_deposits: totalDeposits,
      total_withdrawals: totalWithdrawals,
      total_payments: totalPayments,
    },
  });
});

