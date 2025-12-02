/**
 * Admin Escrow Resolution API
 * POST /api/admin/wallet/escrow/resolve - Resolve a disputed escrow
 */

import { NextRequest } from 'next/server';
import { WalletService } from '@/lib/wallet/service';
import { ComplaintResolution } from '@/lib/wallet/types';
import { requireAdmin } from '@/lib/auth/middleware';
import { successResponse } from '@/lib/http/response';
import { withErrorHandling, ApiError, ErrorCode } from '@/lib/http/errors';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/constants/errors';
import { HttpStatus } from '@/lib/utils/enums';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { user, supabase } = await requireAdmin(request);

  // Parse request body
  const body: ComplaintResolution = await request.json();
  const { escrow_id, action, worker_amount, employer_refund, resolution_notes } = body;

  // Validate required fields
  if (!escrow_id || !action || !resolution_notes) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Validate action
  const validActions = ['release_to_worker', 'refund_to_employer', 'partial_refund'];
  if (!validActions.includes(action)) {
    throw new ApiError(
      'Invalid action. Must be: release_to_worker, refund_to_employer, or partial_refund',
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  // For partial refund, validate amounts
  if (action === 'partial_refund') {
    if (!worker_amount || !employer_refund) {
      throw new ApiError(
        'Worker amount and employer refund are required for partial refund',
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      );
    }
  }

  // Resolve complaint
  const walletService = new WalletService(supabase);
  const escrow = await walletService.resolveComplaint(body, user.id);

  return successResponse(
    { escrow },
    'Complaint resolved successfully'
  );
});

