/**
 * Escrow API
 * GET /api/wallet/escrow - Get user's escrows (as employer or worker)
 */

import { NextRequest } from 'next/server';
import { WalletService } from '@/lib/wallet/service';
import { EscrowFilters } from '@/lib/wallet/types';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse } from '@/lib/http/response';
import { withErrorHandling } from '@/lib/http/errors';
import { UserRole } from '@/lib/utils/enums';

/**
 * GET /api/wallet/escrow
 * Get escrows for the authenticated user
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const { user, profile, supabase } = await requireAuth(request);

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  
  const filters: EscrowFilters = {
    status: searchParams.get('status')?.split(',') as any,
    has_complaint: searchParams.get('has_complaint') === 'true' ? true : 
                   searchParams.get('has_complaint') === 'false' ? false : undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
  };

  // Set employer_id or worker_id based on role
  if (profile.role === UserRole.CLIENT) {
    filters.employer_id = user.id;
  } else if (profile.role === UserRole.WORKER) {
    filters.worker_id = user.id;
  }

  // Get escrows
  const walletService = new WalletService(supabase);
  const { escrows, total } = await walletService.getEscrows(filters);

  return successResponse({
    escrows,
    pagination: {
      total,
      page: filters.page,
      limit: filters.limit,
      pages: Math.ceil(total / filters.limit!),
    },
  });
});

