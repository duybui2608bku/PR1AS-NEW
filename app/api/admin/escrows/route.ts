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

  return successResponse({
    escrows,
    pagination: {
      total,
      page: filters.page,
      limit: filters.limit,
      pages: Math.ceil(total / (filters.limit || 20)),
    },
  });
});
