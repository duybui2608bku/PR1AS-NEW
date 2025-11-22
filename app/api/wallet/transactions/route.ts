/**
 * Wallet Transactions API
 * GET /api/wallet/transactions - Get user's transaction history with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { WalletService } from '@/lib/wallet/service';
import { TransactionFilters } from '@/lib/wallet/types';
import { getAuthenticatedUser } from '@/lib/wallet/auth-helper';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user.id) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const filters: TransactionFilters = {
      user_id: user.id,
      type: searchParams.get('type')?.split(',') as any,
      status: searchParams.get('status')?.split(',') as any,
      payment_method: searchParams.get('payment_method')?.split(',') as any,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      min_amount: searchParams.get('min_amount') ? Number(searchParams.get('min_amount')) : undefined,
      max_amount: searchParams.get('max_amount') ? Number(searchParams.get('max_amount')) : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    };

    // Get transactions
    const walletService = new WalletService(supabase);
    const { transactions, total } = await walletService.getTransactions(filters);

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        pages: Math.ceil(total / filters.limit!),
      },
    });
  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch transactions',
      },
      { status: 500 }
    );
  }
}

