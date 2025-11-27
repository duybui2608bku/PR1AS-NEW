/**
 * Fire Points System Type Definitions
 * Comprehensive types for Fire balance, transactions, purchases, and boosts
 */

import {
  FireTransactionType,
  FirePurchaseStatus,
  BoostType,
  BoostStatus,
  Currency,
  PaymentMethod,
} from '@/lib/utils/enums';

// =============================================================================
// FIRE BALANCE TYPES
// =============================================================================

export interface WorkerFireBalance {
  id: string;
  user_id: string;
  fire_balance: number;
  total_earned: number;
  total_spent: number;
  total_purchased: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// FIRE TRANSACTION TYPES
// =============================================================================

export interface FireTransaction {
  id: string;
  user_id: string;
  type: FireTransactionType;
  fire_amount: number; // Positive for earning, negative for spending
  balance_before: number;
  balance_after: number;
  purchase_id?: string;
  boost_id?: string;
  wallet_transaction_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// =============================================================================
// FIRE PURCHASE TYPES
// =============================================================================

export interface FirePurchase {
  id: string;
  user_id: string;
  fire_amount: number;
  amount_usd: number;
  amount_vnd?: number;
  amount_jpy?: number;
  amount_krw?: number;
  amount_cny?: number;
  usd_to_fire_rate: number;
  currency_used: Currency;
  wallet_transaction_id?: string;
  payment_method?: PaymentMethod;
  payment_gateway_id?: string;
  status: FirePurchaseStatus;
  fire_transaction_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  completed_at?: string;
  refunded_at?: string;
}

// =============================================================================
// DAILY LOGIN REWARD TYPES
// =============================================================================

export interface DailyLoginReward {
  id: string;
  user_id: string;
  reward_date: string; // YYYY-MM-DD
  fire_amount: number;
  fire_transaction_id?: string;
  claimed_at: string;
}

// =============================================================================
// WORKER BOOST TYPES
// =============================================================================

export interface WorkerBoost {
  id: string;
  user_id: string;
  boost_type: BoostType;
  duration_hours: number;
  fire_cost: number;
  status: BoostStatus;
  activated_at: string;
  expires_at: string;
  expired_at?: string;
  fire_transaction_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// ACTIVE BOOST INFO (From database function)
// =============================================================================

export interface ActiveBoostInfo {
  boost_id: string;
  boost_type: BoostType;
  expires_at: string;
  remaining_seconds: number;
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

// Fire balance response
export interface FireBalanceResponse {
  balance: WorkerFireBalance;
  activeBoosts: ActiveBoostInfo[];
  canClaimDailyLogin: boolean;
}

// Purchase Fire request
export interface PurchaseFireRequest {
  fire_amount: number;
  currency?: Currency;
  payment_method: PaymentMethod;
}

// Purchase Fire response
export interface PurchaseFireResponse {
  success: boolean;
  purchase: FirePurchase;
  newBalance: number;
  message: string;
}

// Daily login claim request (no body needed)
export interface ClaimDailyLoginResponse {
  success: boolean;
  reward: DailyLoginReward;
  newBalance: number;
  message: string;
}

// Activate boost request
export interface ActivateBoostRequest {
  boost_type: BoostType;
}

// Activate boost response
export interface ActivateBoostResponse {
  success: boolean;
  boost: WorkerBoost;
  newBalance: number;
  message: string;
}

// Boost status response
export interface BoostStatusResponse {
  activeBoosts: ActiveBoostInfo[];
  recommendationBoost?: ActiveBoostInfo;
  profileBoost?: ActiveBoostInfo;
}

// Fire transactions list request
export interface FireTransactionsFilter {
  limit?: number;
  offset?: number;
  type?: FireTransactionType;
  fromDate?: string;
  toDate?: string;
}

// Fire transactions list response
export interface FireTransactionsResponse {
  transactions: FireTransaction[];
  total: number;
  hasMore: boolean;
}

// =============================================================================
// PRICE CALCULATION TYPES
// =============================================================================

export interface FirePriceCalculation {
  fire_amount: number;
  usd_amount: number;
  vnd_amount?: number;
  jpy_amount?: number;
  krw_amount?: number;
  cny_amount?: number;
  currency: Currency;
  exchange_rate: number; // Fire per 1 USD
}

// =============================================================================
// ADMIN TYPES
// =============================================================================

export interface AdminFireStats {
  total_fire_in_circulation: number;
  total_fire_purchased: number;
  total_fire_spent: number;
  total_fire_earned_from_login: number;
  active_recommendation_boosts: number;
  active_profile_boosts: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface FireError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const FireErrorCode = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  ALREADY_CLAIMED_TODAY: 'ALREADY_CLAIMED_TODAY',
  INVALID_BOOST_TYPE: 'INVALID_BOOST_TYPE',
  INVALID_FIRE_AMOUNT: 'INVALID_FIRE_AMOUNT',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
  INSUFFICIENT_WALLET_BALANCE: 'INSUFFICIENT_WALLET_BALANCE',
  PURCHASE_FAILED: 'PURCHASE_FAILED',
  NOT_A_WORKER: 'NOT_A_WORKER',
  FIRE_SYSTEM_DISABLED: 'FIRE_SYSTEM_DISABLED',
} as const;

export type FireErrorCodeType = (typeof FireErrorCode)[keyof typeof FireErrorCode];

// =============================================================================
// UTILITY TYPES
// =============================================================================

// Worker with active boosts (for search/ranking)
export interface WorkerWithBoost {
  worker_user_id: string;
  boost_type: BoostType;
  activated_at: string;
  expires_at: string;
}

// Boost activation result
export interface BoostActivationResult {
  success: boolean;
  boost?: WorkerBoost;
  error?: FireError;
}
