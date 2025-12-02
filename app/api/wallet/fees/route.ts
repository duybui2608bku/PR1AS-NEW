/**
 * Fee Calculation API
 * GET /api/wallet/fees?amount=100 - Calculate fees for a given amount
 */

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { WalletService } from '@/lib/wallet/service';
import { successResponse } from '@/lib/http/response';
import { withErrorHandling, ApiError, ErrorCode } from '@/lib/http/errors';
import { HttpStatus } from '@/lib/utils/enums';

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const amount = Number(searchParams.get('amount'));

  if (!amount || amount <= 0) {
    throw new ApiError(
      'Valid amount parameter is required',
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  // Calculate fees
  const supabase = createAdminClient();
  const walletService = new WalletService(supabase);
  const calculation = await walletService.calculateFees(amount);

  return successResponse({ calculation });
});

