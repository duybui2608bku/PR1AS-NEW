/**
 * Escrow Complaint API
 * POST /api/wallet/escrow/complaint - File a complaint for an escrow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WalletService } from '@/lib/wallet/service';
import { ComplaintRequest } from '@/lib/wallet/types';

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

    // Parse request body
    const body: ComplaintRequest = await request.json();
    const { escrow_id, description } = body;

    if (!escrow_id || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Escrow ID and description are required',
        },
        { status: 400 }
      );
    }

    // File complaint
    const walletService = new WalletService(supabase);
    const escrow = await walletService.fileComplaint(body, user.id);

    return NextResponse.json({
      success: true,
      message: 'Complaint filed successfully. Payment is now held pending admin review.',
      escrow,
    });
  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to file complaint',
        code: error.code,
      },
      { status: error.statusCode || 500 }
    );
  }
}

