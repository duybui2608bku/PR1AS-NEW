/**
 * Fire Points System Types
 *
 * Fire is a gamification currency that workers can earn and spend to boost
 * their visibility on the platform.
 */

// =====================================================
// ENUMS
// =====================================================

/**
 * Types of Fire transactions
 */
export enum FireTransactionType {
  PURCHASE = 'purchase',                    // Purchased Fire with wallet
  DAILY_LOGIN = 'daily_login',             // Daily login reward
  BOOST_FEATURED = 'boost_featured',       // Spent on featured recommendation boost
  BOOST_TOP_PROFILE = 'boost_top_profile', // Spent on top profile boost
  ADMIN_ADJUSTMENT = 'admin_adjustment',   // Manual admin adjustment
  REFUND = 'refund'                        // Refund from cancelled boost
}

/**
 * Types of Fire boosts
 */
export enum FireBoostType {
  FEATURED_RECOMMENDATION = 'featured_recommendation', // Boost in featured list (12h, 1 Fire)
  TOP_PROFILE = 'top_profile'                         // Boost in top search (2h, 1 Fire)
}

/**
 * Fire boost configuration
 */
export const FIRE_BOOST_CONFIG = {
  [FireBoostType.FEATURED_RECOMMENDATION]: {
    cost: 1,
    durationHours: 12,
    description: 'Boost your profile in featured recommendations for 12 hours'
  },
  [FireBoostType.TOP_PROFILE]: {
    cost: 1,
    durationHours: 2,
    description: 'Boost your profile to top of search results for 2 hours'
  }
} as const;

/**
 * Fire configuration constants
 */
export const FIRE_CONFIG = {
  PURCHASE_RATE: 1.0,        // 1 USD = 1 Fire
  DAILY_LOGIN_REWARD: 1,     // +1 Fire per day
  MIN_PURCHASE_AMOUNT: 1,    // Minimum 1 Fire purchase
  MAX_PURCHASE_AMOUNT: 1000  // Maximum 1000 Fire per purchase
} as const;

// =====================================================
// DATABASE MODELS
// =====================================================

/**
 * Worker Fire Points Balance
 */
export interface WorkerFires {
  id: string;
  worker_profile_id: string;
  total_fires: number;
  lifetime_fires_earned: number;
  lifetime_fires_spent: number;
  created_at: string;
  updated_at: string;
}

/**
 * Daily Login Reward Record
 */
export interface DailyLoginReward {
  id: string;
  worker_profile_id: string;
  login_date: string; // ISO date string (YYYY-MM-DD)
  fires_awarded: number;
  created_at: string;
}

/**
 * Fire Transaction Record
 */
export interface FireTransaction {
  id: string;
  worker_profile_id: string;
  transaction_type: FireTransactionType;
  fires_amount: number; // Positive for gain, negative for spend
  fires_before: number;
  fires_after: number;
  payment_transaction_id?: string; // Link to wallet transaction
  boost_id?: string; // Link to boost record
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Fire Boost Record
 */
export interface FireBoost {
  id: string;
  worker_profile_id: string;
  boost_type: FireBoostType;
  fires_cost: number;
  started_at: string;
  expires_at: string;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

/**
 * Request: Purchase Fire with wallet balance
 */
export interface PurchaseFireRequest {
  amount: number; // Amount of Fire to purchase
}

/**
 * Response: Purchase Fire
 */
export interface PurchaseFireResponse {
  success: boolean;
  data?: {
    fires_purchased: number;
    cost_usd: number;
    new_balance: number;
    transaction: FireTransaction;
  };
  error?: string;
}

/**
 * Request: Claim daily login reward
 */
export interface ClaimDailyLoginRequest {
  // Empty - uses authenticated user
}

/**
 * Response: Claim daily login reward
 */
export interface ClaimDailyLoginResponse {
  success: boolean;
  data?: {
    fires_awarded: number;
    new_balance: number;
    already_claimed_today: boolean;
    next_claim_available: string; // ISO timestamp
  };
  error?: string;
}

/**
 * Request: Activate boost
 */
export interface ActivateBoostRequest {
  boost_type: FireBoostType;
}

/**
 * Response: Activate boost
 */
export interface ActivateBoostResponse {
  success: boolean;
  data?: {
    boost: FireBoost;
    new_balance: number;
    expires_at: string;
    time_remaining_minutes: number;
  };
  error?: string;
}

/**
 * Response: Get Fire balance
 */
export interface GetFireBalanceResponse {
  success: boolean;
  data?: {
    total_fires: number;
    lifetime_fires_earned: number;
    lifetime_fires_spent: number;
    active_boosts: ActiveBoostInfo[];
  };
  error?: string;
}

/**
 * Active boost information
 */
export interface ActiveBoostInfo {
  boost_type: FireBoostType;
  expires_at: string;
  time_remaining_minutes: number;
  time_remaining_display: string; // e.g., "2h 30m"
}

/**
 * Response: Get Fire transactions
 */
export interface GetFireTransactionsResponse {
  success: boolean;
  data?: {
    transactions: FireTransaction[];
    pagination: {
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
    };
  };
  error?: string;
}

/**
 * Response: Get active boosts
 */
export interface GetActiveBoostsResponse {
  success: boolean;
  data?: {
    active_boosts: ActiveBoostInfo[];
    has_featured_boost: boolean;
    has_profile_boost: boolean;
  };
  error?: string;
}

// =====================================================
// UI COMPONENT PROPS
// =====================================================

/**
 * Props for FireBalance component
 */
export interface FireBalanceProps {
  showDetails?: boolean;
  onPurchaseClick?: () => void;
}

/**
 * Props for FirePurchaseModal component
 */
export interface FirePurchaseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
}

/**
 * Props for FireBoostButton component
 */
export interface FireBoostButtonProps {
  boostType: FireBoostType;
  disabled?: boolean;
  onSuccess?: () => void;
}

/**
 * Props for FireHistory component
 */
export interface FireHistoryProps {
  limit?: number;
  showPagination?: boolean;
}

/**
 * Props for FireBoostCard component
 */
export interface FireBoostCardProps {
  boostType: FireBoostType;
  currentBalance: number;
  activeBoost?: ActiveBoostInfo;
  onActivate: (boostType: FireBoostType) => void;
  loading?: boolean;
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Fire statistics for display
 */
export interface FireStats {
  total_fires: number;
  earned_today: number;
  earned_this_week: number;
  earned_this_month: number;
  spent_today: number;
  spent_this_week: number;
  spent_this_month: number;
}

/**
 * Fire boost status check result
 */
export interface BoostStatusCheck {
  has_active_boost: boolean;
  boost_type?: FireBoostType;
  expires_at?: string;
  time_remaining_minutes?: number;
  can_activate: boolean;
  reason?: string; // Reason why can't activate (insufficient Fire, already active, etc.)
}

/**
 * Fire purchase validation result
 */
export interface PurchaseValidationResult {
  valid: boolean;
  error?: string;
  cost_usd?: number;
  new_fire_balance?: number;
  new_wallet_balance?: number;
}
