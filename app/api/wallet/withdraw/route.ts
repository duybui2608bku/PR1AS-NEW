/**
 * Wallet Withdrawal API
 * POST /api/wallet/withdraw - Request withdrawal to PayPal or bank
 */

import { NextRequest, NextResponse } from 'next/server';
import { WalletService } from '@/lib/wallet/service';
import { createPayPalService } from '@/lib/wallet/payment-gateways';
import { WithdrawalRequest, WalletErrorCodes } from '@/lib/wallet/types';
import { getAuthenticatedUser } from '@/lib/wallet/auth-helper';

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
    const body: WithdrawalRequest = await request.json();
    const { amount_usd, payment_method, destination, metadata } = body;

    // Get wallet service and settings
    const walletService = new WalletService(supabase);
    const settings = await walletService.getPlatformSettings();

    // Validate amount
    if (amount_usd < settings.minimum_withdrawal_usd) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum withdrawal amount is $${settings.minimum_withdrawal_usd}`,
        },
        { status: 400 }
      );
    }

    // Check balance
    const hasBalance = await walletService.checkBalance(user.id, amount_usd);
    if (!hasBalance) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient balance',
          code: WalletErrorCodes.INSUFFICIENT_BALANCE,
        },
        { status: 400 }
      );
    }

    // Get user profile for additional info
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Handle PayPal withdrawal
    if (payment_method === 'paypal') {
      if (!destination.paypal_email) {
        return NextResponse.json(
          {
            success: false,
            error: 'PayPal email is required',
          },
          { status: 400 }
        );
      }

      // Create withdrawal transaction (pending)
      const transaction = await walletService.createTransaction({
        user_id: user.id,
        type: 'withdrawal',
        amount_usd,
        payment_method: 'paypal',
        status: 'processing',
        description: `Withdrawal to PayPal: ${destination.paypal_email}`,
        metadata: {
          ...metadata,
          destination,
        },
      });

      try {
        // Process PayPal payout
        const paypalService = createPayPalService();
        const payout = await paypalService.createPayout({
          recipientEmail: destination.paypal_email,
          amountUsd: amount_usd,
          note: `Withdrawal from PR1AS Platform`,
          userId: user.id,
        });

        // Deduct from wallet
        await supabase
          .from('wallets')
          .update({
            balance_usd: supabase.raw(`balance_usd - ${amount_usd}`),
            total_spent_usd: supabase.raw(`total_spent_usd + ${amount_usd}`),
          })
          .eq('user_id', user.id);

        // Update transaction with payout info
        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            payment_gateway_id: payout.payoutItemId,
            completed_at: new Date().toISOString(),
            metadata: {
              ...metadata,
              destination,
              payout_batch_id: payout.payoutBatchId,
              payout_item_id: payout.payoutItemId,
            },
          })
          .eq('id', transaction.id);

        return NextResponse.json({
          success: true,
          message: 'Withdrawal processed successfully',
          transaction: {
            id: transaction.id,
            amount_usd,
            status: 'completed',
            payout_id: payout.payoutItemId,
          },
        });
      } catch (error: any) {
        // Mark transaction as failed
        await walletService.updateTransactionStatus(
          transaction.id,
          'failed',
          error.message
        );

        throw error;
      }
    }

    // Handle bank transfer withdrawal
    if (payment_method === 'bank_transfer') {
      if (!destination.bank_account || !destination.bank_name || !destination.account_holder) {
        return NextResponse.json(
          {
            success: false,
            error: 'Bank account details are required (bank_account, bank_name, account_holder)',
          },
          { status: 400 }
        );
      }

      // Create withdrawal transaction (manual processing required)
      const transaction = await walletService.createTransaction({
        user_id: user.id,
        type: 'withdrawal',
        amount_usd,
        payment_method: 'bank_transfer',
        status: 'pending',
        description: `Withdrawal to bank: ${destination.bank_name} - ${destination.bank_account}`,
        metadata: {
          ...metadata,
          destination,
          requires_manual_processing: true,
        },
      });

      // Deduct from wallet (move to pending)
      await supabase
        .from('wallets')
        .update({
          balance_usd: supabase.raw(`balance_usd - ${amount_usd}`),
          pending_usd: supabase.raw(`pending_usd + ${amount_usd}`),
        })
        .eq('user_id', user.id);

      return NextResponse.json({
        success: true,
        message: 'Withdrawal request submitted. Manual processing required (1-3 business days).',
        transaction: {
          id: transaction.id,
          amount_usd,
          status: 'pending',
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid payment method',
      },
      { status: 400 }
    );
  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process withdrawal',
      },
      { status: 500 }
    );
  }
}

