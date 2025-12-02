/**
 * Escrow Complaint API
 * POST /api/wallet/escrow/complaint - File a complaint for an escrow
 */

import { NextRequest } from 'next/server';
import { WalletService } from '@/lib/wallet/service';
import { ComplaintRequest } from '@/lib/wallet/types';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse } from '@/lib/http/response';
import { withErrorHandling, ApiError, ErrorCode } from '@/lib/http/errors';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/constants/errors';
import { HttpStatus } from '@/lib/utils/enums';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const { user, supabase } = await requireAuth(request);

  // Parse request body
  const body: ComplaintRequest = await request.json();
  const { escrow_id, description } = body;

  if (!escrow_id || !description) {
    throw new ApiError(
      'Escrow ID and description are required',
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // File complaint
  const walletService = new WalletService(supabase);
  const escrow = await walletService.fileComplaint(body, user.id);

  return successResponse(
    { escrow },
    'Complaint filed successfully. Payment is now held pending admin review.'
  );
});

