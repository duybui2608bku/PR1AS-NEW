/**
 * Bank Transfer Webhook Endpoint
 * Receives notifications from Sepay when user completes bank transfer
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createBankTransferService } from "@/lib/wallet/payment-gateways";
import { WalletService } from "@/lib/wallet/service";
import { BankWebhookData } from "@/lib/wallet/types";

// Initialize Supabase client with service role (for server-side operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/wallet/webhook/bank
 * Receive bank transfer notification from Sepay
 *
 * Expected payload:
 * {
 *   "gateway": "OCB",
 *   "transactionDate": "2025-06-15 00:09:00",
 *   "accountNumber": "0349337240",
 *   "subAccount": "SEPBND73333",
 *   "code": "DH23505",
 *   "content": "DH23505",
 *   "transferType": "in",
 *   "description": "BankAPINotify DH23505",
 *   "transferAmount": 2000,
 *   "referenceCode": "FT251673K4TV",
 *   "accumulated": 0,
 *   "id": 14966645
 * }
 */

export async function POST(request: NextRequest) {
  try {
    // Parse webhook payload
    const webhookData: BankWebhookData = await request.json();

    console.log("[Bank Webhook] Received:", {
      content: webhookData.content,
      amount: webhookData.transferAmount,
      reference: webhookData.referenceCode,
      id: webhookData.id,
    });

    // Validate webhook data
    if (
      !webhookData.content ||
      !webhookData.transferAmount ||
      !webhookData.accountNumber
    ) {
      console.error("[Bank Webhook] Invalid payload:", webhookData);
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Optional: Verify webhook signature if Sepay provides one
    // const signature = request.headers.get('x-webhook-signature');
    // if (signature) {
    //   const bankService = createBankTransferService();
    //   const isValid = bankService.verifyWebhookSignature(webhookData, signature, process.env.SEPAY_WEBHOOK_SECRET!);
    //   if (!isValid) {
    //     return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    //   }
    // }

    // Process webhook
    const bankService = createBankTransferService();
    const deposit = await bankService.processWebhook(supabase, webhookData);

    if (!deposit) {
      console.log(
        "[Bank Webhook] No matching deposit found or webhook ignored"
      );
      return NextResponse.json({
        success: true,
        message: "Webhook received but no action taken",
      });
    }

    // Credit user wallet
    const walletService = new WalletService(supabase);

    try {
      // Create deposit transaction
      const transaction = await walletService.createTransaction({
        user_id: deposit.user_id,
        type: "deposit",
        amount_usd: deposit.amount_usd,
        payment_method: "bank_transfer",
        payment_gateway_id:
          deposit.bank_reference_code || webhookData.referenceCode,
        status: "processing",
        description: `Bank deposit via ${webhookData.gateway}`,
        metadata: {
          bank_transaction_id: webhookData.id,
          reference_code: webhookData.referenceCode,
          transfer_content: webhookData.content,
          amount_vnd: webhookData.transferAmount,
          webhook_data: webhookData,
        },
      });

      // Update wallet balance
      const wallet = await walletService.getOrCreateWallet(deposit.user_id);
      await supabase
        .from("wallets")
        .update({
          balance_usd: wallet.balance_usd + deposit.amount_usd,
          total_earned_usd: wallet.total_earned_usd + deposit.amount_usd,
        })
        .eq("user_id", deposit.user_id);

      // Mark transaction as completed
      await walletService.updateTransactionStatus(transaction.id, "completed");

      // Update deposit status and link transaction
      await supabase
        .from("bank_deposits")
        .update({
          status: "completed",
          transaction_id: transaction.id,
          completed_at: new Date().toISOString(),
        })
        .eq("id", deposit.id);

      console.log("[Bank Webhook] Deposit completed:", {
        depositId: deposit.id,
        userId: deposit.user_id,
        amount: deposit.amount_usd,
        transactionId: transaction.id,
      });

      return NextResponse.json({
        success: true,
        message: "Deposit processed successfully",
        data: {
          depositId: deposit.id,
          transactionId: transaction.id,
          amount: deposit.amount_usd,
        },
      });
    } catch (error) {
      console.error("[Bank Webhook] Failed to process deposit:", error);

      // Mark deposit as failed
      await supabase
        .from("bank_deposits")
        .update({
          status: "failed",
        })
        .eq("id", deposit.id);

      throw error;
    }
  } catch (error: any) {
    console.error("[Bank Webhook] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process webhook",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wallet/webhook/bank
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    service: "Bank Transfer Webhook",
    status: "active",
    timestamp: new Date().toISOString(),
  });
}
