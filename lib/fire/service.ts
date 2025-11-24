/**
 * Fire Points Service Layer
 * Handles all Fire points business logic and database operations
 */

import { SupabaseClient } from "@supabase/supabase-js";
import {
  WorkerFires,
  FireTransaction,
  FireBoost,
  DailyLoginReward,
  FireTransactionType,
  FireBoostType,
  FIRE_BOOST_CONFIG,
  FIRE_CONFIG,
  ActiveBoostInfo,
  BoostStatusCheck,
  PurchaseValidationResult,
} from "./types";

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class FireError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "FireError";
  }
}

export const FireErrorCodes = {
  INSUFFICIENT_FIRE: "INSUFFICIENT_FIRE",
  INSUFFICIENT_WALLET: "INSUFFICIENT_WALLET",
  ALREADY_CLAIMED_TODAY: "ALREADY_CLAIMED_TODAY",
  BOOST_ALREADY_ACTIVE: "BOOST_ALREADY_ACTIVE",
  INVALID_AMOUNT: "INVALID_AMOUNT",
  WORKER_NOT_FOUND: "WORKER_NOT_FOUND",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class FireService {
  constructor(private supabase: SupabaseClient) {}

  // ===========================================================================
  // FIRE BALANCE OPERATIONS
  // ===========================================================================

  /**
   * Get worker's Fire balance
   */
  async getFireBalance(workerProfileId: string): Promise<WorkerFires | null> {
    const { data, error } = await this.supabase
      .from("worker_fires")
      .select("*")
      .eq("worker_profile_id", workerProfileId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found (acceptable)
      throw new FireError(
        "Failed to fetch Fire balance",
        FireErrorCodes.DATABASE_ERROR
      );
    }

    return data;
  }

  /**
   * Initialize Fire balance for new worker (auto-called by trigger)
   */
  async initializeFireBalance(workerProfileId: string): Promise<WorkerFires> {
    const { data, error } = await this.supabase
      .from("worker_fires")
      .insert({
        worker_profile_id: workerProfileId,
        total_fires: 0,
        lifetime_fires_earned: 0,
        lifetime_fires_spent: 0,
      })
      .select()
      .single();

    if (error) {
      throw new FireError(
        "Failed to initialize Fire balance",
        FireErrorCodes.DATABASE_ERROR
      );
    }

    return data;
  }

  /**
   * Get or create Fire balance
   */
  async getOrCreateFireBalance(workerProfileId: string): Promise<WorkerFires> {
    let balance = await this.getFireBalance(workerProfileId);

    if (!balance) {
      balance = await this.initializeFireBalance(workerProfileId);
    }

    return balance;
  }

  // ===========================================================================
  // PURCHASE FIRE
  // ===========================================================================

  /**
   * Validate Fire purchase
   */
  async validatePurchase(
    workerProfileId: string,
    userId: string,
    fireAmount: number
  ): Promise<PurchaseValidationResult> {
    // Validate amount
    if (fireAmount < FIRE_CONFIG.MIN_PURCHASE_AMOUNT) {
      return {
        valid: false,
        error: `Minimum purchase is ${FIRE_CONFIG.MIN_PURCHASE_AMOUNT} Fire`,
      };
    }

    if (fireAmount > FIRE_CONFIG.MAX_PURCHASE_AMOUNT) {
      return {
        valid: false,
        error: `Maximum purchase is ${FIRE_CONFIG.MAX_PURCHASE_AMOUNT} Fire`,
      };
    }

    // Calculate cost
    const costUSD = fireAmount * FIRE_CONFIG.PURCHASE_RATE;

    // Check wallet balance
    const { data: wallet, error: walletError } = await this.supabase
      .from("wallets")
      .select("balance_usd")
      .eq("user_id", userId)
      .single();

    if (walletError || !wallet) {
      return {
        valid: false,
        error: "Wallet not found",
      };
    }

    if (wallet.balance_usd < costUSD) {
      return {
        valid: false,
        error: `Insufficient wallet balance. Need $${costUSD.toFixed(
          2
        )}, have $${wallet.balance_usd.toFixed(2)}`,
      };
    }

    // Get current Fire balance
    const fireBalance = await this.getOrCreateFireBalance(workerProfileId);

    return {
      valid: true,
      cost_usd: costUSD,
      new_fire_balance: fireBalance.total_fires + fireAmount,
      new_wallet_balance: wallet.balance_usd - costUSD,
    };
  }

  /**
   * Purchase Fire with wallet balance
   */
  async purchaseFire(
    workerProfileId: string,
    userId: string,
    fireAmount: number
  ): Promise<{
    fire: WorkerFires;
    transaction: FireTransaction;
    walletTransactionId: string;
  }> {
    // Validate purchase
    const validation = await this.validatePurchase(
      workerProfileId,
      userId,
      fireAmount
    );
    if (!validation.valid) {
      throw new FireError(
        validation.error!,
        FireErrorCodes.INVALID_AMOUNT,
        400
      );
    }

    const costUSD = validation.cost_usd!;

    // Start transaction: deduct from wallet, add to Fire, create records
    try {
      // 1. Deduct from wallet
      const { data: wallet } = await this.supabase
        .from("wallets")
        .select("id, balance_usd")
        .eq("user_id", userId)
        .single();

      if (!wallet) {
        throw new FireError(
          "Wallet not found",
          FireErrorCodes.WORKER_NOT_FOUND
        );
      }

      const newWalletBalance = wallet.balance_usd - costUSD;

      // Update wallet
      const { error: updateWalletError } = await this.supabase
        .from("wallets")
        .update({ balance_usd: newWalletBalance })
        .eq("id", wallet.id);

      if (updateWalletError) {
        throw new FireError(
          "Failed to update wallet balance",
          FireErrorCodes.TRANSACTION_FAILED
        );
      }

      // Create wallet transaction
      const { data: walletTx, error: walletTxError } = await this.supabase
        .from("transactions")
        .insert({
          user_id: userId,
          wallet_id: wallet.id,
          type: "payment",
          amount_usd: costUSD, // Positive amount, type indicates it's a payment (deduction)
          balance_before_usd: wallet.balance_usd,
          balance_after_usd: newWalletBalance,
          payment_method: "internal",
          status: "completed",
          description: `Purchased ${fireAmount} Fire points`,
          metadata: { fire_amount: fireAmount },
        })
        .select()
        .single();

      if (walletTxError || !walletTx) {
        console.error("Wallet transaction creation error:", walletTxError);
        throw new FireError(
          "Failed to create wallet transaction",
          FireErrorCodes.TRANSACTION_FAILED
        );
      }

      // 2. Add Fire points
      const fireBalance = await this.getOrCreateFireBalance(workerProfileId);
      const newFireBalance = fireBalance.total_fires + fireAmount;

      const { data: updatedFire, error: updateFireError } = await this.supabase
        .from("worker_fires")
        .update({
          total_fires: newFireBalance,
          lifetime_fires_earned: fireBalance.lifetime_fires_earned + fireAmount,
        })
        .eq("worker_profile_id", workerProfileId)
        .select()
        .single();

      if (updateFireError || !updatedFire) {
        throw new FireError(
          "Failed to update Fire balance",
          FireErrorCodes.TRANSACTION_FAILED
        );
      }

      // 3. Create Fire transaction record
      const { data: fireTx, error: fireTxError } = await this.supabase
        .from("fire_transactions")
        .insert({
          worker_profile_id: workerProfileId,
          transaction_type: FireTransactionType.PURCHASE,
          fires_amount: fireAmount,
          fires_before: fireBalance.total_fires,
          fires_after: newFireBalance,
          payment_transaction_id: walletTx.id,
          description: `Purchased ${fireAmount} Fire for $${costUSD.toFixed(
            2
          )}`,
          metadata: { cost_usd: costUSD },
        })
        .select()
        .single();

      if (fireTxError || !fireTx) {
        console.error("Fire transaction creation error:", fireTxError);
        throw new FireError(
          "Failed to create Fire transaction record",
          FireErrorCodes.TRANSACTION_FAILED
        );
      }

      return {
        fire: updatedFire,
        transaction: fireTx,
        walletTransactionId: walletTx.id,
      };
    } catch (error: any) {
      throw new FireError(
        error.message || "Failed to purchase Fire",
        FireErrorCodes.TRANSACTION_FAILED
      );
    }
  }

  // ===========================================================================
  // DAILY LOGIN REWARD
  // ===========================================================================

  /**
   * Check if worker has claimed daily login today
   */
  async hasClaimedToday(workerProfileId: string): Promise<boolean> {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const { data, error } = await this.supabase
      .from("daily_login_rewards")
      .select("id")
      .eq("worker_profile_id", workerProfileId)
      .eq("login_date", today)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new FireError(
        "Failed to check daily login",
        FireErrorCodes.DATABASE_ERROR
      );
    }

    return !!data;
  }

  /**
   * Claim daily login reward
   */
  async claimDailyLogin(workerProfileId: string): Promise<{
    fire: WorkerFires;
    reward: DailyLoginReward;
    transaction: FireTransaction;
    alreadyClaimed: boolean;
  }> {
    const today = new Date().toISOString().split("T")[0];

    // Check if already claimed
    const alreadyClaimed = await this.hasClaimedToday(workerProfileId);
    if (alreadyClaimed) {
      const fire = await this.getOrCreateFireBalance(workerProfileId);
      throw new FireError(
        "Daily login reward already claimed today",
        FireErrorCodes.ALREADY_CLAIMED_TODAY,
        400
      );
    }

    const rewardAmount = FIRE_CONFIG.DAILY_LOGIN_REWARD;

    try {
      // 1. Add Fire points
      const fireBalance = await this.getOrCreateFireBalance(workerProfileId);
      const newFireBalance = fireBalance.total_fires + rewardAmount;

      const { data: updatedFire } = await this.supabase
        .from("worker_fires")
        .update({
          total_fires: newFireBalance,
          lifetime_fires_earned:
            fireBalance.lifetime_fires_earned + rewardAmount,
        })
        .eq("worker_profile_id", workerProfileId)
        .select()
        .single();

      // 2. Create daily login record
      const { data: reward } = await this.supabase
        .from("daily_login_rewards")
        .insert({
          worker_profile_id: workerProfileId,
          login_date: today,
          fires_awarded: rewardAmount,
        })
        .select()
        .single();

      // 3. Create Fire transaction
      const { data: transaction } = await this.supabase
        .from("fire_transactions")
        .insert({
          worker_profile_id: workerProfileId,
          transaction_type: FireTransactionType.DAILY_LOGIN,
          fires_amount: rewardAmount,
          fires_before: fireBalance.total_fires,
          fires_after: newFireBalance,
          description: "Daily login reward",
          metadata: { date: today },
        })
        .select()
        .single();

      return {
        fire: updatedFire!,
        reward: reward!,
        transaction: transaction!,
        alreadyClaimed: false,
      };
    } catch (error: any) {
      throw new FireError(
        error.message || "Failed to claim daily login",
        FireErrorCodes.TRANSACTION_FAILED
      );
    }
  }

  // ===========================================================================
  // FIRE BOOSTS
  // ===========================================================================

  /**
   * Get active boosts for worker
   */
  async getActiveBoosts(workerProfileId: string): Promise<ActiveBoostInfo[]> {
    const { data, error } = await this.supabase
      .from("fire_boosts")
      .select("*")
      .eq("worker_profile_id", workerProfileId)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true });

    if (error) {
      throw new FireError(
        "Failed to fetch active boosts",
        FireErrorCodes.DATABASE_ERROR
      );
    }

    return (data || []).map((boost: FireBoost) => {
      const expiresAt = new Date(boost.expires_at);
      const now = new Date();
      const remainingMs = expiresAt.getTime() - now.getTime();
      const remainingMinutes = Math.max(0, Math.floor(remainingMs / 60000));

      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;
      const display = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      return {
        boost_type: boost.boost_type,
        expires_at: boost.expires_at,
        time_remaining_minutes: remainingMinutes,
        time_remaining_display: display,
      };
    });
  }

  /**
   * Check if worker has active boost of specific type
   */
  async hasActiveBoost(
    workerProfileId: string,
    boostType: FireBoostType
  ): Promise<boolean> {
    const { data } = await this.supabase
      .from("fire_boosts")
      .select("id")
      .eq("worker_profile_id", workerProfileId)
      .eq("boost_type", boostType)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    return !!data;
  }

  /**
   * Check boost status and eligibility
   */
  async checkBoostStatus(
    workerProfileId: string,
    boostType: FireBoostType
  ): Promise<BoostStatusCheck> {
    // Check if already active
    const hasActive = await this.hasActiveBoost(workerProfileId, boostType);
    if (hasActive) {
      const activeBoosts = await this.getActiveBoosts(workerProfileId);
      const activeBoost = activeBoosts.find((b) => b.boost_type === boostType);

      return {
        has_active_boost: true,
        boost_type: boostType,
        expires_at: activeBoost?.expires_at,
        time_remaining_minutes: activeBoost?.time_remaining_minutes,
        can_activate: true, // Can extend
        reason: "Boost is active, activating again will extend duration",
      };
    }

    // Check Fire balance
    const config = FIRE_BOOST_CONFIG[boostType];
    const fireBalance = await this.getOrCreateFireBalance(workerProfileId);

    if (fireBalance.total_fires < config.cost) {
      return {
        has_active_boost: false,
        can_activate: false,
        reason: `Insufficient Fire. Need ${config.cost} Fire, have ${fireBalance.total_fires}`,
      };
    }

    return {
      has_active_boost: false,
      can_activate: true,
    };
  }

  /**
   * Activate Fire boost
   */
  async activateBoost(
    workerProfileId: string,
    boostType: FireBoostType
  ): Promise<{
    boost: FireBoost;
    fire: WorkerFires;
    transaction: FireTransaction;
  }> {
    const config = FIRE_BOOST_CONFIG[boostType];

    // Check status
    const status = await this.checkBoostStatus(workerProfileId, boostType);
    if (!status.can_activate) {
      throw new FireError(
        status.reason!,
        FireErrorCodes.INSUFFICIENT_FIRE,
        400
      );
    }

    const fireBalance = await this.getOrCreateFireBalance(workerProfileId);

    // Check balance again (race condition protection)
    if (fireBalance.total_fires < config.cost) {
      throw new FireError(
        `Insufficient Fire. Need ${config.cost}, have ${fireBalance.total_fires}`,
        FireErrorCodes.INSUFFICIENT_FIRE,
        400
      );
    }

    try {
      // Calculate expiration time
      const now = new Date();
      let expiresAt: Date;

      if (status.has_active_boost) {
        // Extend existing boost
        const activeBoosts = await this.getActiveBoosts(workerProfileId);
        const activeBoost = activeBoosts.find(
          (b) => b.boost_type === boostType
        );
        expiresAt = new Date(activeBoost!.expires_at);
        expiresAt.setHours(expiresAt.getHours() + config.durationHours);
      } else {
        // New boost
        expiresAt = new Date(
          now.getTime() + config.durationHours * 60 * 60 * 1000
        );
      }

      // 1. Deduct Fire points
      const newFireBalance = fireBalance.total_fires - config.cost;

      const { data: updatedFire } = await this.supabase
        .from("worker_fires")
        .update({
          total_fires: newFireBalance,
          lifetime_fires_spent: fireBalance.lifetime_fires_spent + config.cost,
        })
        .eq("worker_profile_id", workerProfileId)
        .select()
        .single();

      // 2. Create boost record
      const { data: boost } = await this.supabase
        .from("fire_boosts")
        .insert({
          worker_profile_id: workerProfileId,
          boost_type: boostType,
          fires_cost: config.cost,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          metadata: {
            extended: status.has_active_boost,
            duration_hours: config.durationHours,
          },
        })
        .select()
        .single();

      // 3. Create Fire transaction
      const transactionType =
        boostType === FireBoostType.FEATURED_RECOMMENDATION
          ? FireTransactionType.BOOST_FEATURED
          : FireTransactionType.BOOST_TOP_PROFILE;

      const { data: transaction } = await this.supabase
        .from("fire_transactions")
        .insert({
          worker_profile_id: workerProfileId,
          transaction_type: transactionType,
          fires_amount: -config.cost,
          fires_before: fireBalance.total_fires,
          fires_after: newFireBalance,
          boost_id: boost?.id,
          description: `Activated ${boostType} boost for ${config.durationHours}h`,
          metadata: {
            boost_type: boostType,
            expires_at: expiresAt.toISOString(),
            extended: status.has_active_boost,
          },
        })
        .select()
        .single();

      return {
        boost: boost!,
        fire: updatedFire!,
        transaction: transaction!,
      };
    } catch (error: any) {
      throw new FireError(
        error.message || "Failed to activate boost",
        FireErrorCodes.TRANSACTION_FAILED
      );
    }
  }

  /**
   * Expire old boosts (called by cron job)
   */
  async expireBoosts(): Promise<number> {
    const { data, error } = await this.supabase.rpc("expire_fire_boosts");

    if (error) {
      throw new FireError(
        "Failed to expire boosts",
        FireErrorCodes.DATABASE_ERROR
      );
    }

    return data?.[0]?.expired_count || 0;
  }

  // ===========================================================================
  // FIRE TRANSACTIONS
  // ===========================================================================

  /**
   * Get Fire transaction history
   */
  async getTransactions(
    workerProfileId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: FireTransactionType;
    } = {}
  ): Promise<{ transactions: FireTransaction[]; total: number }> {
    const { limit = 50, offset = 0, type } = options;

    let query = this.supabase
      .from("fire_transactions")
      .select("*", { count: "exact" })
      .eq("worker_profile_id", workerProfileId)
      .order("created_at", { ascending: false });

    if (type) {
      query = query.eq("transaction_type", type);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new FireError(
        "Failed to fetch transactions",
        FireErrorCodes.DATABASE_ERROR
      );
    }

    return {
      transactions: data || [],
      total: count || 0,
    };
  }
}
