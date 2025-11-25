/**
 * Admin Platform Settings API
 * GET /api/admin/wallet/settings - Get platform settings
 * PUT /api/admin/wallet/settings - Update platform settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { WalletService } from '@/lib/wallet/service';
import { SupabaseClient } from '@supabase/supabase-js';

async function verifyAdmin(token: string, supabase: SupabaseClient<any>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new Error('Invalid token');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null };

  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
}

/**
 * GET /api/admin/wallet/settings
 * Get all platform settings
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createAdminClient();

    await verifyAdmin(token, supabase);

    // Get settings
    const walletService = new WalletService(supabase);
    const settings = await walletService.getPlatformSettings();

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch settings',
      },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}

/**
 * PUT /api/admin/wallet/settings
 * Update platform settings
 */
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createAdminClient();

    const user = await verifyAdmin(token, supabase);

    // Parse request body
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: 'Setting key is required',
        },
        { status: 400 }
      );
    }

    // Validate setting key exists
    const validKeys = [
      'payment_fees_enabled',
      'platform_fee_percentage',
      'insurance_fund_percentage',
      'escrow_cooling_period_days',
      'minimum_deposit_usd',
      'minimum_withdrawal_usd',
      'bank_transfer_info',
    ];

    if (!validKeys.includes(key)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid setting key',
        },
        { status: 400 }
      );
    }

    // Update setting
    const walletService = new WalletService(supabase);
    await walletService.updatePlatformSettings(key, value, user.id);

    // Get updated settings
    const settings = await walletService.getPlatformSettings();

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update settings',
      },
      { status: error.message === 'Admin access required' ? 403 : 500 }
    );
  }
}

