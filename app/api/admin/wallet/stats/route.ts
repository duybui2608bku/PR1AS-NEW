/**
 * Admin Wallet Statistics API
 * GET /api/admin/wallet/stats - Get platform-wide wallet statistics
 */

import { NextRequest } from 'next/server';
import { WalletService } from '@/lib/wallet/service';
import { requireAdmin } from '@/lib/auth/middleware';
import { successResponse } from '@/lib/http/response';
import { withErrorHandling } from '@/lib/http/errors';

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase } = await requireAdmin(request);

  // Get statistics
  const walletService = new WalletService(supabase);
  const stats = await walletService.getAdminStats();

  return successResponse({ stats });
});

