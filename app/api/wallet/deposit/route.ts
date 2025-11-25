/**
 * Wallet Deposit API
 * POST /api/wallet/deposit - Initiate deposit (bank transfer or PayPal)
 */

import { NextRequest, NextResponse } from 'next/server';
import { WalletService } from '@/lib/wallet/service';
import { createBankTransferService, createPayPalService } from '@/lib/wallet/payment-gateways';
import { DepositRequest } from '@/lib/wallet/types';
import { getAuthenticatedUser } from '@/lib/wallet/auth-helper';
import { getErrorMessage } from '@/lib/utils/common';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, supabase, error: authError } = await getAuthenticatedUser(request);
    
    if (authError || !user.id) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: DepositRequest = await request.json();
    const { amount_usd, payment_method, metadata } = body;

    // Validate amount
    const walletService = new WalletService(supabase);
    const settings = await walletService.getPlatformSettings();

    if (amount_usd < settings.minimum_deposit_usd) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum deposit amount is $${settings.minimum_deposit_usd}`,
        },
        { status: 400 }
      );
    }

    // Handle bank transfer
    if (payment_method === 'bank_transfer') {
      const bankService = createBankTransferService();
      const amountVnd = (typeof metadata?.amount_vnd === 'number' ? metadata.amount_vnd : undefined) || Math.round(amount_usd * 24000);

      const deposit = await bankService.createDepositRequest(
        supabase,
        user.id,
        amount_usd,
        amountVnd
      );

      return NextResponse.json({
        success: true,
        message: 'Bank deposit request created. Please scan QR code to complete payment.',
        deposit: {
          id: deposit.id,
          qr_code_url: deposit.qr_code_url,
          transfer_content: deposit.transfer_content,
          bank_name: deposit.bank_name,
          bank_account: deposit.bank_account,
          amount_usd: deposit.amount_usd,
          amount_vnd: deposit.amount_vnd,
          expires_at: deposit.expires_at,
        },
      });
    }

    // Handle PayPal
    if (payment_method === 'paypal') {
      const paypalService = createPayPalService();
      const order = await paypalService.createDepositOrder(amount_usd, user.id);

      // Create pending transaction
      const transaction = await walletService.createTransaction({
        user_id: user.id,
        type: 'deposit',
        amount_usd,
        payment_method: 'paypal',
        payment_gateway_id: order.orderId,
        status: 'pending',
        description: 'PayPal deposit',
        metadata: {
          ...metadata,
          paypal_order_id: order.orderId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'PayPal order created. Redirect user to approval URL.',
        paypal: {
          order_id: order.orderId,
          approval_url: order.approvalUrl,
        },
        transaction_id: transaction.id,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid payment method',
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error, 'Failed to process deposit');
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

