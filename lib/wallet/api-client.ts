/**
 * Wallet API Client
 * Client-side helpers to call wallet API routes
 */

import { axiosClient } from "@/lib/http/axios-client";
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
  ComplaintResolution,
  TransactionFilters,
  EscrowFilters,
  TransactionsListResponse,
  PaymentResponse,
  DepositResponse,
  WithdrawalResponse,
  FeeCalculationResponse,
  AdminWalletStats,
} from "./types";

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
    const { data } = await axiosClient.get<{
      success: boolean;
      data: {
        wallet: Wallet;
        summary: WalletSummary;
      };
    }>("/wallet/balance");

    // Extract data from API response wrapper
    return data.data;
  },

  // ===========================================================================
  // DEPOSIT OPERATIONS
  // ===========================================================================

  /**
   * Initiate deposit (bank transfer or PayPal)
   */
  async deposit(request: DepositRequest): Promise<DepositResponse> {
    const { data } = await axiosClient.post<DepositResponse>(
      "/wallet/deposit",
      request
    );

    return data;
  },

  /**
   * Alias for deposit (request deposit)
   */
  async requestDeposit(request: DepositRequest): Promise<DepositResponse> {
    return this.deposit(request);
  },

  /**
   * Create bank transfer deposit (get QR code)
   */
  async depositBankTransfer(
    amountUsd: number,
    amountVnd?: number
  ): Promise<{
    deposit: BankDeposit;
    qr_code_url: string;
  }> {
    const result = await this.deposit({
      amount_usd: amountUsd,
      payment_method: "bank_transfer",
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
      payment_method: "paypal",
    });

    return {
      order_id: result.deposit?.id || "",
      approval_url: result.qr_code_url || "", // Reuse field for approval URL
      transaction_id: result.transaction?.id || "",
    };
  },

  // ===========================================================================
  // WITHDRAWAL OPERATIONS
  // ===========================================================================

  /**
   * Request withdrawal
   */
  async withdraw(request: WithdrawalRequest): Promise<WithdrawalResponse> {
    const response = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Send httpOnly cookies
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to request withdrawal");
    }

    return response.json();
  },

  /**
   * Alias for withdraw (request withdrawal)
   */
  async requestWithdrawal(
    request: WithdrawalRequest
  ): Promise<WithdrawalResponse> {
    return this.withdraw(request);
  },

  /**
   * Withdraw to PayPal
   */
  async withdrawPayPal(
    amountUsd: number,
    paypalEmail: string
  ): Promise<Transaction> {
    const result = await this.withdraw({
      amount_usd: amountUsd,
      payment_method: "paypal",
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
      payment_method: "bank_transfer",
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
  async getTransactions(
    filters?: TransactionFilters
  ): Promise<TransactionsListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.type) params.set("type", filters.type.join(","));
      if (filters.status) params.set("status", filters.status.join(","));
      if (filters.payment_method)
        params.set("payment_method", filters.payment_method.join(","));
      if (filters.date_from) params.set("date_from", filters.date_from);
      if (filters.date_to) params.set("date_to", filters.date_to);
      if (filters.min_amount)
        params.set("min_amount", filters.min_amount.toString());
      if (filters.max_amount)
        params.set("max_amount", filters.max_amount.toString());
      if (filters.page) params.set("page", filters.page.toString());
      if (filters.limit) params.set("limit", filters.limit.toString());
    }

    const { data } = await axiosClient.get<{
      success: boolean;
      data: {
        transactions: Transaction[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      };
    }>(`/wallet/transactions?${params.toString()}`);

    // Transform API response to match TransactionsListResponse interface
    return {
      success: data.success,
      transactions: data.data.transactions,
      total: data.data.pagination.total,
      page: data.data.pagination.page,
      limit: data.data.pagination.limit,
    };
  },

  // ===========================================================================
  // PAYMENT & ESCROW
  // ===========================================================================

  /**
   * Make payment to worker (employer only)
   * Uses cookies for authentication (via withCredentials: true in axios config)
   */
  async makePayment(payment: PaymentRequest): Promise<PaymentResponse> {
    // Note: Authentication is handled via cookies (withCredentials: true)
    // The API route uses requireClient() middleware which reads from cookies
    const { data } = await axiosClient.post<PaymentResponse>(
      "/wallet/payment",
      payment
    );

    return data;
  },

  /**
   * Get escrows (as employer or worker)
   * Uses cookies for authentication (via withCredentials: true in axios config)
   */
  async getEscrows(filters?: EscrowFilters): Promise<{
    escrows: EscrowHold[];
    pagination: Record<string, unknown>;
  }> {
    // Note: Authentication is handled via cookies (withCredentials: true)
    // The API route uses requireAuth() middleware which reads from cookies
    const params = new URLSearchParams();

    if (filters) {
      if (filters.status) params.set("status", filters.status.join(","));
      if (filters.has_complaint !== undefined)
        params.set("has_complaint", filters.has_complaint.toString());
      if (filters.page) params.set("page", filters.page.toString());
      if (filters.limit) params.set("limit", filters.limit.toString());
    }

    const { data } = await axiosClient.get<{
      escrows: EscrowHold[];
      pagination: Record<string, unknown>;
    }>(`/wallet/escrow?${params.toString()}`);

    return data;
  },

  /**
   * File complaint for escrow
   * Uses cookies for authentication (via withCredentials: true in axios config)
   */
  async fileComplaint(
    escrowId: string,
    description: string
  ): Promise<EscrowHold> {
    // Note: Authentication is handled via cookies (withCredentials: true)
    // The API route uses requireAuth() middleware which reads from cookies
    const { data } = await axiosClient.post<{
      escrow: EscrowHold;
    }>("/wallet/escrow/complaint", { escrow_id: escrowId, description });

    return data.escrow;
  },

  // ===========================================================================
  // FEE CALCULATION
  // ===========================================================================

  /**
   * Calculate fees for a given amount
   */
  async calculateFees(amount: number): Promise<FeeCalculationResponse> {
    const { data } = await axiosClient.get<FeeCalculationResponse>(
      `/wallet/fees?amount=${amount}`
    );

    return data;
  },

  // ===========================================================================
  // PLATFORM SETTINGS
  // ===========================================================================

  /**
   * Get platform settings
   * Note: This may require admin access depending on the endpoint implementation
   */
  async getPlatformSettings(): Promise<PlatformSettings> {
    const { data } = await axiosClient.get<{
      data: { settings: PlatformSettings };
    }>("/admin/wallet/settings");

    return data.data.settings;
  },
};

/**
 * Admin Wallet API Client
 * Uses cookies for authentication (via withCredentials: true in axios config)
 */
export const adminWalletAPI = {
  /**
   * Get platform wallet statistics
   * Uses cookies for authentication (via withCredentials: true in axios config)
   */
  async getStats(): Promise<AdminWalletStats> {
    // Note: Authentication is handled via cookies (withCredentials: true)
    // The API route uses requireAdmin() middleware which reads from cookies
    const { data } = await axiosClient.get<{ stats: AdminWalletStats }>(
      "/admin/wallet/stats"
    );

    return data.stats;
  },

  /**
   * Get platform settings
   * Uses cookies for authentication (via withCredentials: true in axios config)
   */
  async getSettings(): Promise<PlatformSettings> {
    // Note: Authentication is handled via cookies (withCredentials: true)
    // The API route uses requireAdmin() middleware which reads from cookies
    const { data } = await axiosClient.get<{ settings: PlatformSettings }>(
      "/admin/wallet/settings"
    );

    return data.settings;
  },

  /**
   * Update platform setting
   * Uses cookies for authentication (via withCredentials: true in axios config)
   */
  async updateSetting(key: string, value: unknown): Promise<PlatformSettings> {
    // Note: Authentication is handled via cookies (withCredentials: true)
    // The API route uses requireAdmin() middleware which reads from cookies
    const { data } = await axiosClient.put<{ settings: PlatformSettings }>(
      "/admin/wallet/settings",
      { key, value }
    );

    return data.settings;
  },

  /**
   * Manually release escrow
   * Uses cookies for authentication (via withCredentials: true in axios config)
   */
  async releaseEscrow(escrowId: string): Promise<Transaction> {
    // Note: Authentication is handled via cookies (withCredentials: true)
    // The API route uses requireAdmin() middleware which reads from cookies
    const { data } = await axiosClient.post<{ transaction: Transaction }>(
      "/admin/wallet/escrow/release",
      { escrow_id: escrowId }
    );

    return data.transaction;
  },

  /**
   * Resolve complaint
   * Uses cookies for authentication (via withCredentials: true in axios config)
   */
  async resolveComplaint(resolution: ComplaintResolution): Promise<EscrowHold> {
    // Note: Authentication is handled via cookies (withCredentials: true)
    // The API route uses requireAdmin() middleware which reads from cookies
    const { data } = await axiosClient.post<{ escrow: EscrowHold }>(
      "/admin/wallet/escrow/resolve",
      resolution
    );

    return data.escrow;
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  },

  /**
   * Format VND amount
   */
  formatVND(amount: number): string {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  },

  /**
   * Get transaction type label
   */
  getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      deposit: "Deposit",
      withdrawal: "Withdrawal",
      payment: "Payment",
      earning: "Earning",
      platform_fee: "Platform Fee",
      insurance_fee: "Insurance Fee",
      refund: "Refund",
      escrow_hold: "Escrow Hold",
      escrow_release: "Escrow Release",
    };

    return labels[type] || type;
  },

  /**
   * Get transaction status color
   */
  getTransactionStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: "orange",
      processing: "blue",
      completed: "green",
      failed: "red",
      cancelled: "gray",
    };

    return colors[status] || "default";
  },

  /**
   * Get escrow status color
   */
  getEscrowStatusColor(status: string): string {
    const colors: Record<string, string> = {
      held: "blue",
      released: "green",
      refunded: "orange",
      disputed: "red",
      cancelled: "gray",
    };

    return colors[status] || "default";
  },
};
