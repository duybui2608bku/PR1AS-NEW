/**
 * Admin Platform Settings API
 * GET /api/admin/wallet/settings - Get platform settings
 * PUT /api/admin/wallet/settings - Update platform settings
 */

import { NextRequest } from 'next/server';
import { WalletService } from '@/lib/wallet/service';
import { requireAdmin } from '@/lib/auth/middleware';
import { successResponse } from '@/lib/http/response';
import { withErrorHandling, ApiError, ErrorCode } from '@/lib/http/errors';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/constants/errors';
import { HttpStatus } from '@/lib/utils/enums';

/**
 * GET /api/admin/wallet/settings
 * Get all platform settings
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase } = await requireAdmin(request);

  // Get settings
  const walletService = new WalletService(supabase);
  const settings = await walletService.getPlatformSettings();

  return successResponse({ settings });
});

/**
 * PUT /api/admin/wallet/settings
 * Update platform settings
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { user, supabase } = await requireAdmin(request);

  // Parse request body
  const body = await request.json();
  const { key, value } = body;

  if (!key) {
    throw new ApiError(
      'Setting key is required',
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Validate setting key exists
  const validKeys = [
    'payment_fees_enabled',
    'platform_fee_percentage',
    'insurance_fund_percentage',
    'escrow_cooling_period_days',
    'minimum_deposit_usd',
    'minimum_withdrawal_usd',
    'bank_transfer_info',
  ];

  if (!validKeys.includes(key)) {
    throw new ApiError(
      'Invalid setting key',
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }

  // Update setting
  const walletService = new WalletService(supabase);
  await walletService.updatePlatformSettings(key, value, user.id);

  // Get updated settings
  const settings = await walletService.getPlatformSettings();

  return successResponse(
    { settings },
    'Settings updated successfully'
  );
});

