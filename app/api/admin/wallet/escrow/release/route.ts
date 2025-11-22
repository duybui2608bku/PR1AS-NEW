/**
 * Admin Escrow Release API
 * POST /api/admin/wallet/escrow/release - Manually release an escrow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WalletService } from '@/lib/wallet/service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    console.error('[Admin Escrow Release] Error:', error);
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

