/**
 * Admin Escrow Release API
 * POST /api/admin/wallet/escrow/release - Manually release an escrow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { WalletService } from '@/lib/wallet/service';

export async function POST(request: NextRequest) {
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
    const supabase = createAdminClient();

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access required',
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { escrow_id } = body;

    if (!escrow_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Escrow ID is required',
        },
        { status: 400 }
      );
    }

    // Release escrow
    const walletService = new WalletService(supabase);
    const transaction = await walletService.releaseEscrow(escrow_id, user.id);

    return NextResponse.json({
      success: true,
      message: 'Escrow released successfully',
      transaction,
    });
  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to release escrow',
        code: error.code,
      },
      { status: error.statusCode || 500 }
    );
  }
}

