/**
 * Fire Points API Client
 * Client-side helpers for calling Fire Points APIs
 */

import {
  PurchaseFireRequest,
  PurchaseFireResponse,
  ClaimDailyLoginResponse,
  ActivateBoostRequest,
  ActivateBoostResponse,
  GetFireBalanceResponse,
  GetFireTransactionsResponse,
  GetActiveBoostsResponse,
  FireBoostType,
  FireTransactionType,
} from './types';

// =============================================================================
// API CLIENT
// =============================================================================

/**
 * Get worker's Fire balance
 */
export async function getFireBalance(): Promise<GetFireBalanceResponse> {
  const response = await fetch('/api/fire/balance', {
    method: 'GET',
    credentials: 'include',
  });

  return response.json();
}

/**
 * Purchase Fire with wallet balance
 */
export async function purchaseFire(amount: number): Promise<PurchaseFireResponse> {
  const body: PurchaseFireRequest = { amount };

  const response = await fetch('/api/fire/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  return response.json();
}

/**
 * Claim daily login reward
 */
export async function claimDailyLogin(): Promise<ClaimDailyLoginResponse> {
  const response = await fetch('/api/fire/daily-login', {
    method: 'POST',
    credentials: 'include',
  });

  return response.json();
}

/**
 * Activate Fire boost
 */
export async function activateBoost(boostType: FireBoostType): Promise<ActivateBoostResponse> {
  const body: ActivateBoostRequest = { boost_type: boostType };

  const response = await fetch('/api/fire/boost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  return response.json();
}

/**
 * Get active boosts
 */
export async function getActiveBoosts(): Promise<GetActiveBoostsResponse> {
  const response = await fetch('/api/fire/boosts/active', {
    method: 'GET',
    credentials: 'include',
  });

  return response.json();
}

/**
 * Get Fire transaction history
 */
export async function getFireTransactions(params?: {
  page?: number;
  per_page?: number;
  type?: FireTransactionType;
}): Promise<GetFireTransactionsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.per_page) searchParams.set('per_page', params.per_page.toString());
  if (params?.type) searchParams.set('type', params.type);

  const url = `/api/fire/transactions${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  return response.json();
}

/**
 * Check boost eligibility (client-side validation)
 */
export async function checkBoostEligibility(
  boostType: FireBoostType
): Promise<{ can_activate: boolean; reason?: string }> {
  const balanceResponse = await getFireBalance();
  const activeBoostsResponse = await getActiveBoosts();

  if (!balanceResponse.success || !activeBoostsResponse.success) {
    return { can_activate: false, reason: 'Failed to check eligibility' };
  }

  const balance = balanceResponse.data!.total_fires;
  const cost = 1; // All boosts cost 1 Fire

  // Check if already active
  const hasActiveBoost = activeBoostsResponse.data!.active_boosts.some(
    (boost) => boost.boost_type === boostType
  );

  if (hasActiveBoost) {
    return {
      can_activate: true,
      reason: 'Boost is active. Activating again will extend duration.',
    };
  }

  // Check balance
  if (balance < cost) {
    return {
      can_activate: false,
      reason: `Insufficient Fire. Need ${cost} Fire, have ${balance}`,
    };
  }

  return { can_activate: true };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Format Fire amount for display
 */
export function formatFireAmount(amount: number): string {
  return amount.toLocaleString();
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Get transaction type display label
 */
export function getTransactionTypeLabel(type: FireTransactionType): string {
  const labels: Record<FireTransactionType, string> = {
    [FireTransactionType.PURCHASE]: 'Purchase',
    [FireTransactionType.DAILY_LOGIN]: 'Daily Login',
    [FireTransactionType.BOOST_FEATURED]: 'Featured Boost',
    [FireTransactionType.BOOST_TOP_PROFILE]: 'Top Profile Boost',
    [FireTransactionType.ADMIN_ADJUSTMENT]: 'Admin Adjustment',
    [FireTransactionType.REFUND]: 'Refund',
  };

  return labels[type] || type;
}

/**
 * Get transaction type color for UI
 */
export function getTransactionTypeColor(type: FireTransactionType): string {
  const colors: Record<FireTransactionType, string> = {
    [FireTransactionType.PURCHASE]: 'green',
    [FireTransactionType.DAILY_LOGIN]: 'blue',
    [FireTransactionType.BOOST_FEATURED]: 'orange',
    [FireTransactionType.BOOST_TOP_PROFILE]: 'orange',
    [FireTransactionType.ADMIN_ADJUSTMENT]: 'purple',
    [FireTransactionType.REFUND]: 'green',
  };

  return colors[type] || 'default';
}

/**
 * Get boost type display name
 */
export function getBoostTypeName(type: FireBoostType): string {
  const names: Record<FireBoostType, string> = {
    [FireBoostType.FEATURED_RECOMMENDATION]: 'Featured Recommendation',
    [FireBoostType.TOP_PROFILE]: 'Top Profile',
  };

  return names[type] || type;
}

/**
 * Get boost type icon
 */
export function getBoostTypeIcon(type: FireBoostType): string {
  const icons: Record<FireBoostType, string> = {
    [FireBoostType.FEATURED_RECOMMENDATION]: '🔥',
    [FireBoostType.TOP_PROFILE]: '⭐',
  };

  return icons[type] || '🚀';
}
