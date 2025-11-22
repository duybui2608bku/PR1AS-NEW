/**
 * Payment Gateway Integrations
 * Handles external payment processing (Bank Transfer QR, PayPal, etc.)
 */

import { createClient } from '@supabase/supabase-js';
import {
  BankDeposit,
  BankWebhookData,
  WalletError,
  WalletErrorCodes,
} from './types';

// =============================================================================
// BANK TRANSFER SERVICE (Vietnam - Sepay QR)
// =============================================================================

export interface BankTransferConfig {
  bank: string;
  account: string;
  baseUrl: string;
}

export class BankTransferService {
  private config: BankTransferConfig = {
    bank: process.env.BANK_CODE || 'OCB',
    account: process.env.BANK_ACCOUNT || '0349337240',
    baseUrl: process.env.BANK_QR_URL || 'https://qr.sepay.vn/img',
  };

  /**
   * Generate unique transfer content code
   * Format: ND + timestamp + random
   */
  generateTransferContent(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ND${timestamp}${random}`;
  }

  /**
   * Generate QR code URL for bank transfer using Sepay
   * Doc: https://qr.sepay.vn
   * Templates: compact | compact2 | print | qr_only
   */
  generateQRCode(params: {
    amount: number;
    content: string;
    template?: 'compact' | 'compact2' | 'print' | 'qr_only';
  }): string {
    const { amount, content, template = 'compact2' } = params;

    const queryParams = new URLSearchParams({
      acc: this.config.account,
      bank: this.config.bank,
      amount: amount.toString(),
      des: content,
      template: template,
    });

    return `${this.config.baseUrl}?${queryParams.toString()}`;
  }

  /**
   * Create bank deposit request
   */
  async createDepositRequest(
    supabase: ReturnType<typeof createClient>,
    userId: string,
    amountUsd: number,
    amountVnd?: number
  ): Promise<BankDeposit> {
    // Generate unique transfer content
    const transferContent = this.generateTransferContent();

    // Generate QR code URL
    const qrCodeUrl = this.generateQRCode({
      amount: amountVnd || Math.round(amountUsd * 24000), // Default conversion rate: 1 USD = 24,000 VND
      content: transferContent,
    });

    // Set expiration (30 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Create bank deposit record
    const { data, error } = await supabase
      .from('bank_deposits')
      .insert({
        user_id: userId,
        amount_usd: amountUsd,
        amount_vnd: amountVnd || Math.round(amountUsd * 24000),
        qr_code_url: qrCodeUrl,
        bank_account: this.config.account,
        bank_name: this.config.bank,
        transfer_content: transferContent,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new WalletError('Failed to create bank deposit request', 'DEPOSIT_CREATE_ERROR', 500);
    }

    return data as BankDeposit;
  }

  /**
   * Verify webhook signature (if needed)
   * Note: Sepay might provide webhook signature verification
   */
  verifyWebhookSignature(payload: unknown, signature: string, secret: string): boolean {
    // Implement signature verification if Sepay provides it
    // For now, return true (you should implement proper verification)
    return true;
  }

  /**
   * Process bank webhook notification
   */
  async processWebhook(
    supabase: ReturnType<typeof createClient>,
    webhookData: BankWebhookData
  ): Promise<BankDeposit | null> {
    const {
      gateway,
      transactionDate,
      accountNumber,
      content,
      transferType,
      transferAmount,
      referenceCode,
      id,
    } = webhookData;

    // Validate webhook data
    if (transferType !== 'in') {
      return null;
    }

    if (accountNumber !== this.config.account) {
      return null;
    }

    // Extract transfer content code (should be in format ND...)
    const contentMatch = content.match(/ND\d+/i);
    if (!contentMatch) {
      return null;
    }

    const transferContent = contentMatch[0];

    // Find matching deposit request
    const { data: deposit, error } = await supabase
      .from('bank_deposits')
      .select('*')
      .eq('transfer_content', transferContent)
      .eq('status', 'pending')
      .single();

    if (error || !deposit) {
      return null;
    }

    // Check if already processed
    if (deposit.webhook_received) {
      return deposit as BankDeposit;
    }

    // Verify amount matches (with some tolerance for exchange rate fluctuation)
    const expectedVnd = deposit.amount_vnd || 0;
    const receivedVnd = transferAmount;
    const tolerance = expectedVnd * 0.02; // 2% tolerance

    if (Math.abs(receivedVnd - expectedVnd) > tolerance) {
      // Still process but mark for manual review
    }

    // Update deposit record
    const { data: updated, error: updateError } = await supabase
      .from('bank_deposits')
      .update({
        status: 'verifying',
        webhook_received: true,
        webhook_data: webhookData,
        bank_reference_code: referenceCode,
        bank_transaction_id: id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', deposit.id)
      .select()
      .single();

    if (updateError) {
      throw new WalletError('Failed to update deposit record', 'DEPOSIT_UPDATE_ERROR', 500);
    }

    return updated as BankDeposit;
  }

  /**
   * Complete bank deposit (credit wallet)
   */
  async completeDeposit(
    supabase: ReturnType<typeof createClient>,
    depositId: string
  ): Promise<BankDeposit> {
    const { data, error } = await supabase
      .from('bank_deposits')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', depositId)
      .select()
      .single();

    if (error) {
      throw new WalletError('Failed to complete deposit', 'DEPOSIT_COMPLETE_ERROR', 500);
    }

    return data as BankDeposit;
  }

  /**
   * Expire old pending deposits
   */
  async expireOldDeposits(supabase: ReturnType<typeof createClient>): Promise<number> {
    const { data, error } = await supabase
      .from('bank_deposits')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString())
      .select();

    if (error) {
      return 0;
    }

    return data?.length || 0;
  }
}

// =============================================================================
// PAYPAL SERVICE
// =============================================================================

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: 'sandbox' | 'live';
  baseUrl: string;
}

export class PayPalService {
  private config: PayPalConfig;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config?: Partial<PayPalConfig>) {
    this.config = {
      clientId: process.env.PAYPAL_CLIENT_ID || '',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
      mode: (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox',
      baseUrl: process.env.PAYPAL_MODE === 'live' 
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com',
      ...config,
    };
  }

  /**
   * Get PayPal access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const auth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString('base64');

    const response = await fetch(`${this.config.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new WalletError(
        'Failed to get PayPal access token',
        WalletErrorCodes.PAYMENT_GATEWAY_ERROR,
        500
      );
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

    return this.accessToken;
  }

  /**
   * Create PayPal order for deposit
   */
  async createDepositOrder(amountUsd: number, userId: string): Promise<{
    orderId: string;
    approvalUrl: string;
  }> {
    const accessToken = await this.getAccessToken();

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amountUsd.toFixed(2),
        },
        description: `Wallet deposit - User ${userId}`,
        custom_id: userId,
      }],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet/deposit/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet/deposit/cancel`,
        brand_name: 'PR1AS Platform',
        user_action: 'PAY_NOW',
      },
    };

    const response = await fetch(`${this.config.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new WalletError(
        'Failed to create PayPal order',
        WalletErrorCodes.PAYMENT_GATEWAY_ERROR,
        500
      );
    }

    const order = await response.json();
    interface PayPalLink {
      rel: string;
      href: string;
    }
    const approvalUrl = (order.links as PayPalLink[]).find((link) => link.rel === 'approve')?.href;

    return {
      orderId: order.id,
      approvalUrl,
    };
  }

  /**
   * Capture PayPal order (complete payment)
   */
  async captureOrder(orderId: string): Promise<Record<string, unknown>> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.config.baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new WalletError(
        'Failed to capture PayPal payment',
        WalletErrorCodes.PAYMENT_GATEWAY_ERROR,
        500
      );
    }

    return await response.json() as Record<string, unknown>;
  }

  /**
   * Create PayPal payout for withdrawal
   */
  async createPayout(params: {
    recipientEmail: string;
    amountUsd: number;
    note: string;
    userId: string;
  }): Promise<{ payoutBatchId: string; payoutItemId: string }> {
    const accessToken = await this.getAccessToken();
    const { recipientEmail, amountUsd, note, userId } = params;

    const payoutData = {
      sender_batch_header: {
        sender_batch_id: `PAYOUT_${userId}_${Date.now()}`,
        email_subject: 'You have a payout from PR1AS Platform',
        email_message: note || 'You have received a payout.',
      },
      items: [{
        recipient_type: 'EMAIL',
        amount: {
          value: amountUsd.toFixed(2),
          currency: 'USD',
        },
        receiver: recipientEmail,
        note: note || 'Wallet withdrawal',
        sender_item_id: `${userId}_${Date.now()}`,
      }],
    };

    const response = await fetch(`${this.config.baseUrl}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payoutData),
    });

    if (!response.ok) {
      throw new WalletError(
        'Failed to create PayPal payout',
        WalletErrorCodes.PAYMENT_GATEWAY_ERROR,
        500
      );
    }

    const result = await response.json();

    return {
      payoutBatchId: result.batch_header.payout_batch_id,
      payoutItemId: result.items[0].payout_item_id,
    };
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(payoutItemId: string): Promise<Record<string, unknown>> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.config.baseUrl}/v1/payments/payouts-item/${payoutItemId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new WalletError(
        'Failed to get payout status',
        WalletErrorCodes.PAYMENT_GATEWAY_ERROR,
        500
      );
    }

    return await response.json() as Record<string, unknown>;
  }
}

// =============================================================================
// FACTORY & EXPORTS
// =============================================================================

export function createBankTransferService(): BankTransferService {
  return new BankTransferService();
}

export function createPayPalService(config?: Partial<PayPalConfig>): PayPalService {
  return new PayPalService(config);
}

