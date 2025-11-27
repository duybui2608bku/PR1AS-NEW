/**
 * Fire API Client
 * Client-side helpers to call Fire API routes
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import {
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
} from './types';
import { BoostType, Currency } from '@/lib/utils/enums';

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
 * Fire API Client
 */
export const fireAPI = {
  // ===========================================================================
  // FIRE BALANCE OPERATIONS
  // ===========================================================================

  /**
   * Get Fire balance with active boosts and daily login status
   */
  async getBalance(): Promise<FireBalanceResponse> {
    const response = await fetch('/api/fire/balance', {
      credentials: 'include', // Send httpOnly cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch Fire balance');
    }

    const data = await response.json();
    return {
      balance: data.balance,
      activeBoosts: data.activeBoosts,
      canClaimDailyLogin: data.canClaimDailyLogin,
    };
  },

  // ===========================================================================
  // FIRE PURCHASE OPERATIONS
  // ===========================================================================

  /**
   * Calculate Fire price in different currencies
   */
  calculateFirePrice(fireAmount: number, currency: Currency = Currency.USD): FirePriceCalculation {
    const USD_TO_FIRE_RATE = 5;
    const usdAmount = fireAmount / USD_TO_FIRE_RATE;

    const CURRENCY_RATES = {
      USD: 1,
      VND: 24000,
      JPY: 150,
      KRW: 1300,
      CNY: 7.2,
    };

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
  },

  /**
   * Purchase Fire with money
   */
  async purchaseFire(request: PurchaseFireRequest): Promise<PurchaseFireResponse> {
    const response = await fetch('/api/fire/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to purchase Fire');
    }

    return response.json();
  },

  // ===========================================================================
  // DAILY LOGIN OPERATIONS
  // ===========================================================================

  /**
   * Claim daily login reward
   */
  async claimDailyLogin(): Promise<ClaimDailyLoginResponse> {
    const response = await fetch('/api/fire/daily-login', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to claim daily login reward');
    }

    return response.json();
  },

  // ===========================================================================
  // BOOST OPERATIONS
  // ===========================================================================

  /**
   * Activate recommendation boost (12 hours)
   */
  async activateRecommendationBoost(): Promise<ActivateBoostResponse> {
    return this.activateBoost({ boost_type: BoostType.RECOMMENDATION });
  },

  /**
   * Activate profile boost (2 hours)
   */
  async activateProfileBoost(): Promise<ActivateBoostResponse> {
    return this.activateBoost({ boost_type: BoostType.PROFILE });
  },

  /**
   * Activate boost (generic method)
   */
  async activateBoost(request: ActivateBoostRequest): Promise<ActivateBoostResponse> {
    const response = await fetch('/api/fire/boost/activate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to activate boost');
    }

    return response.json();
  },

  /**
   * Get boost status (active boosts)
   */
  async getBoostStatus(): Promise<BoostStatusResponse> {
    const response = await fetch('/api/fire/boost/status', {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch boost status');
    }

    const data = await response.json();
    return {
      activeBoosts: data.activeBoosts,
      recommendationBoost: data.recommendationBoost,
      profileBoost: data.profileBoost,
    };
  },

  // ===========================================================================
  // TRANSACTION OPERATIONS
  // ===========================================================================

  /**
   * Get Fire transaction history
   */
  async getTransactions(filters?: FireTransactionsFilter): Promise<FireTransactionsResponse> {
    const params = new URLSearchParams();

    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);

    const url = `/api/fire/transactions${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch transactions');
    }

    const data = await response.json();
    return {
      transactions: data.transactions,
      total: data.total,
      hasMore: data.hasMore,
    };
  },

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Format Fire amount with icon
   */
  formatFire(amount: number): string {
    return `🔥 ${amount}`;
  },

  /**
   * Format remaining time for boost
   */
  formatRemainingTime(remainingSeconds: number): string {
    if (remainingSeconds <= 0) return 'Expired';

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  /**
   * Get boost duration text
   */
  getBoostDurationText(boostType: BoostType): string {
    return boostType === BoostType.RECOMMENDATION ? '12 hours' : '2 hours';
  },

  /**
   * Get boost cost
   */
  getBoostCost(boostType: BoostType): number {
    return 1; // Both boosts cost 1 Fire
  },
};

export default fireAPI;
