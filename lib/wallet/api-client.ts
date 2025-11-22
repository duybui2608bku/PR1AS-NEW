/**
 * Wallet API Client
 * Client-side helpers to call wallet API routes
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import {
  Wallet,
  Transaction,
  EscrowHold,
  BankDeposit,
  PlatformSettings,
  WalletSummary,
  DepositRequest,
  WithdrawalRequest,
  PaymentRequest,
  ComplaintRequest,
  ComplaintResolution,
  TransactionFilters,
  EscrowFilters,
  WalletResponse,
  TransactionResponse,
  TransactionsListResponse,
  EscrowResponse,
  PaymentResponse,
  DepositResponse,
  WithdrawalResponse,
  SettingsResponse,
  FeeCalculationResponse,
  AdminWalletStats,
} from './types';

/**
 * Get authorization header with current user's token
 */
async function getAuthHeader(): Promise<string> {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return `Bearer ${session.access_token}`;
}

/**
 * Wallet API Client
 */
export const walletAPI = {
  // ===========================================================================
  // WALLET OPERATIONS
  // ===========================================================================

  /**
   * Get user's wallet balance and summary
   */
  async getBalance(): Promise<{ wallet: Wallet; summary: WalletSummary }> {
    const response = await fetch('/api/wallet/balance', {
      credentials: 'include', // Send httpOnly cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch balance');
    }

    return response.json();
  },

  // ===========================================================================
  // DEPOSIT OPERATIONS
  // ===========================================================================

  /**
   * Initiate deposit (bank transfer or PayPal)
   */
  async deposit(request: DepositRequest): Promise<DepositResponse> {
    const response = await fetch('/api/wallet/deposit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send httpOnly cookies
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to initiate deposit');
    }

    return response.json();
  },

  /**
   * Create bank transfer deposit (get QR code)
   */
  async depositBankTransfer(amountUsd: number, amountVnd?: number): Promise<{
    deposit: BankDeposit;
    qr_code_url: string;
  }> {
    const result = await this.deposit({
      amount_usd: amountUsd,
      payment_method: 'bank_transfer',
      metadata: { amount_vnd: amountVnd },
    });

    return {
      deposit: result.deposit!,
      qr_code_url: result.qr_code_url!,
    };
  },

  /**
   * Create PayPal deposit
   */
  async depositPayPal(amountUsd: number): Promise<{
    order_id: string;
    approval_url: string;
    transaction_id: string;
  }> {
    const result = await this.deposit({
      amount_usd: amountUsd,
      payment_method: 'paypal',
    });

    return {
      order_id: result.deposit?.id || '',
      approval_url: result.qr_code_url || '', // Reuse field for approval URL
      transaction_id: result.transaction?.id || '',
    };
  },

  // ===========================================================================
  // WITHDRAWAL OPERATIONS
  // ===========================================================================

  /**
   * Request withdrawal
   */
  async withdraw(request: WithdrawalRequest): Promise<WithdrawalResponse> {
    const response = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send httpOnly cookies
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request withdrawal');
    }

    return response.json();
  },

  /**
   * Withdraw to PayPal
   */
  async withdrawPayPal(amountUsd: number, paypalEmail: string): Promise<Transaction> {
    const result = await this.withdraw({
      amount_usd: amountUsd,
      payment_method: 'paypal',
      destination: {
        paypal_email: paypalEmail,
      },
    });

    return result.transaction;
  },

  /**
   * Withdraw to bank account
   */
  async withdrawBank(
    amountUsd: number,
    bankAccount: string,
    bankName: string,
    accountHolder: string
  ): Promise<Transaction> {
    const result = await this.withdraw({
      amount_usd: amountUsd,
      payment_method: 'bank_transfer',
      destination: {
        bank_account: bankAccount,
        bank_name: bankName,
        account_holder: accountHolder,
      },
    });

    return result.transaction;
  },

  // ===========================================================================
  // TRANSACTION HISTORY
  // ===========================================================================

  /**
   * Get transaction history with filters
   */
  async getTransactions(filters?: TransactionFilters): Promise<TransactionsListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.type) params.set('type', filters.type.join(','));
      if (filters.status) params.set('status', filters.status.join(','));
      if (filters.payment_method) params.set('payment_method', filters.payment_method.join(','));
      if (filters.date_from) params.set('date_from', filters.date_from);
      if (filters.date_to) params.set('date_to', filters.date_to);
      if (filters.min_amount) params.set('min_amount', filters.min_amount.toString());
      if (filters.max_amount) params.set('max_amount', filters.max_amount.toString());
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());
    }

    const response = await fetch(`/api/wallet/transactions?${params.toString()}`, {
      credentials: 'include', // Send httpOnly cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch transactions');
    }

    return response.json();
  },

  // ===========================================================================
  // PAYMENT & ESCROW
  // ===========================================================================

  /**
   * Make payment to worker (employer only)
   */
  async makePayment(payment: PaymentRequest): Promise<PaymentResponse> {
    const authHeader = await getAuthHeader();
    const response = await fetch('/api/wallet/payment', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to process payment');
    }

    return response.json();
  },

  /**
   * Get escrows (as employer or worker)
   */
  async getEscrows(filters?: EscrowFilters): Promise<{
    escrows: EscrowHold[];
    pagination: Record<string, unknown>;
  }> {
    const authHeader = await getAuthHeader();
    const params = new URLSearchParams();

    if (filters) {
      if (filters.status) params.set('status', filters.status.join(','));
      if (filters.has_complaint !== undefined) params.set('has_complaint', filters.has_complaint.toString());
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());
    }

    const response = await fetch(`/api/wallet/escrow?${params.toString()}`, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch escrows');
    }

    return response.json();
  },

  /**
   * File complaint for escrow
   */
  async fileComplaint(escrowId: string, description: string): Promise<EscrowHold> {
    const authHeader = await getAuthHeader();
    const response = await fetch('/api/wallet/escrow/complaint', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ escrow_id: escrowId, description }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to file complaint');
    }

    const result = await response.json();
    return result.escrow;
  },

  // ===========================================================================
  // FEE CALCULATION
  // ===========================================================================

  /**
   * Calculate fees for a given amount
   */
  async calculateFees(amount: number): Promise<FeeCalculationResponse> {
    const response = await fetch(`/api/wallet/fees?amount=${amount}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to calculate fees');
    }

    return response.json();
  },
};

/**
 * Admin Wallet API Client
 */
export const adminWalletAPI = {
  /**
   * Get platform wallet statistics
   */
  async getStats(): Promise<AdminWalletStats> {
    const authHeader = await getAuthHeader();
    const response = await fetch('/api/admin/wallet/stats', {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch statistics');
    }

    const result = await response.json();
    return result.stats;
  },

  /**
   * Get platform settings
   */
  async getSettings(): Promise<PlatformSettings> {
    const authHeader = await getAuthHeader();
    const response = await fetch('/api/admin/wallet/settings', {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch settings');
    }

    const result = await response.json();
    return result.settings;
  },

  /**
   * Update platform setting
   */
  async updateSetting(key: string, value: unknown): Promise<PlatformSettings> {
    const authHeader = await getAuthHeader();
    const response = await fetch('/api/admin/wallet/settings', {
      method: 'PUT',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update setting');
    }

    const result = await response.json();
    return result.settings;
  },

  /**
   * Manually release escrow
   */
  async releaseEscrow(escrowId: string): Promise<Transaction> {
    const authHeader = await getAuthHeader();
    const response = await fetch('/api/admin/wallet/escrow/release', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ escrow_id: escrowId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to release escrow');
    }

    const result = await response.json();
    return result.transaction;
  },

  /**
   * Resolve complaint
   */
  async resolveComplaint(resolution: ComplaintResolution): Promise<EscrowHold> {
    const authHeader = await getAuthHeader();
    const response = await fetch('/api/admin/wallet/escrow/resolve', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resolution),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to resolve complaint');
    }

    const result = await response.json();
    return result.escrow;
  },
};

/**
 * Helper functions
 */
export const walletHelpers = {
  /**
   * Format USD amount
   */
  formatUSD(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  },

  /**
   * Format VND amount
   */
  formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  },

  /**
   * Get transaction type label
   */
  getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      payment: 'Payment',
      earning: 'Earning',
      platform_fee: 'Platform Fee',
      insurance_fee: 'Insurance Fee',
      refund: 'Refund',
      escrow_hold: 'Escrow Hold',
      escrow_release: 'Escrow Release',
    };

    return labels[type] || type;
  },

  /**
   * Get transaction status color
   */
  getTransactionStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'orange',
      processing: 'blue',
      completed: 'green',
      failed: 'red',
      cancelled: 'gray',
    };

    return colors[status] || 'default';
  },

  /**
   * Get escrow status color
   */
  getEscrowStatusColor(status: string): string {
    const colors: Record<string, string> = {
      held: 'blue',
      released: 'green',
      refunded: 'orange',
      disputed: 'red',
      cancelled: 'gray',
    };

    return colors[status] || 'default';
  },
};

