/**
 * Wallet Balance API
 * GET /api/wallet/balance - Get user's wallet balance and summary
 */

import { NextRequest } from "next/server";
import { WalletService } from "@/lib/wallet/service";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const { user, supabase } = await requireAuth(request);

  // Get wallet and summary
  const walletService = new WalletService(supabase);
  const wallet = await walletService.getOrCreateWallet(user.id);
  const summary = await walletService.getWalletSummary(user.id);

  return successResponse({
    wallet,
    summary,
  });
});
