/**
 * Admin Transactions API
 * GET /api/admin/transactions - Get all transactions with filters
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { WalletService } from "@/lib/wallet/service";
import { TransactionFilters, TransactionType, TransactionStatus } from "@/lib/wallet/types";

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

    // Verify user is admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required",
        },
        { status: 403 }
      );
    }

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

    return NextResponse.json({
      success: true,
      transactions,
      stats: {
        total_transactions: totalTransactions,
        total_amount: totalAmount,
        total_deposits: totalDeposits,
        total_withdrawals: totalWithdrawals,
        total_payments: totalPayments,
      },
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

