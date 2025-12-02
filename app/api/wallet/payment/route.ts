/**
 * Payment API
 * POST /api/wallet/payment - Employer pays worker (creates escrow hold)
 */

import { NextRequest } from "next/server";
import { WalletService } from "@/lib/wallet/service";
import { PaymentRequest } from "@/lib/wallet/types";
import { requireClient } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus, UserRole } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require client authentication
  const { user, supabase } = await requireClient(request);

    // Parse request body
    const body: PaymentRequest = await request.json();
    const { worker_id, job_id, amount_usd, description, cooling_period_days } =
      body;

  // Validate worker exists and is a worker
  const { data: worker } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", worker_id)
    .single();

  if (!worker || worker.role !== UserRole.WORKER) {
    throw new ApiError(
      "Invalid worker ID",
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  // Process payment
  const walletService = new WalletService(supabase);
  const result = await walletService.processPayment({
    employer_id: user.id,
    worker_id,
    job_id,
    amount_usd,
    description,
    cooling_period_days,
  });

  return successResponse(
    {
      escrow: result.escrow,
      transaction: result.transaction,
    },
    "Payment processed and held in escrow"
  );
});
