/**
 * Escrow API
 * GET /api/wallet/escrow - Get user's escrows (as employer or worker)
 * POST /api/wallet/escrow/complaint - File a complaint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WalletService } from '@/lib/wallet/service';
import { EscrowFilters, ComplaintRequest } from '@/lib/wallet/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/wallet/escrow
 * Get escrows for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

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
    if (profile?.role === 'client') {
      filters.employer_id = user.id;
    } else if (profile?.role === 'worker') {
      filters.worker_id = user.id;
    }

    // Get escrows
    const walletService = new WalletService(supabase);
    const { escrows, total } = await walletService.getEscrows(filters);

    return NextResponse.json({
      success: true,
      escrows,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        pages: Math.ceil(total / filters.limit!),
      },
    });
  } catch (error: any) {
    console.error('[Wallet Escrow] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch escrows',
      },
      { status: 500 }
    );
  }
}

