/**
 * Admin Escrow Resolution API
 * POST /api/admin/wallet/escrow/resolve - Resolve a disputed escrow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WalletService } from '@/lib/wallet/service';
import { ComplaintResolution } from '@/lib/wallet/types';

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
    const body: ComplaintResolution = await request.json();
    const { escrow_id, action, worker_amount, employer_refund, resolution_notes } = body;

    // Validate required fields
    if (!escrow_id || !action || !resolution_notes) {
      return NextResponse.json(
        {
          success: false,
          error: 'Escrow ID, action, and resolution notes are required',
        },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['release_to_worker', 'refund_to_employer', 'partial_refund'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Must be: release_to_worker, refund_to_employer, or partial_refund',
        },
        { status: 400 }
      );
    }

    // For partial refund, validate amounts
    if (action === 'partial_refund') {
      if (!worker_amount || !employer_refund) {
        return NextResponse.json(
          {
            success: false,
            error: 'Worker amount and employer refund are required for partial refund',
          },
          { status: 400 }
        );
      }
    }

    // Resolve complaint
    const walletService = new WalletService(supabase);
    const escrow = await walletService.resolveComplaint(body, user.id);

    return NextResponse.json({
      success: true,
      message: 'Complaint resolved successfully',
      escrow,
    });
  } catch (error: any) {
    console.error('[Admin Escrow Resolve] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to resolve complaint',
        code: error.code,
      },
      { status: error.statusCode || 500 }
    );
  }
}

