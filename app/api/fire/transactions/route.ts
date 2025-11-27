/**
 * Fire Transactions API
 * GET /api/fire/transactions - Get Fire transaction history
 */

import { NextRequest, NextResponse } from 'next/server';
import { FireService } from '@/lib/fire/service';
import { getAuthenticatedUser, isWorker } from '@/lib/fire/auth-helper';
import { getErrorMessage } from '@/lib/utils/common';
import { FireTransactionType } from '@/lib/utils/enums';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);

    if (authError || !user.id) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (!isWorker(user)) {
      return NextResponse.json(
        { error: 'Only workers can view Fire transactions' },
        { status: 403 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type') as FireTransactionType | undefined;
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined;

    // Get transactions
    const fireService = new FireService(supabase);
    const result = await fireService.getFireTransactions(user.id, {
      limit,
      offset,
      type,
      fromDate,
      toDate,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, 'Failed to fetch Fire transactions');
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
