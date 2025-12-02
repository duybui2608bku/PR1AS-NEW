/**
 * Admin Escrow Release API
 * POST /api/admin/wallet/escrow/release - Manually release an escrow
 */

import { NextRequest } from "next/server";
import { WalletService } from "@/lib/wallet/service";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { user, supabase } = await requireAdmin(request);

  // Parse request body
  const body = await request.json();
  const { escrow_id } = body;

  if (!escrow_id) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.ESCROW_ID_REQUIRED),
      HttpStatus.BAD_REQUEST,
      ErrorCode.ESCROW_ID_REQUIRED
    );
  }

  // Release escrow
  const walletService = new WalletService(supabase);
  const transaction = await walletService.releaseEscrow(escrow_id, user.id);

  return successResponse({ transaction }, "Escrow released successfully");
});
