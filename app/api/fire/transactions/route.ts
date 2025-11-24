/**
 * GET /api/fire/transactions
 * Get worker's Fire transaction history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FireService } from '@/lib/fire/service';
import { GetFireTransactionsResponse, FireTransactionType } from '@/lib/fire/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<GetFireTransactionsResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get worker profile
    const { data: workerProfile, error: profileError } = await supabase
      .from('worker_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !workerProfile) {
      return NextResponse.json<GetFireTransactionsResponse>(
        { success: false, error: 'Worker profile not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const type = searchParams.get('type') as FireTransactionType | undefined;

    // Validate pagination
    if (page < 1 || perPage < 1 || perPage > 100) {
      return NextResponse.json<GetFireTransactionsResponse>(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Get transactions
    const fireService = new FireService(supabase);
    const offset = (page - 1) * perPage;

    const result = await fireService.getTransactions(workerProfile.id, {
      limit: perPage,
      offset,
      type,
    });

    const totalPages = Math.ceil(result.total / perPage);

    return NextResponse.json<GetFireTransactionsResponse>({
      success: true,
      data: {
        transactions: result.transactions,
        pagination: {
          total: result.total,
          page,
          per_page: perPage,
          total_pages: totalPages,
        },
      },
    });
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return NextResponse.json<GetFireTransactionsResponse>(
      { success: false, error: error.message || 'Failed to fetch transactions' },
      { status: error.statusCode || 500 }
    );
  }
}
