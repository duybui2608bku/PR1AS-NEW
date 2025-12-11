/**
 * Admin Escrows API
 * GET /api/admin/escrows - Get all escrow holds with filters
 */

import { NextRequest } from "next/server";
import { WalletService } from "@/lib/wallet/service";
import { EscrowFilters, EscrowStatus } from "@/lib/wallet/types";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase } = await requireAdmin(request);

  // Parse filters
  const { searchParams } = new URL(request.url);
  const filters: EscrowFilters = {
    status: searchParams.get("status")
      ? (searchParams.get("status")!.split(",") as EscrowStatus[])
      : undefined,
    has_complaint:
      searchParams.get("has_complaint") === "true"
        ? true
        : searchParams.get("has_complaint") === "false"
        ? false
        : undefined,
    page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
  };

  const walletService = new WalletService(supabase);
  const { escrows, total } = await walletService.getEscrows(filters);

  // Calculate statistics from all escrows (not just current page)
  // Get all escrows for stats calculation (without pagination)
  const allEscrowsFilters: EscrowFilters = {
    status: filters.status,
    has_complaint: filters.has_complaint,
  };
  const { escrows: allEscrows } = await walletService.getEscrows(allEscrowsFilters);

  const stats = {
    total_held: allEscrows
      .filter((e) => e.status === "held")
      .reduce((sum, e) => sum + Number(e.total_amount_usd || 0), 0),
    total_released: allEscrows
      .filter((e) => e.status === "released")
      .reduce((sum, e) => sum + Number(e.total_amount_usd || 0), 0),
    total_disputed: allEscrows
      .filter((e) => e.status === "disputed")
      .reduce((sum, e) => sum + Number(e.total_amount_usd || 0), 0),
    total_count: total,
  };

  return successResponse({
    escrows,
    pagination: {
      total,
      page: filters.page,
      limit: filters.limit,
      pages: Math.ceil(total / (filters.limit || 20)),
    },
    stats,
  });
});
