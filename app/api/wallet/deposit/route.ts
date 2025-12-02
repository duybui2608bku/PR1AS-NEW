/**
 * Wallet Deposit API
 * POST /api/wallet/deposit - Initiate deposit (bank transfer or PayPal)
 */

import { NextRequest } from 'next/server';
import { WalletService } from '@/lib/wallet/service';
import { createBankTransferService, createPayPalService } from '@/lib/wallet/payment-gateways';
import { DepositRequest } from '@/lib/wallet/types';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse } from '@/lib/http/response';
import { withErrorHandling, ApiError, ErrorCode } from '@/lib/http/errors';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/constants/errors';
import { HttpStatus } from '@/lib/utils/enums';

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const { user, supabase } = await requireAuth(request);

    // Parse request body
    const body: DepositRequest = await request.json();
    const { amount_usd, payment_method, metadata } = body;

    // Validate amount
    const walletService = new WalletService(supabase);
    const settings = await walletService.getPlatformSettings();

    if (amount_usd < settings.minimum_deposit_usd) {
      throw new ApiError(
        `Minimum deposit amount is $${settings.minimum_deposit_usd}`,
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
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

      return successResponse(
        {
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
        },
        'Bank deposit request created. Please scan QR code to complete payment.'
      );
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

      return successResponse(
        {
          paypal: {
            order_id: order.orderId,
            approval_url: order.approvalUrl,
          },
          transaction_id: transaction.id,
        },
        'PayPal order created. Redirect user to approval URL.'
      );
    }

    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.INVALID_PAYMENT_METHOD),
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_PAYMENT_METHOD
    );
});

