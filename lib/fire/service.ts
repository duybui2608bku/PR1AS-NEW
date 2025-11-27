/**
 * Fire Points Service Layer
 * Handles all Fire-related business logic and database operations
 */

import { createClient } from '@supabase/supabase-js';
import {
  WorkerFireBalance,
  FireTransaction,
  FirePurchase,
  DailyLoginReward,
  WorkerBoost,
  ActiveBoostInfo,
  FireBalanceResponse,
  PurchaseFireRequest,
  PurchaseFireResponse,
  ClaimDailyLoginResponse,
  ActivateBoostRequest,
  ActivateBoostResponse,
  BoostStatusResponse,
  FireTransactionsFilter,
  FireTransactionsResponse,
  FirePriceCalculation,
  AdminFireStats,
  FireError,
  FireErrorCode,
  WorkerWithBoost,
} from './types';
import {
  FireTransactionType,
  FirePurchaseStatus,
  BoostType,
  BoostStatus,
  Currency,
  PaymentMethod,
  USD_TO_FIRE_RATE,
  FIRE_DAILY_LOGIN_REWARD,
  FIRE_BOOST_RECOMMENDATION_COST,
  FIRE_BOOST_PROFILE_COST,
  FIRE_BOOST_RECOMMENDATION_HOURS,
  FIRE_BOOST_PROFILE_HOURS,
} from '@/lib/utils/enums';

// Currency exchange rates (same as wallet system)
const CURRENCY_RATES = {
  USD: 1,
  VND: 24000,
  JPY: 150,
  KRW: 1300,
  CNY: 7.2,
};

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class FireService {
  constructor(private supabase: ReturnType<typeof createClient>) {}

  // ===========================================================================
  // FIRE BALANCE OPERATIONS
  // ===========================================================================

  /**
   * Get or create Fire balance for worker
   */
  async getOrCreateFireBalance(userId: string): Promise<WorkerFireBalance> {
    // Try to get existing balance
    let { data: balance, error } = await this.supabase
      .from('worker_fire_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If balance doesn't exist, create it
    if (error && error.code === 'PGRST116') {
      const { data: newBalance, error: createError } = await this.supabase
        .from('worker_fire_balances')
        .insert({ user_id: userId })
        .select()
        .single();

      if (createError) {
        throw this.createError('Failed to create Fire balance', FireErrorCode.PURCHASE_FAILED);
      }

      balance = newBalance;
    } else if (error) {
      throw this.createError('Failed to fetch Fire balance', FireErrorCode.PURCHASE_FAILED);
    }

    return balance as WorkerFireBalance;
  }

  /**
   * Get Fire balance for worker
   */
  async getFireBalance(userId: string): Promise<WorkerFireBalance> {
    const { data, error } = await this.supabase
      .from('worker_fire_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If not found, create it
      if (error.code === 'PGRST116') {
        return await this.getOrCreateFireBalance(userId);
      }
      throw this.createError('Failed to fetch Fire balance', FireErrorCode.PURCHASE_FAILED);
    }

    return data as WorkerFireBalance;
  }

  /**
   * Get full Fire balance response with active boosts and daily login status
   */
  async getFireBalanceResponse(userId: string): Promise<FireBalanceResponse> {
    const balance = await this.getFireBalance(userId);
    const activeBoosts = await this.getActiveBoosts(userId);
    const canClaimDailyLogin = await this.canClaimDailyLogin(userId);

    return {
      balance,
      activeBoosts,
      canClaimDailyLogin,
    };
  }

  /**
   * Update Fire balance (internal method)
   */
  private async updateFireBalance(
    userId: string,
    fireAmount: number,
    transactionType: FireTransactionType
  ): Promise<WorkerFireBalance> {
    // Get current balance
    const currentBalance = await this.getFireBalance(userId);

    // Calculate new balance
    const newBalance = currentBalance.fire_balance + fireAmount;

    if (newBalance < 0) {
      throw this.createError('Insufficient Fire balance', FireErrorCode.INSUFFICIENT_BALANCE);
    }

    // Update balance and totals
    const updates: Partial<WorkerFireBalance> = {
      fire_balance: newBalance,
    };

    if (fireAmount > 0) {
      if (transactionType === FireTransactionType.PURCHASE) {
        updates.total_purchased = currentBalance.total_purchased + fireAmount;
      }
      updates.total_earned = currentBalance.total_earned + fireAmount;
    } else {
      updates.total_spent = currentBalance.total_spent + Math.abs(fireAmount);
    }

    // Update in database
    const { data, error } = await this.supabase
      .from('worker_fire_balances')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw this.createError('Failed to update Fire balance', FireErrorCode.PURCHASE_FAILED);
    }

    return data as WorkerFireBalance;
  }

  // ===========================================================================
  // FIRE TRANSACTIONS
  // ===========================================================================

  /**
   * Create Fire transaction record
   */
  private async createFireTransaction(
    userId: string,
    type: FireTransactionType,
    fireAmount: number,
    balanceBefore: number,
    balanceAfter: number,
    options?: {
      purchaseId?: string;
      boostId?: string;
      walletTransactionId?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<FireTransaction> {
    const { data, error } = await this.supabase
      .from('fire_transactions')
      .insert({
        user_id: userId,
        type,
        fire_amount: fireAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        purchase_id: options?.purchaseId,
        boost_id: options?.boostId,
        wallet_transaction_id: options?.walletTransactionId,
        description: options?.description,
        metadata: options?.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw this.createError('Failed to create Fire transaction', FireErrorCode.PURCHASE_FAILED);
    }

    return data as FireTransaction;
  }

  /**
   * Get Fire transactions for user
   */
  async getFireTransactions(
    userId: string,
    filters?: FireTransactionsFilter
  ): Promise<FireTransactionsResponse> {
    let query = this.supabase
      .from('fire_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.fromDate) {
      query = query.gte('created_at', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('created_at', filters.toDate);
    }

    // Pagination
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw this.createError('Failed to fetch Fire transactions', FireErrorCode.PURCHASE_FAILED);
    }

    return {
      transactions: (data as FireTransaction[]) || [],
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  // ===========================================================================
  // FIRE PURCHASES
  // ===========================================================================

  /**
   * Calculate Fire price in different currencies
   */
  calculateFirePrice(fireAmount: number, currency: Currency = Currency.USD): FirePriceCalculation {
    const usdAmount = fireAmount / USD_TO_FIRE_RATE;

    return {
      fire_amount: fireAmount,
      usd_amount: Number(usdAmount.toFixed(2)),
      vnd_amount: Number((usdAmount * CURRENCY_RATES.VND).toFixed(0)),
      jpy_amount: Number((usdAmount * CURRENCY_RATES.JPY).toFixed(0)),
      krw_amount: Number((usdAmount * CURRENCY_RATES.KRW).toFixed(0)),
      cny_amount: Number((usdAmount * CURRENCY_RATES.CNY).toFixed(2)),
      currency,
      exchange_rate: USD_TO_FIRE_RATE,
    };
  }

  /**
   * Purchase Fire with money
   */
  async purchaseFire(
    userId: string,
    request: PurchaseFireRequest
  ): Promise<PurchaseFireResponse> {
    // Validate request
    if (request.fire_amount <= 0) {
      throw this.createError('Invalid Fire amount', FireErrorCode.INVALID_FIRE_AMOUNT);
    }

    // Calculate price
    const priceCalc = this.calculateFirePrice(
      request.fire_amount,
      request.currency || Currency.USD
    );

    // Get current balance
    const currentBalance = await this.getFireBalance(userId);

    // Create purchase record
    const { data: purchase, error: purchaseError } = await this.supabase
      .from('fire_purchases')
      .insert({
        user_id: userId,
        fire_amount: request.fire_amount,
        amount_usd: priceCalc.usd_amount,
        amount_vnd: priceCalc.vnd_amount,
        amount_jpy: priceCalc.jpy_amount,
        amount_krw: priceCalc.krw_amount,
        amount_cny: priceCalc.cny_amount,
        usd_to_fire_rate: USD_TO_FIRE_RATE,
        currency_used: request.currency || Currency.USD,
        payment_method: request.payment_method,
        status: FirePurchaseStatus.COMPLETED,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (purchaseError) {
      throw this.createError('Failed to create purchase record', FireErrorCode.PURCHASE_FAILED);
    }

    // Update Fire balance
    const updatedBalance = await this.updateFireBalance(
      userId,
      request.fire_amount,
      FireTransactionType.PURCHASE
    );

    // Create transaction record
    await this.createFireTransaction(
      userId,
      FireTransactionType.PURCHASE,
      request.fire_amount,
      currentBalance.fire_balance,
      updatedBalance.fire_balance,
      {
        purchaseId: purchase.id,
        description: `Purchased ${request.fire_amount} Fire`,
        metadata: { priceCalc },
      }
    );

    return {
      success: true,
      purchase: purchase as FirePurchase,
      newBalance: updatedBalance.fire_balance,
      message: `Successfully purchased ${request.fire_amount} Fire!`,
    };
  }

  // ===========================================================================
  // DAILY LOGIN REWARDS
  // ===========================================================================

  /**
   * Check if user can claim daily login reward
   */
  async canClaimDailyLogin(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('can_claim_daily_login', {
      worker_user_id: userId,
    });

    if (error) {
      console.error('Error checking daily login:', error);
      return false;
    }

    return data as boolean;
  }

  /**
   * Claim daily login reward
   */
  async claimDailyLogin(userId: string): Promise<ClaimDailyLoginResponse> {
    // Check if can claim
    const canClaim = await this.canClaimDailyLogin(userId);
    if (!canClaim) {
      throw this.createError(
        'Daily login reward already claimed today',
        FireErrorCode.ALREADY_CLAIMED_TODAY
      );
    }

    // Get current balance
    const currentBalance = await this.getFireBalance(userId);

    // Create reward record
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { data: reward, error: rewardError } = await this.supabase
      .from('daily_login_rewards')
      .insert({
        user_id: userId,
        reward_date: today,
        fire_amount: FIRE_DAILY_LOGIN_REWARD,
      })
      .select()
      .single();

    if (rewardError) {
      // Check if duplicate (race condition)
      if (rewardError.code === '23505') {
        throw this.createError(
          'Daily login reward already claimed',
          FireErrorCode.ALREADY_CLAIMED_TODAY
        );
      }
      throw this.createError('Failed to claim daily login reward', FireErrorCode.PURCHASE_FAILED);
    }

    // Update Fire balance
    const updatedBalance = await this.updateFireBalance(
      userId,
      FIRE_DAILY_LOGIN_REWARD,
      FireTransactionType.DAILY_LOGIN
    );

    // Create transaction record
    await this.createFireTransaction(
      userId,
      FireTransactionType.DAILY_LOGIN,
      FIRE_DAILY_LOGIN_REWARD,
      currentBalance.fire_balance,
      updatedBalance.fire_balance,
      {
        description: 'Daily login reward',
      }
    );

    return {
      success: true,
      reward: reward as DailyLoginReward,
      newBalance: updatedBalance.fire_balance,
      message: `+${FIRE_DAILY_LOGIN_REWARD} Fire! Come back tomorrow for more!`,
    };
  }

  // ===========================================================================
  // WORKER BOOSTS
  // ===========================================================================

  /**
   * Get active boosts for worker
   */
  async getActiveBoosts(userId: string): Promise<ActiveBoostInfo[]> {
    const { data, error } = await this.supabase.rpc('get_active_boosts', {
      worker_user_id: userId,
    });

    if (error) {
      console.error('Error getting active boosts:', error);
      return [];
    }

    return (data || []) as ActiveBoostInfo[];
  }

  /**
   * Get boost status
   */
  async getBoostStatus(userId: string): Promise<BoostStatusResponse> {
    const activeBoosts = await this.getActiveBoosts(userId);

    const recommendationBoost = activeBoosts.find(
      (b) => b.boost_type === BoostType.RECOMMENDATION
    );
    const profileBoost = activeBoosts.find((b) => b.boost_type === BoostType.PROFILE);

    return {
      activeBoosts,
      recommendationBoost,
      profileBoost,
    };
  }

  /**
   * Activate boost
   */
  async activateBoost(
    userId: string,
    request: ActivateBoostRequest
  ): Promise<ActivateBoostResponse> {
    // Validate boost type
    if (!Object.values(BoostType).includes(request.boost_type)) {
      throw this.createError('Invalid boost type', FireErrorCode.INVALID_BOOST_TYPE);
    }

    // Get boost cost and duration
    const fireCost =
      request.boost_type === BoostType.RECOMMENDATION
        ? FIRE_BOOST_RECOMMENDATION_COST
        : FIRE_BOOST_PROFILE_COST;

    const durationHours =
      request.boost_type === BoostType.RECOMMENDATION
        ? FIRE_BOOST_RECOMMENDATION_HOURS
        : FIRE_BOOST_PROFILE_HOURS;

    // Check if user has enough Fire
    const currentBalance = await this.getFireBalance(userId);
    if (currentBalance.fire_balance < fireCost) {
      throw this.createError('Insufficient Fire balance', FireErrorCode.INSUFFICIENT_BALANCE);
    }

    // Calculate expiration time
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

    // Create boost record
    const { data: boost, error: boostError } = await this.supabase
      .from('worker_boosts')
      .insert({
        user_id: userId,
        boost_type: request.boost_type,
        duration_hours: durationHours,
        fire_cost: fireCost,
        status: BoostStatus.ACTIVE,
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (boostError) {
      throw this.createError('Failed to activate boost', FireErrorCode.PURCHASE_FAILED);
    }

    // Deduct Fire
    const updatedBalance = await this.updateFireBalance(
      userId,
      -fireCost,
      request.boost_type === BoostType.RECOMMENDATION
        ? FireTransactionType.BOOST_RECOMMENDATION
        : FireTransactionType.BOOST_PROFILE
    );

    // Create transaction record
    await this.createFireTransaction(
      userId,
      request.boost_type === BoostType.RECOMMENDATION
        ? FireTransactionType.BOOST_RECOMMENDATION
        : FireTransactionType.BOOST_PROFILE,
      -fireCost,
      currentBalance.fire_balance,
      updatedBalance.fire_balance,
      {
        boostId: boost.id,
        description: `Activated ${request.boost_type} boost for ${durationHours} hours`,
      }
    );

    return {
      success: true,
      boost: boost as WorkerBoost,
      newBalance: updatedBalance.fire_balance,
      message: `${request.boost_type} boost activated for ${durationHours} hours!`,
    };
  }

  /**
   * Get workers with active boosts (for search ranking)
   */
  async getWorkersWithActiveBoosts(boostType?: BoostType): Promise<WorkerWithBoost[]> {
    const { data, error } = await this.supabase.rpc('get_workers_with_active_boosts', {
      target_boost_type: boostType || null,
    });

    if (error) {
      console.error('Error getting workers with boosts:', error);
      return [];
    }

    return (data || []) as WorkerWithBoost[];
  }

  /**
   * Expire old boosts (called by cron job)
   */
  async expireOldBoosts(): Promise<{ expired_count: number; boosts: WorkerBoost[] }> {
    const { data, error } = await this.supabase.rpc('expire_old_boosts');

    if (error) {
      throw this.createError('Failed to expire boosts', FireErrorCode.PURCHASE_FAILED);
    }

    return {
      expired_count: (data || []).length,
      boosts: (data || []) as WorkerBoost[],
    };
  }

  // ===========================================================================
  // ADMIN OPERATIONS
  // ===========================================================================

  /**
   * Get Fire system statistics (admin only)
   */
  async getAdminStats(): Promise<AdminFireStats> {
    // Get total Fire in circulation
    const { data: balances } = await this.supabase
      .from('worker_fire_balances')
      .select('fire_balance, total_purchased, total_spent');

    // Get total Fire earned from daily login
    const { data: dailyRewards } = await this.supabase
      .from('daily_login_rewards')
      .select('fire_amount');

    // Get active boosts
    const { data: activeBoosts } = await this.supabase
      .from('worker_boosts')
      .select('boost_type')
      .eq('status', BoostStatus.ACTIVE)
      .gt('expires_at', new Date().toISOString());

    const totalInCirculation = (balances || []).reduce((sum, b) => sum + b.fire_balance, 0);
    const totalPurchased = (balances || []).reduce((sum, b) => sum + b.total_purchased, 0);
    const totalSpent = (balances || []).reduce((sum, b) => sum + b.total_spent, 0);
    const totalDailyLogin = (dailyRewards || []).reduce((sum, r) => sum + r.fire_amount, 0);

    const activeRecommendationBoosts =
      activeBoosts?.filter((b) => b.boost_type === BoostType.RECOMMENDATION).length || 0;
    const activeProfileBoosts =
      activeBoosts?.filter((b) => b.boost_type === BoostType.PROFILE).length || 0;

    return {
      total_fire_in_circulation: totalInCirculation,
      total_fire_purchased: totalPurchased,
      total_fire_spent: totalSpent,
      total_fire_earned_from_login: totalDailyLogin,
      active_recommendation_boosts: activeRecommendationBoosts,
      active_profile_boosts: activeProfileBoosts,
    };
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Create Fire error
   */
  private createError(message: string, code: string): FireError {
    return {
      code,
      message,
    };
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create FireService instance
 */
export function createFireService(supabase: ReturnType<typeof createClient>): FireService {
  return new FireService(supabase);
}
