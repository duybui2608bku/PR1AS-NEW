/**
 * Wallet Balance API
 * GET /api/wallet/balance - Get user's wallet balance and summary
 */

import { NextRequest, NextResponse } from "next/server";
import { WalletService } from "@/lib/wallet/service";
import { getAuthenticatedUser } from "@/lib/wallet/auth-helper";
import { getErrorMessage } from "@/lib/utils/common";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const {
      user,
      supabase,
      error: authError,
    } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      console.error("Wallet balance auth error:", authError);
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    // Get wallet and summary
    const walletService = new WalletService(supabase);

    try {
      const wallet = await walletService.getOrCreateWallet(user.id);
      const summary = await walletService.getWalletSummary(user.id);

      return NextResponse.json({
        success: true,
        wallet,
        summary,
      });
    } catch (serviceError: any) {
      console.error("Wallet service error:", serviceError);
      throw serviceError;
    }
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(
      error,
      "Failed to fetch wallet balance"
    );
    console.error("Wallet balance API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
