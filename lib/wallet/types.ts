/**
 * Wallet System Type Definitions
 * Comprehensive types for wallet, transactions, escrow, and payment processing
 */

// =============================================================================
// WALLET TYPES
// =============================================================================

export interface Wallet {
  id: string;
  user_id: string;
  balance_usd: number;
  pending_usd: number;
  total_earned_usd: number;
  total_spent_usd: number;
  currency: 'USD';
  status: 'active' | 'frozen' | 'suspended';
  created_at: string;
  updated_at: string;
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export type TransactionType =
  | 'deposit'           // User adds money to wallet
  | 'withdrawal'        // User withdraws money from wallet
  | 'payment'           // Employer pays for job
  | 'earning'           // Worker receives payment
  | 'platform_fee'      // Fee deducted by platform
  | 'insurance_fee'     // Insurance fund deduction
  | 'refund'            // Money returned (complaint resolution)
  | 'escrow_hold'       // Money held in escrow
  | 'escrow_release';   // Money released from escrow

export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type PaymentMethod = 'paypal' | 'bank_transfer' | 'escrow' | 'internal';

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: TransactionType;
  amount_usd: number;
  balance_before_usd: number;
  balance_after_usd: number;
  payment_method?: PaymentMethod;
  payment_gateway_id?: string;
  status: TransactionStatus;
  escrow_id?: string;
  job_id?: string;
  related_user_id?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  completed_at?: string;
  failed_at?: string;
}

// =============================================================================
// ESCROW TYPES
// =============================================================================

export type EscrowStatus = 'held' | 'released' | 'refunded' | 'disputed' | 'cancelled';

export interface EscrowHold {
  id: string;
  employer_id: string;
  worker_id: string;
  job_id?: string;
  total_amount_usd: number;
  platform_fee_usd: number;
  insurance_fee_usd: number;
  worker_amount_usd: number;
  status: EscrowStatus;
  payment_transaction_id?: string;
  release_transaction_id?: string;
  cooling_period_days: number;
  hold_until: string;
  has_complaint: boolean;
  complaint_description?: string;
  complaint_filed_at?: string;
  resolution_notes?: string;
  resolved_by?: string;
  created_at: string;
  released_at?: string;
  updated_at: string;
  // Lookup fields (populated via joins)
  booking?: {
    id: string;
    booking_type?: string;
    start_date?: string;
    status?: string;
    service?: {
      name_key?: string;
    };
  };
  employer?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
  worker?: {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

// =============================================================================
// PLATFORM SETTINGS TYPES
// =============================================================================

export interface PlatformSettings {
  payment_fees_enabled: boolean;
  platform_fee_percentage: number;
  insurance_fund_percentage: number;
  escrow_cooling_period_days: number;
  minimum_deposit_usd: number;
  minimum_withdrawal_usd: number;
  bank_transfer_info: BankTransferInfo;
}

export interface BankTransferInfo {
  bank: string;
  account: string;
  accountName: string;
}

export interface PlatformSettingRow {
  id: string;
  key: string;
  value: unknown;
  description?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// BANK DEPOSIT TYPES
// =============================================================================

export type BankDepositStatus = 'pending' | 'verifying' | 'completed' | 'expired' | 'failed';

export interface BankDeposit {
  id: string;
  user_id: string;
  amount_usd: number;
  amount_vnd?: number;
  qr_code_url: string;
  bank_account: string;
  bank_name: string;
  transfer_content: string;
  status: BankDepositStatus;
  webhook_received: boolean;
  webhook_data?: BankWebhookData;
  bank_reference_code?: string;
  bank_transaction_id?: number;
  transaction_id?: string;
  created_at: string;
  expires_at: string;
  verified_at?: string;
  completed_at?: string;
}

// Webhook payload from Sepay
export interface BankWebhookData {
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount?: string;
  code: string;
  content: string;
  transferType: 'in' | 'out';
  description: string;
  transferAmount: number;
  referenceCode: string;
  accumulated: number;
  id: number;
}

// =============================================================================
// PAYMENT FLOW TYPES
// =============================================================================

export interface FeeCalculation {
  total_amount: number;
  platform_fee: number;
  insurance_fee: number;
  worker_amount: number;
  fees_enabled: boolean;
}

export interface PaymentRequest {
  employer_id: string;
  worker_id: string;
  job_id?: string;
  amount_usd: number;
  description?: string;
  cooling_period_days?: number;
}

export interface DepositRequest {
  amount_usd: number;
  payment_method: 'paypal' | 'bank_transfer';
  metadata?: Record<string, unknown>;
}

export interface WithdrawalRequest {
  amount_usd: number;
  payment_method: 'paypal' | 'bank_transfer';
  destination: {
    paypal_email?: string;
    bank_account?: string;
    bank_name?: string;
    account_holder?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface ComplaintRequest {
  escrow_id: string;
  description: string;
}

export interface ComplaintResolution {
  escrow_id: string;
  action: 'release_to_worker' | 'refund_to_employer' | 'partial_refund';
  worker_amount?: number;
  employer_refund?: number;
  resolution_notes: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface WalletResponse {
  success: boolean;
  wallet: Wallet;
}

export interface TransactionResponse {
  success: boolean;
  transaction: Transaction;
}

export interface TransactionsListResponse {
  success: boolean;
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface EscrowResponse {
  success: boolean;
  escrow: EscrowHold;
}

export interface PaymentResponse {
  success: boolean;
  escrow: EscrowHold;
  transaction: Transaction;
  message: string;
}

export interface DepositResponse {
  success: boolean;
  deposit?: BankDeposit;
  transaction?: Transaction;
  qr_code_url?: string;
  message: string;
}

export interface WithdrawalResponse {
  success: boolean;
  transaction: Transaction;
  message: string;
}

export interface SettingsResponse {
  success: boolean;
  settings: PlatformSettings;
}

export interface FeeCalculationResponse {
  success: boolean;
  calculation: FeeCalculation;
}

// =============================================================================
// QUERY FILTERS
// =============================================================================

export interface TransactionFilters {
  user_id?: string;
  type?: TransactionType[];
  status?: TransactionStatus[];
  payment_method?: PaymentMethod[];
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  limit?: number;
}

export interface EscrowFilters {
  employer_id?: string;
  worker_id?: string;
  status?: EscrowStatus[];
  has_complaint?: boolean;
  page?: number;
  limit?: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface WalletSummary {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_spent: number;
  active_escrows: number;
  pending_withdrawals: number;
}

export interface AdminWalletStats {
  total_wallets: number;
  total_balance: number;
  total_pending: number;
  total_transactions_today: number;
  total_escrows_active: number;
  total_complaints: number;
  platform_revenue: number;
  insurance_fund: number;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export class WalletError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

export const WalletErrorCodes = {
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  WALLET_FROZEN: 'WALLET_FROZEN',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  MINIMUM_AMOUNT_NOT_MET: 'MINIMUM_AMOUNT_NOT_MET',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  ESCROW_NOT_FOUND: 'ESCROW_NOT_FOUND',
  ESCROW_ALREADY_RELEASED: 'ESCROW_ALREADY_RELEASED',
  PAYMENT_GATEWAY_ERROR: 'PAYMENT_GATEWAY_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',
  COMPLAINT_WINDOW_EXPIRED: 'COMPLAINT_WINDOW_EXPIRED',
} as const;

