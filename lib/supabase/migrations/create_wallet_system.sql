-- =============================================================================
-- WALLET SYSTEM MIGRATION
-- =============================================================================
-- This migration creates tables for:
-- 1. User wallets (balance tracking)
-- 2. Transactions (all financial movements)
-- 3. Escrow holds (pending payments with cooling period)
-- 4. Platform settings (fee configuration)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PLATFORM SETTINGS TABLE
-- Store platform-wide configuration for fees and payment processing
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default fee settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('payment_fees_enabled', 'true', 'Whether platform charges transaction fees'),
  ('platform_fee_percentage', '10', 'Platform fee percentage (e.g., 10 for 10%)'),
  ('insurance_fund_percentage', '2', 'Insurance fund percentage (e.g., 2 for 2%)'),
  ('escrow_cooling_period_days', '7', 'Days to wait before releasing payment to worker'),
  ('minimum_deposit_usd', '10', 'Minimum deposit amount in USD'),
  ('minimum_withdrawal_usd', '20', 'Minimum withdrawal amount in USD'),
  ('bank_transfer_info', '{"bank": "OCB", "account": "0349337240", "accountName": "Platform Account"}', 'Bank transfer details for deposits')
ON CONFLICT (key) DO NOTHING;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);

-- -----------------------------------------------------------------------------
-- 2. WALLETS TABLE
-- Each user (worker or employer/client) has a wallet
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_usd DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance_usd >= 0),
  pending_usd DECIMAL(15, 2) NOT NULL DEFAULT 0.00 CHECK (pending_usd >= 0),
  total_earned_usd DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  total_spent_usd DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_status ON wallets(status);

-- -----------------------------------------------------------------------------
-- 3. TRANSACTIONS TABLE
-- Record all financial movements in the system
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  
  -- Transaction details
  type TEXT NOT NULL CHECK (type IN (
    'deposit',           -- User adds money to wallet
    'withdrawal',        -- User withdraws money from wallet
    'payment',           -- Employer pays for job
    'earning',           -- Worker receives payment
    'platform_fee',      -- Fee deducted by platform
    'insurance_fee',     -- Insurance fund deduction
    'refund',            -- Money returned (complaint resolution)
    'escrow_hold',       -- Money held in escrow
    'escrow_release'     -- Money released from escrow
  )),
  
  amount_usd DECIMAL(15, 2) NOT NULL CHECK (amount_usd > 0),
  
  -- Balance tracking (for audit trail)
  balance_before_usd DECIMAL(15, 2) NOT NULL,
  balance_after_usd DECIMAL(15, 2) NOT NULL,
  
  -- Payment method for deposits/withdrawals
  payment_method TEXT CHECK (payment_method IN ('paypal', 'bank_transfer', 'escrow', 'internal')),
  payment_gateway_id TEXT, -- Reference ID from payment gateway (PayPal transaction ID, bank reference code)
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',          -- Transaction initiated
    'processing',       -- Being processed
    'completed',        -- Successfully completed
    'failed',           -- Failed
    'cancelled'         -- Cancelled
  )),
  
  -- Related entities
  escrow_id UUID, -- Reference to escrow_holds if applicable
  job_id UUID, -- Reference to job (to be created later)
  related_user_id UUID REFERENCES auth.users(id), -- For transfers: sender/receiver
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data (fee breakdown, payment details, etc.)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_escrow_id ON transactions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_gateway_id ON transactions(payment_gateway_id);

-- -----------------------------------------------------------------------------
-- 4. ESCROW HOLDS TABLE
-- Manage payments held in escrow during cooling period
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escrow_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parties involved
  employer_id UUID NOT NULL REFERENCES auth.users(id),
  worker_id UUID NOT NULL REFERENCES auth.users(id),
  job_id UUID, -- Reference to job (to be created later)
  
  -- Amount breakdown
  total_amount_usd DECIMAL(15, 2) NOT NULL,
  platform_fee_usd DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  insurance_fee_usd DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  worker_amount_usd DECIMAL(15, 2) NOT NULL, -- Amount to be paid to worker
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN (
    'held',             -- Money is in escrow, waiting for cooling period
    'released',         -- Released to worker
    'refunded',         -- Refunded to employer (due to complaint)
    'disputed',         -- Under investigation
    'cancelled'         -- Cancelled
  )),
  
  -- Related transactions
  payment_transaction_id UUID REFERENCES transactions(id),
  release_transaction_id UUID REFERENCES transactions(id),
  
  -- Cooling period
  cooling_period_days INTEGER NOT NULL DEFAULT 7,
  hold_until TIMESTAMP WITH TIME ZONE NOT NULL, -- Auto-release date
  
  -- Complaint handling
  has_complaint BOOLEAN DEFAULT FALSE,
  complaint_description TEXT,
  complaint_filed_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id), -- Admin who resolved
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_escrow_holds_employer_id ON escrow_holds(employer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_worker_id ON escrow_holds(worker_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_status ON escrow_holds(status);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_hold_until ON escrow_holds(hold_until);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_has_complaint ON escrow_holds(has_complaint);

-- -----------------------------------------------------------------------------
-- 5. BANK DEPOSITS TABLE
-- Track bank transfer deposits waiting for confirmation
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Amount and QR details
  amount_usd DECIMAL(15, 2) NOT NULL,
  amount_vnd DECIMAL(15, 2), -- Optional: if converted from VND
  
  -- QR code and payment details
  qr_code_url TEXT NOT NULL,
  bank_account TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  transfer_content TEXT NOT NULL UNIQUE, -- Unique content code (e.g., ND73333)
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',          -- Waiting for user to transfer
    'verifying',        -- Transfer detected, verifying
    'completed',        -- Confirmed and credited
    'expired',          -- QR code expired (e.g., 30 minutes timeout)
    'failed'            -- Verification failed
  )),
  
  -- Webhook data
  webhook_received BOOLEAN DEFAULT FALSE,
  webhook_data JSONB,
  bank_reference_code TEXT, -- From webhook: referenceCode
  bank_transaction_id BIGINT, -- From webhook: id
  
  -- Related transaction
  transaction_id UUID REFERENCES transactions(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- QR expiration time
  verified_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bank_deposits_user_id ON bank_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_deposits_status ON bank_deposits(status);
CREATE INDEX IF NOT EXISTS idx_bank_deposits_transfer_content ON bank_deposits(transfer_content);
CREATE INDEX IF NOT EXISTS idx_bank_deposits_bank_reference_code ON bank_deposits(bank_reference_code);

-- -----------------------------------------------------------------------------
-- 6. TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- -----------------------------------------------------------------------------

-- Trigger for wallets
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for platform_settings
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for escrow_holds
CREATE TRIGGER update_escrow_holds_updated_at
  BEFORE UPDATE ON escrow_holds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_deposits ENABLE ROW LEVEL SECURITY;

-- WALLETS POLICIES
-- Users can view their own wallet
CREATE POLICY "Users can view their own wallet"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all wallets
CREATE POLICY "Admins can view all wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- TRANSACTIONS POLICIES
-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ESCROW HOLDS POLICIES
-- Employers can view escrows they created
CREATE POLICY "Employers can view their escrows"
  ON escrow_holds FOR SELECT
  TO authenticated
  USING (auth.uid() = employer_id);

-- Workers can view escrows for them
CREATE POLICY "Workers can view their escrows"
  ON escrow_holds FOR SELECT
  TO authenticated
  USING (auth.uid() = worker_id);

-- Admins can view all escrows
CREATE POLICY "Admins can view all escrows"
  ON escrow_holds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can modify escrows (for dispute resolution)
CREATE POLICY "Admins can modify escrows"
  ON escrow_holds FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- PLATFORM SETTINGS POLICIES
-- Everyone can view platform settings (needed for fee calculations)
CREATE POLICY "Anyone can view platform settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify platform settings
CREATE POLICY "Admins can modify platform settings"
  ON platform_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- BANK DEPOSITS POLICIES
-- Users can view their own deposits
CREATE POLICY "Users can view their own bank deposits"
  ON bank_deposits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all bank deposits
CREATE POLICY "Admins can view all bank deposits"
  ON bank_deposits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 8. UTILITY FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to automatically create wallet when user profile is created
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, currency, status)
  VALUES (NEW.id, 'USD', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wallet for new users
CREATE TRIGGER create_wallet_on_user_signup
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_new_user();

-- Function to calculate platform fees
CREATE OR REPLACE FUNCTION calculate_platform_fees(
  amount DECIMAL,
  OUT platform_fee DECIMAL,
  OUT insurance_fee DECIMAL,
  OUT worker_amount DECIMAL
)
AS $$
DECLARE
  fees_enabled BOOLEAN;
  platform_percentage DECIMAL;
  insurance_percentage DECIMAL;
BEGIN
  -- Get settings
  SELECT (value::text)::boolean INTO fees_enabled
  FROM platform_settings WHERE key = 'payment_fees_enabled';
  
  SELECT (value::text)::decimal INTO platform_percentage
  FROM platform_settings WHERE key = 'platform_fee_percentage';
  
  SELECT (value::text)::decimal INTO insurance_percentage
  FROM platform_settings WHERE key = 'insurance_fund_percentage';
  
  -- Calculate fees if enabled
  IF fees_enabled THEN
    platform_fee := ROUND(amount * platform_percentage / 100, 2);
    insurance_fee := ROUND(amount * insurance_percentage / 100, 2);
  ELSE
    platform_fee := 0;
    insurance_fee := 0;
  END IF;
  
  worker_amount := amount - platform_fee - insurance_fee;
END;
$$ LANGUAGE plpgsql;

-- Function to check if escrow should be auto-released
CREATE OR REPLACE FUNCTION get_escrows_ready_for_release()
RETURNS TABLE (
  escrow_id UUID,
  worker_id UUID,
  amount_usd DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.worker_id,
    e.worker_amount_usd
  FROM escrow_holds e
  WHERE e.status = 'held'
    AND e.has_complaint = FALSE
    AND e.hold_until <= NOW();
END;
$$ LANGUAGE plpgsql;

-- Comment documentation
COMMENT ON TABLE wallets IS 'User wallet balances and statistics';
COMMENT ON TABLE transactions IS 'All financial transactions in the system';
COMMENT ON TABLE escrow_holds IS 'Payments held in escrow with cooling period';
COMMENT ON TABLE platform_settings IS 'Platform-wide configuration settings';
COMMENT ON TABLE bank_deposits IS 'Bank transfer deposits pending verification';

COMMENT ON COLUMN wallets.balance_usd IS 'Available balance that can be withdrawn';
COMMENT ON COLUMN wallets.pending_usd IS 'Balance locked in escrow or pending transactions';
COMMENT ON COLUMN transactions.payment_gateway_id IS 'External payment system reference ID';
COMMENT ON COLUMN escrow_holds.hold_until IS 'Automatic release date if no complaints';
COMMENT ON COLUMN bank_deposits.transfer_content IS 'Unique transfer content code for matching webhook';

