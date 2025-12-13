/**
 * Admin Transaction Complete API
 * POST /api/admin/wallet/transaction/complete - Complete a withdrawal transaction
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
  const { transaction_id } = body;

  if (!transaction_id) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Get transaction to verify it's a withdrawal
  const walletService = new WalletService(supabase);
  const { data: transaction, error: fetchError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transaction_id)
    .single();

  if (fetchError || !transaction) {
    throw new ApiError(
      "Transaction not found",
      HttpStatus.NOT_FOUND,
      ErrorCode.NOT_FOUND
    );
  }

  // Verify it's a withdrawal transaction
  if (transaction.type !== "withdrawal") {
    throw new ApiError(
      "Only withdrawal transactions can be completed",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  // Verify transaction is not already completed or failed
  if (transaction.status === "completed") {
    throw new ApiError(
      "Transaction is already completed",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  if (transaction.status === "failed") {
    throw new ApiError(
      "Cannot complete a failed transaction",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  // Complete the transaction
  await walletService.updateTransactionStatus(transaction_id, "completed");

  // Update metadata to include admin who completed it
  const { data: finalTransaction, error: updateError } = await supabase
    .from("transactions")
    .update({
      metadata: {
        ...(transaction.metadata || {}),
        completed_by_admin: user.id,
        completed_at_admin: new Date().toISOString(),
      },
    })
    .eq("id", transaction_id)
    .select()
    .single();

  if (updateError || !finalTransaction) {
    throw new ApiError(
      "Failed to update transaction metadata",
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR
    );
  }

  return successResponse(
    { transaction: finalTransaction },
    "Withdrawal transaction completed successfully"
  );
});
