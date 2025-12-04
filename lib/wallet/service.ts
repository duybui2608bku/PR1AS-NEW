/**
 * Wallet Service Layer
 * Handles all wallet-related business logic and database operations
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  Wallet,
  Transaction,
  EscrowHold,
  BankDeposit,
  PlatformSettings,
  FeeCalculation,
  PaymentRequest,
  DepositRequest,
  WithdrawalRequest,
  ComplaintRequest,
  ComplaintResolution,
  WalletError,
  WalletErrorCodes,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  TransactionFilters,
  EscrowFilters,
  WalletSummary,
  AdminWalletStats,
} from "./types";

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class WalletService {
  constructor(private supabase: SupabaseClient<any>) {}

  // ===========================================================================
  // PLATFORM SETTINGS
  // ===========================================================================

  /**
   * Get all platform settings as a typed object
   */
  async getPlatformSettings(): Promise<PlatformSettings> {
    const { data, error } = await this.supabase
      .from("platform_settings")
      .select("*");

    if (error) {
      throw new WalletError(
        "Failed to fetch platform settings",
        "SETTINGS_ERROR",
        500
      );
    }

    // Convert array of settings to object
    const settings: Record<string, unknown> = {};
    data.forEach((setting) => {
      const value = setting.value;
      // Parse boolean and number values
      if (value === "true") settings[setting.key] = true;
      else if (value === "false") settings[setting.key] = false;
      else if (!isNaN(Number(value))) settings[setting.key] = Number(value);
      else if (typeof value === "object") settings[setting.key] = value;
      else settings[setting.key] = value;
    });

    return settings as unknown as PlatformSettings;
  }

  /**
   * Update platform settings (admin only)
   */
  async updatePlatformSettings(
    key: string,
    value: unknown,
    updatedBy: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from("platform_settings")
      .update({
        value,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key);

    if (error) {
      throw new WalletError(
        "Failed to update platform settings",
        "SETTINGS_UPDATE_ERROR",
        500
      );
    }
  }

  /**
   * Calculate fees for a payment
   */
  async calculateFees(amount: number): Promise<FeeCalculation> {
    const settings = await this.getPlatformSettings();

    let platform_fee = 0;
    let insurance_fee = 0;

    if (settings.payment_fees_enabled) {
      platform_fee =
        Math.round(((amount * settings.platform_fee_percentage) / 100) * 100) /
        100;
      insurance_fee =
        Math.round(
          ((amount * settings.insurance_fund_percentage) / 100) * 100
        ) / 100;
    }

    const worker_amount = amount - platform_fee - insurance_fee;

    return {
      total_amount: amount,
      platform_fee,
      insurance_fee,
      worker_amount,
      fees_enabled: settings.payment_fees_enabled,
    };
  }

  // ===========================================================================
  // WALLET OPERATIONS
  // ===========================================================================

  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId: string): Promise<Wallet> {
    // Try to get existing wallet
    let { data: wallet, error } = await this.supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    // If wallet doesn't exist, create it
    if (error && error.code === "PGRST116") {
      const { data: newWallet, error: createError } = await this.supabase
        .from("wallets")
        .insert({ user_id: userId })
        .select()
        .single();

      if (createError) {
        throw new WalletError(
          "Failed to create wallet",
          "WALLET_CREATE_ERROR",
          500
        );
      }

      wallet = newWallet;
    } else if (error) {
      throw new WalletError(
        "Failed to fetch wallet",
        "WALLET_FETCH_ERROR",
        500
      );
    }

    return wallet as Wallet;
  }

  /**
   * Get wallet by user ID
   */
  async getWallet(userId: string): Promise<Wallet> {
    const { data, error } = await this.supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new WalletError(
        "Wallet not found",
        WalletErrorCodes.WALLET_NOT_FOUND,
        404
      );
    }

    return data as Wallet;
  }

  /**
   * Get wallet summary statistics for user
   */
  async getWalletSummary(userId: string): Promise<WalletSummary> {
    const wallet = await this.getOrCreateWallet(userId);

    // Count active escrows
    const { count: escrowCount } = await this.supabase
      .from("escrow_holds")
      .select("*", { count: "exact", head: true })
      .or(`employer_id.eq.${userId},worker_id.eq.${userId}`)
      .eq("status", "held");

    // Count pending withdrawals
    const { count: withdrawalCount } = await this.supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "withdrawal")
      .in("status", ["pending", "processing"]);

    return {
      available_balance: wallet.balance_usd,
      pending_balance: wallet.pending_usd,
      total_earned: wallet.total_earned_usd,
      total_spent: wallet.total_spent_usd,
      active_escrows: escrowCount || 0,
      pending_withdrawals: withdrawalCount || 0,
    };
  }

  /**
   * Check if wallet has sufficient balance
   */
  async checkBalance(userId: string, amount: number): Promise<boolean> {
    const wallet = await this.getWallet(userId);

    if (wallet.status !== "active") {
      throw new WalletError(
        "Wallet is not active",
        WalletErrorCodes.WALLET_FROZEN,
        403
      );
    }

    return wallet.balance_usd >= amount;
  }

  /**
   * Update wallet balance (internal use only)
   */
  private async updateWalletBalance(
    userId: string,
    balanceChange: number,
    pendingChange: number = 0
  ): Promise<Wallet> {
    const wallet = await this.getWallet(userId);

    const newBalance = wallet.balance_usd + balanceChange;
    const newPending = wallet.pending_usd + pendingChange;

    if (newBalance < 0) {
      throw new WalletError(
        "Insufficient balance",
        WalletErrorCodes.INSUFFICIENT_BALANCE,
        400
      );
    }

    const updateData: Record<string, unknown> = {
      balance_usd: newBalance,
      pending_usd: newPending,
    };

    // Update statistics
    if (balanceChange > 0) {
      updateData.total_earned_usd = wallet.total_earned_usd + balanceChange;
    } else if (balanceChange < 0) {
      updateData.total_spent_usd =
        wallet.total_spent_usd + Math.abs(balanceChange);
    }

    const { data, error } = await this.supabase
      .from("wallets")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new WalletError(
        "Failed to update wallet balance",
        "WALLET_UPDATE_ERROR",
        500
      );
    }

    return data as Wallet;
  }

  // ===========================================================================
  // TRANSACTION OPERATIONS
  // ===========================================================================

  /**
   * Create a transaction record
   */
  async createTransaction(params: {
    user_id: string;
    type: TransactionType;
    amount_usd: number;
    payment_method?: PaymentMethod;
    payment_gateway_id?: string;
    status?: TransactionStatus;
    escrow_id?: string;
    job_id?: string;
    related_user_id?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Transaction> {
    const wallet = await this.getWallet(params.user_id);

    const transaction = {
      ...params,
      wallet_id: wallet.id,
      balance_before_usd: wallet.balance_usd,
      balance_after_usd: wallet.balance_usd, // Will be updated after balance change
      status: params.status || "pending",
    };

    const { data, error } = await this.supabase
      .from("transactions")
      .insert(transaction)
      .select()
      .single();

    if (error) {
      throw new WalletError(
        "Failed to create transaction",
        WalletErrorCodes.TRANSACTION_FAILED,
        500
      );
    }

    return data as Transaction;
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string,
    status: TransactionStatus,
    errorMessage?: string
  ): Promise<Transaction> {
    const updateData: Record<string, unknown> = { status };

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    } else if (status === "failed") {
      updateData.failed_at = new Date().toISOString();
      if (errorMessage) {
        updateData.metadata = { error: errorMessage };
      }
    }

    const { data, error } = await this.supabase
      .from("transactions")
      .update(updateData)
      .eq("id", transactionId)
      .select()
      .single();

    if (error) {
      throw new WalletError(
        "Failed to update transaction",
        "TRANSACTION_UPDATE_ERROR",
        500
      );
    }

    return data as Transaction;
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(
    filters: TransactionFilters
  ): Promise<{ transactions: Transaction[]; total: number }> {
    let query = this.supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.user_id) {
      query = query.eq("user_id", filters.user_id);
    }

    if (filters.type && filters.type.length > 0) {
      query = query.in("type", filters.type);
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in("status", filters.status);
    }

    if (filters.payment_method && filters.payment_method.length > 0) {
      query = query.in("payment_method", filters.payment_method);
    }

    if (filters.date_from) {
      query = query.gte("created_at", filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte("created_at", filters.date_to);
    }

    if (filters.min_amount) {
      query = query.gte("amount_usd", filters.min_amount);
    }

    if (filters.max_amount) {
      query = query.lte("amount_usd", filters.max_amount);
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new WalletError(
        "Failed to fetch transactions",
        "TRANSACTION_FETCH_ERROR",
        500
      );
    }

    return {
      transactions: data as Transaction[],
      total: count || 0,
    };
  }

  // ===========================================================================
  // PAYMENT & ESCROW OPERATIONS
  // ===========================================================================

  /**
   * Process employer payment to worker (creates escrow hold)
   */
  async processPayment(
    payment: PaymentRequest
  ): Promise<{ escrow: EscrowHold; transaction: Transaction }> {
    const {
      employer_id,
      worker_id,
      job_id,
      amount_usd,
      description,
      cooling_period_days,
    } = payment;

    // Validate amount
    if (amount_usd <= 0) {
      throw new WalletError(
        "Invalid payment amount",
        WalletErrorCodes.INVALID_AMOUNT,
        400
      );
    }

    // Check employer balance
    const hasBalance = await this.checkBalance(employer_id, amount_usd);
    if (!hasBalance) {
      throw new WalletError(
        "Insufficient balance",
        WalletErrorCodes.INSUFFICIENT_BALANCE,
        400
      );
    }

    // Calculate fees
    const fees = await this.calculateFees(amount_usd);

    // Get cooling period from settings if not provided
    const settings = await this.getPlatformSettings();
    const coolingPeriod =
      cooling_period_days || settings.escrow_cooling_period_days;
    const holdUntil = new Date();
    holdUntil.setDate(holdUntil.getDate() + coolingPeriod);

    // Start transaction
    try {
      // 1. Deduct from employer wallet
      await this.updateWalletBalance(employer_id, -amount_usd);

      // 2. Create payment transaction (money actually leaves employer wallet)
      const paymentTransaction = await this.createTransaction({
        user_id: employer_id,
        type: "payment",
        amount_usd,
        payment_method: "escrow",
        status: "completed",
        related_user_id: worker_id,
        job_id,
        description: description || `Payment for job ${job_id}`,
        metadata: {
          fees,
          worker_id,
        },
      });

      // 3. Create escrow hold
      const { data: escrow, error: escrowError } = await this.supabase
        .from("escrow_holds")
        .insert({
          employer_id,
          worker_id,
          job_id,
          total_amount_usd: amount_usd,
          platform_fee_usd: fees.platform_fee,
          insurance_fee_usd: fees.insurance_fee,
          worker_amount_usd: fees.worker_amount,
          status: "held",
          payment_transaction_id: paymentTransaction.id,
          cooling_period_days: coolingPeriod,
          hold_until: holdUntil.toISOString(),
        })
        .select()
        .single();

      if (escrowError) {
        throw escrowError;
      }

      // 4. Update payment transaction with escrow ID
      await this.supabase
        .from("transactions")
        .update({ escrow_id: escrow.id })
        .eq("id", paymentTransaction.id);

      // 5. Create a separate "escrow_hold" transaction for easier admin reporting
      //    This does NOT change balances (purely for audit/visibility).
      const escrowHoldTransaction = await this.createTransaction({
        user_id: employer_id,
        type: "escrow_hold",
        amount_usd: amount_usd,
        payment_method: "escrow",
        status: "completed",
        escrow_id: escrow.id,
        job_id,
        related_user_id: worker_id,
        description: `Funds held in escrow for job ${job_id}`,
        metadata: {
          fees,
          worker_id,
        },
      });

      return {
        escrow: escrow as EscrowHold,
        transaction: { ...paymentTransaction, escrow_id: escrow.id },
      };
    } catch (error) {
      // Rollback: Add money back to employer wallet
      try {
        await this.updateWalletBalance(employer_id, amount_usd);
      } catch (rollbackError) {
        // Silently fail rollback - error already thrown above
      }

      throw new WalletError(
        "Payment processing failed",
        WalletErrorCodes.TRANSACTION_FAILED,
        500
      );
    }
  }

  /**
   * Release escrow to worker (after cooling period, no complaints)
   */
  async releaseEscrow(
    escrowId: string,
    adminId?: string
  ): Promise<Transaction> {
    // Get escrow
    const { data: escrow, error: escrowError } = await this.supabase
      .from("escrow_holds")
      .select("*")
      .eq("id", escrowId)
      .single();

    if (escrowError || !escrow) {
      throw new WalletError(
        "Escrow not found",
        WalletErrorCodes.ESCROW_NOT_FOUND,
        404
      );
    }

    const escrowHold = escrow as EscrowHold;

    // Validate escrow status
    if (escrowHold.status !== "held") {
      throw new WalletError(
        "Escrow already processed",
        WalletErrorCodes.ESCROW_ALREADY_RELEASED,
        400
      );
    }

    // Check if cooling period is over (unless admin is forcing release)
    if (!adminId && new Date(escrowHold.hold_until) > new Date()) {
      throw new WalletError(
        "Cooling period not yet complete",
        "COOLING_PERIOD_ACTIVE",
        400
      );
    }

    try {
      // 1. Add money to worker wallet
      await this.updateWalletBalance(
        escrowHold.worker_id,
        escrowHold.worker_amount_usd
      );

      // 2. Create release transaction for worker
      const releaseTransaction = await this.createTransaction({
        user_id: escrowHold.worker_id,
        type: "escrow_release",
        amount_usd: escrowHold.worker_amount_usd,
        payment_method: "escrow",
        status: "completed",
        escrow_id: escrowId,
        job_id: escrowHold.job_id,
        related_user_id: escrowHold.employer_id,
        description: `Payment received for job ${escrowHold.job_id}`,
        metadata: {
          released_by: adminId || "auto",
        },
      });

      // 3. Update escrow status
      await this.supabase
        .from("escrow_holds")
        .update({
          status: "released",
          release_transaction_id: releaseTransaction.id,
          released_at: new Date().toISOString(),
        })
        .eq("id", escrowId);

      return releaseTransaction;
    } catch (error) {
      throw new WalletError(
        "Failed to release escrow",
        "ESCROW_RELEASE_ERROR",
        500
      );
    }
  }

  /**
   * File complaint for escrow
   */
  async fileComplaint(
    complaint: ComplaintRequest,
    userId: string
  ): Promise<EscrowHold> {
    const { escrow_id, description } = complaint;

    // Get escrow and verify user is involved
    const { data: escrow, error } = await this.supabase
      .from("escrow_holds")
      .select("*")
      .eq("id", escrow_id)
      .single();

    if (error || !escrow) {
      throw new WalletError(
        "Escrow not found",
        WalletErrorCodes.ESCROW_NOT_FOUND,
        404
      );
    }

    const escrowHold = escrow as EscrowHold;

    // Verify user is employer or worker
    if (escrowHold.employer_id !== userId && escrowHold.worker_id !== userId) {
      throw new WalletError("Unauthorized", WalletErrorCodes.UNAUTHORIZED, 403);
    }

    // If escrow is already disputed or processed, prevent duplicate/late complaints
    if (
      escrowHold.status !== "held" &&
      escrowHold.status !== "disputed"
    ) {
      throw new WalletError(
        "Complaint window expired",
        WalletErrorCodes.COMPLAINT_WINDOW_EXPIRED,
        400
      );
    }

    // Enforce 72h complaint window based on booking time & worker completion
    if (escrowHold.job_id) {
      const { data: booking, error: bookingError } = await this.supabase
        .from("bookings")
        .select(
          "start_date, end_date, duration_hours, status, worker_completed_at"
        )
        .eq("id", escrowHold.job_id)
        .single();

      if (!bookingError && booking) {
        const now = new Date();
        const start = new Date(booking.start_date as string);
        const end = booking.end_date
          ? new Date(booking.end_date as string)
          : new Date(
              start.getTime() +
                Number(booking.duration_hours || 0) * 60 * 60 * 1000
            );

        const workerCompletedAt = booking.worker_completed_at
          ? new Date(booking.worker_completed_at as string)
          : null;

        const isOverdue = now.getTime() > end.getTime();

        // If job is not overdue and worker hasn't completed, cannot file complaint yet
        if (!isOverdue && !workerCompletedAt) {
          throw new WalletError(
            "Complaint not allowed before job is overdue or worker completion",
            "COMPLAINT_NOT_ALLOWED",
            400
          );
        }

        // Base time for 72h window:
        // - If worker has completed, count from worker_completed_at
        // - Otherwise, count from end time (when job became overdue)
        const baseTime =
          (booking.status === "worker_completed" ||
            booking.status === "client_completed") &&
          workerCompletedAt
            ? workerCompletedAt
            : end;

        const diffMs = now.getTime() - baseTime.getTime();
        const maxWindowMs = 72 * 60 * 60 * 1000; // 72 hours

        if (diffMs > maxWindowMs) {
          throw new WalletError(
            "Complaint window expired",
            WalletErrorCodes.COMPLAINT_WINDOW_EXPIRED,
            400
          );
        }
      }
    }

    // Update escrow with complaint
    const { data: updated, error: updateError } = await this.supabase
      .from("escrow_holds")
      .update({
        status: "disputed",
        has_complaint: true,
        complaint_description: description,
        complaint_filed_at: new Date().toISOString(),
      })
      .eq("id", escrow_id)
      .select()
      .single();

    if (updateError) {
      throw new WalletError("Failed to file complaint", "COMPLAINT_ERROR", 500);
    }

    return updated as EscrowHold;
  }

  /**
   * Resolve complaint (admin only)
   */
  async resolveComplaint(
    resolution: ComplaintResolution,
    adminId: string
  ): Promise<EscrowHold> {
    const {
      escrow_id,
      action,
      worker_amount,
      employer_refund,
      resolution_notes,
    } = resolution;

    // Get escrow
    const { data: escrow, error } = await this.supabase
      .from("escrow_holds")
      .select("*")
      .eq("id", escrow_id)
      .single();

    if (error || !escrow) {
      throw new WalletError(
        "Escrow not found",
        WalletErrorCodes.ESCROW_NOT_FOUND,
        404
      );
    }

    const escrowHold = escrow as EscrowHold;

    try {
      if (action === "release_to_worker") {
        // Release full amount to worker
        await this.releaseEscrow(escrow_id, adminId);

        await this.supabase
          .from("escrow_holds")
          .update({
            status: "released",
            resolution_notes,
            resolved_by: adminId,
          })
          .eq("id", escrow_id);
      } else if (action === "refund_to_employer") {
        // Refund full amount to employer
        await this.updateWalletBalance(
          escrowHold.employer_id,
          escrowHold.total_amount_usd
        );

        const refundTransaction = await this.createTransaction({
          user_id: escrowHold.employer_id,
          type: "refund",
          amount_usd: escrowHold.total_amount_usd,
          payment_method: "escrow",
          status: "completed",
          escrow_id,
          job_id: escrowHold.job_id,
          related_user_id: escrowHold.worker_id,
          description: "Refund due to complaint resolution",
          metadata: {
            resolved_by: adminId,
            resolution_notes,
          },
        });

        await this.supabase
          .from("escrow_holds")
          .update({
            status: "refunded",
            release_transaction_id: refundTransaction.id,
            resolution_notes,
            resolved_by: adminId,
            released_at: new Date().toISOString(),
          })
          .eq("id", escrow_id);
      } else if (action === "partial_refund") {
        // Partial refund: split between worker and employer
        if (!worker_amount || !employer_refund) {
          throw new WalletError(
            "Worker amount and employer refund required for partial refund",
            "INVALID_RESOLUTION",
            400
          );
        }

        // Pay worker
        await this.updateWalletBalance(escrowHold.worker_id, worker_amount);
        const workerTransaction = await this.createTransaction({
          user_id: escrowHold.worker_id,
          type: "escrow_release",
          amount_usd: worker_amount,
          payment_method: "escrow",
          status: "completed",
          escrow_id,
          job_id: escrowHold.job_id,
          related_user_id: escrowHold.employer_id,
          description: "Partial payment (complaint resolution)",
          metadata: { resolved_by: adminId },
        });

        // Refund employer
        await this.updateWalletBalance(escrowHold.employer_id, employer_refund);
        await this.createTransaction({
          user_id: escrowHold.employer_id,
          type: "refund",
          amount_usd: employer_refund,
          payment_method: "escrow",
          status: "completed",
          escrow_id,
          job_id: escrowHold.job_id,
          related_user_id: escrowHold.worker_id,
          description: "Partial refund (complaint resolution)",
          metadata: { resolved_by: adminId },
        });

        await this.supabase
          .from("escrow_holds")
          .update({
            status: "released",
            release_transaction_id: workerTransaction.id,
            resolution_notes,
            resolved_by: adminId,
            released_at: new Date().toISOString(),
          })
          .eq("id", escrow_id);
      }

      // Get updated escrow
      const { data: updated } = await this.supabase
        .from("escrow_holds")
        .select("*")
        .eq("id", escrow_id)
        .single();

      return updated as EscrowHold;
    } catch (error) {
      throw new WalletError(
        "Failed to resolve complaint",
        "RESOLUTION_ERROR",
        500
      );
    }
  }

  /**
   * Get escrows ready for auto-release
   */
  async getEscrowsReadyForRelease(): Promise<EscrowHold[]> {
    const { data, error } = await this.supabase
      .from("escrow_holds")
      .select("*")
      .eq("status", "held")
      .eq("has_complaint", false)
      .lte("hold_until", new Date().toISOString());

    if (error) {
      throw new WalletError(
        "Failed to fetch escrows for release",
        "ESCROW_FETCH_ERROR",
        500
      );
    }

    return data as EscrowHold[];
  }

  /**
   * Get escrows with filters
   */
  async getEscrows(
    filters: EscrowFilters
  ): Promise<{ escrows: EscrowHold[]; total: number }> {
    // First, get escrows with count
    let query = this.supabase
      .from("escrow_holds")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filters.employer_id) {
      query = query.eq("employer_id", filters.employer_id);
    }

    if (filters.worker_id) {
      query = query.eq("worker_id", filters.worker_id);
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in("status", filters.status);
    }

    if (filters.has_complaint !== undefined) {
      query = query.eq("has_complaint", filters.has_complaint);
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new WalletError(
        "Failed to fetch escrows",
        "ESCROW_FETCH_ERROR",
        500
      );
    }

    const escrowsData = (data || []) as EscrowHold[];

    // Collect unique IDs for lookups
    const bookingIds = escrowsData
      .map((e) => e.job_id)
      .filter((id): id is string => !!id);
    const employerIds = escrowsData.map((e) => e.employer_id);
    const workerIds = escrowsData.map((e) => e.worker_id);
    const allUserIds = [...new Set([...employerIds, ...workerIds])];

    // Fetch related data in parallel
    const [bookingsData, profilesData] = await Promise.all([
      // Fetch bookings
      bookingIds.length > 0
        ? this.supabase
            .from("bookings")
            .select(
              `
              id,
              booking_type,
              start_date,
              status,
              service:services(name_key)
            `
            )
            .in("id", bookingIds)
        : Promise.resolve({ data: [], error: null }),
      // Fetch user profiles
      allUserIds.length > 0
        ? this.supabase
            .from("user_profiles")
            .select("id, full_name, email, avatar_url")
            .in("id", allUserIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    // Create lookup maps
    const bookingsMap = new Map(
      (bookingsData.data || []).map((b: any) => [
        b.id,
        {
          id: b.id,
          booking_type: b.booking_type,
          start_date: b.start_date,
          status: b.status,
          service: b.service ? { name_key: b.service.name_key } : undefined,
        },
      ])
    );

    const profilesMap = new Map(
      (profilesData.data || []).map((p: any) => [
        p.id,
        {
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          avatar_url: p.avatar_url,
        },
      ])
    );

    // Enrich escrows with lookup data
    const escrows = escrowsData.map((escrow) => ({
      ...escrow,
      booking: escrow.job_id ? bookingsMap.get(escrow.job_id) : undefined,
      employer: profilesMap.get(escrow.employer_id),
      worker: profilesMap.get(escrow.worker_id),
    }));

    return {
      escrows,
      total: count || 0,
    };
  }

  // ===========================================================================
  // ADMIN OPERATIONS
  // ===========================================================================

  /**
   * Get admin wallet statistics
   */
  async getAdminStats(): Promise<AdminWalletStats> {
    // Total wallets
    const { count: totalWallets } = await this.supabase
      .from("wallets")
      .select("*", { count: "exact", head: true });

    // Sum of all balances
    const { data: balanceData } = await this.supabase
      .from("wallets")
      .select("balance_usd, pending_usd");

    const total_balance =
      balanceData?.reduce((sum, w) => sum + Number(w.balance_usd), 0) || 0;
    const total_pending =
      balanceData?.reduce((sum, w) => sum + Number(w.pending_usd), 0) || 0;

    // Transactions today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: transactionsToday } = await this.supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());

    // Active escrows
    const { count: activeEscrows } = await this.supabase
      .from("escrow_holds")
      .select("*", { count: "exact", head: true })
      .eq("status", "held");

    // Complaints
    const { count: complaints } = await this.supabase
      .from("escrow_holds")
      .select("*", { count: "exact", head: true })
      .eq("has_complaint", true)
      .eq("status", "disputed");

    // Platform revenue (sum of all platform fees)
    const { data: feeData } = await this.supabase
      .from("transactions")
      .select("amount_usd")
      .eq("type", "platform_fee")
      .eq("status", "completed");

    const platform_revenue =
      feeData?.reduce((sum, t) => sum + Number(t.amount_usd), 0) || 0;

    // Insurance fund (sum of all insurance fees)
    const { data: insuranceData } = await this.supabase
      .from("transactions")
      .select("amount_usd")
      .eq("type", "insurance_fee")
      .eq("status", "completed");

    const insurance_fund =
      insuranceData?.reduce((sum, t) => sum + Number(t.amount_usd), 0) || 0;

    return {
      total_wallets: totalWallets || 0,
      total_balance,
      total_pending,
      total_transactions_today: transactionsToday || 0,
      total_escrows_active: activeEscrows || 0,
      total_complaints: complaints || 0,
      platform_revenue,
      insurance_fund,
    };
  }
}
