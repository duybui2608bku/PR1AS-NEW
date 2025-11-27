-- =============================================================================
-- FIRE POINTS SYSTEM MIGRATION
-- =============================================================================
-- This migration creates tables for the Fire points system:
-- 1. Worker Fire balances (current Fire points)
-- 2. Fire transactions (earning and spending history)
-- 3. Fire purchases (buying Fire with money)
-- 4. Daily login rewards (tracking daily login bonuses)
-- 5. Worker boosts (recommendation and profile boost tracking)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. WORKER FIRE BALANCES TABLE
-- Track current Fire points for each worker
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_fire_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Fire balance
  fire_balance INTEGER NOT NULL DEFAULT 0 CHECK (fire_balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_fire_balances_user_id ON worker_fire_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_fire_balances_fire_balance ON worker_fire_balances(fire_balance DESC);

-- -----------------------------------------------------------------------------
-- 2. FIRE TRANSACTIONS TABLE
-- Record all Fire earning and spending activities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fire_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction type
  type TEXT NOT NULL CHECK (type IN (
    'daily_login',        -- Earned from daily login (+1 Fire)
    'purchase',           -- Purchased with money
    'boost_recommendation', -- Spent on recommendation boost (-1 Fire)
    'boost_profile',      -- Spent on profile boost (-1 Fire)
    'admin_adjustment',   -- Admin manually adjusted
    'refund'              -- Refunded Fire (e.g., cancelled boost)
  )),

  -- Amount (positive for earning, negative for spending)
  fire_amount INTEGER NOT NULL,

  -- Balance tracking (for audit trail)
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Related entities
  purchase_id UUID, -- Reference to fire_purchases if type = 'purchase'
  boost_id UUID, -- Reference to worker_boosts if type starts with 'boost_'
  wallet_transaction_id UUID REFERENCES transactions(id), -- Link to wallet transaction for purchases

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fire_transactions_user_id ON fire_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fire_transactions_type ON fire_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fire_transactions_created_at ON fire_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fire_transactions_purchase_id ON fire_transactions(purchase_id);
CREATE INDEX IF NOT EXISTS idx_fire_transactions_boost_id ON fire_transactions(boost_id);

-- -----------------------------------------------------------------------------
-- 3. FIRE PURCHASES TABLE
-- Track Fire purchases with money
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fire_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Purchase details
  fire_amount INTEGER NOT NULL CHECK (fire_amount > 0),
  amount_usd DECIMAL(15, 2) NOT NULL CHECK (amount_usd > 0),
  amount_vnd DECIMAL(15, 2),
  amount_jpy DECIMAL(15, 2),
  amount_krw DECIMAL(15, 2),
  amount_cny DECIMAL(15, 2),

  -- Exchange rate at time of purchase (1 USD = X Fire)
  usd_to_fire_rate DECIMAL(10, 2) NOT NULL DEFAULT 5.00, -- Default: 1 USD = 5 Fire
  currency_used TEXT NOT NULL DEFAULT 'USD' CHECK (currency_used IN ('USD', 'VND', 'JPY', 'KRW', 'CNY')),

  -- Payment tracking
  wallet_transaction_id UUID REFERENCES transactions(id), -- Link to wallet transaction
  payment_method TEXT CHECK (payment_method IN ('wallet', 'paypal', 'bank_transfer')),
  payment_gateway_id TEXT, -- External payment reference

  -- Status
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN (
    'pending',
    'completed',
    'failed',
    'refunded'
  )),

  -- Fire transaction link
  fire_transaction_id UUID, -- Reference to fire_transactions

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fire_purchases_user_id ON fire_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_fire_purchases_status ON fire_purchases(status);
CREATE INDEX IF NOT EXISTS idx_fire_purchases_created_at ON fire_purchases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fire_purchases_wallet_transaction_id ON fire_purchases(wallet_transaction_id);

-- -----------------------------------------------------------------------------
-- 4. DAILY LOGIN REWARDS TABLE
-- Track daily login bonuses to prevent duplicate claims
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_login_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reward details
  reward_date DATE NOT NULL, -- The date of the login (in system timezone)
  fire_amount INTEGER NOT NULL DEFAULT 1,

  -- Fire transaction link
  fire_transaction_id UUID REFERENCES fire_transactions(id),

  -- Timestamps
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate claims per day
  UNIQUE(user_id, reward_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_login_rewards_user_id ON daily_login_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_login_rewards_reward_date ON daily_login_rewards(reward_date DESC);

-- -----------------------------------------------------------------------------
-- 5. WORKER BOOSTS TABLE
-- Track active and past boosts (recommendation and profile)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Boost type
  boost_type TEXT NOT NULL CHECK (boost_type IN (
    'recommendation',     -- Top recommendation boost (12 hours)
    'profile'             -- Top profile boost (2 hours)
  )),

  -- Duration and status
  duration_hours INTEGER NOT NULL, -- 12 for recommendation, 2 for profile
  fire_cost INTEGER NOT NULL DEFAULT 1,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',             -- Currently active
    'expired',            -- Expired naturally
    'cancelled'           -- Cancelled by user or admin
  )),

  -- Timing
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expired_at TIMESTAMP WITH TIME ZONE, -- Actual expiration time

  -- Fire transaction link
  fire_transaction_id UUID REFERENCES fire_transactions(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_boosts_user_id ON worker_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_boosts_boost_type ON worker_boosts(boost_type);
CREATE INDEX IF NOT EXISTS idx_worker_boosts_status ON worker_boosts(status);
CREATE INDEX IF NOT EXISTS idx_worker_boosts_expires_at ON worker_boosts(expires_at);
CREATE INDEX IF NOT EXISTS idx_worker_boosts_activated_at ON worker_boosts(activated_at DESC);

-- Composite index for finding active boosts
CREATE INDEX IF NOT EXISTS idx_worker_boosts_active
  ON worker_boosts(user_id, boost_type, status, expires_at)
  WHERE status = 'active';

-- -----------------------------------------------------------------------------
-- 6. TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- -----------------------------------------------------------------------------

-- Trigger for worker_fire_balances
CREATE TRIGGER update_worker_fire_balances_updated_at
  BEFORE UPDATE ON worker_fire_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for worker_boosts
CREATE TRIGGER update_worker_boosts_updated_at
  BEFORE UPDATE ON worker_boosts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE worker_fire_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_login_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_boosts ENABLE ROW LEVEL SECURITY;

-- WORKER FIRE BALANCES POLICIES
-- Workers can view their own Fire balance
CREATE POLICY "Workers can view their own Fire balance"
  ON worker_fire_balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all Fire balances
CREATE POLICY "Admins can view all Fire balances"
  ON worker_fire_balances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- FIRE TRANSACTIONS POLICIES
-- Users can view their own Fire transactions
CREATE POLICY "Users can view their own Fire transactions"
  ON fire_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all Fire transactions
CREATE POLICY "Admins can view all Fire transactions"
  ON fire_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- FIRE PURCHASES POLICIES
-- Users can view their own Fire purchases
CREATE POLICY "Users can view their own Fire purchases"
  ON fire_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all Fire purchases
CREATE POLICY "Admins can view all Fire purchases"
  ON fire_purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DAILY LOGIN REWARDS POLICIES
-- Users can view their own daily login rewards
CREATE POLICY "Users can view their own daily login rewards"
  ON daily_login_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all daily login rewards
CREATE POLICY "Admins can view all daily login rewards"
  ON daily_login_rewards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- WORKER BOOSTS POLICIES
-- Workers can view their own boosts
CREATE POLICY "Workers can view their own boosts"
  ON worker_boosts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all boosts
CREATE POLICY "Admins can view all boosts"
  ON worker_boosts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can modify boosts (for management purposes)
CREATE POLICY "Admins can modify boosts"
  ON worker_boosts FOR ALL
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

-- -----------------------------------------------------------------------------
-- 8. UTILITY FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to automatically create Fire balance when worker profile is created
CREATE OR REPLACE FUNCTION create_fire_balance_for_worker()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create Fire balance for workers
  IF EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = NEW.user_id AND role = 'worker'
  ) THEN
    INSERT INTO worker_fire_balances (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create Fire balance when worker profile is created
CREATE TRIGGER create_fire_balance_on_worker_profile
  AFTER INSERT ON worker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_fire_balance_for_worker();

-- Function to get active boosts for a worker
CREATE OR REPLACE FUNCTION get_active_boosts(worker_user_id UUID)
RETURNS TABLE (
  boost_id UUID,
  boost_type TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  remaining_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wb.id,
    wb.boost_type,
    wb.expires_at,
    GREATEST(0, EXTRACT(EPOCH FROM (wb.expires_at - NOW()))::INTEGER) as remaining_seconds
  FROM worker_boosts wb
  WHERE wb.user_id = worker_user_id
    AND wb.status = 'active'
    AND wb.expires_at > NOW()
  ORDER BY wb.boost_type;
END;
$$ LANGUAGE plpgsql;

-- Function to check if worker can claim daily login reward
CREATE OR REPLACE FUNCTION can_claim_daily_login(worker_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  already_claimed BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM daily_login_rewards
    WHERE user_id = worker_user_id
      AND reward_date = today_date
  ) INTO already_claimed;

  RETURN NOT already_claimed;
END;
$$ LANGUAGE plpgsql;

-- Function to get workers with active boosts (for search/ranking)
CREATE OR REPLACE FUNCTION get_workers_with_active_boosts(
  target_boost_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  worker_user_id UUID,
  boost_type TEXT,
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wb.user_id,
    wb.boost_type,
    wb.activated_at,
    wb.expires_at
  FROM worker_boosts wb
  WHERE wb.status = 'active'
    AND wb.expires_at > NOW()
    AND (target_boost_type IS NULL OR wb.boost_type = target_boost_type)
  ORDER BY wb.activated_at ASC; -- Earlier activation = higher priority
END;
$$ LANGUAGE plpgsql;

-- Function to expire old boosts (for cron job)
CREATE OR REPLACE FUNCTION expire_old_boosts()
RETURNS TABLE (
  expired_boost_id UUID,
  user_id UUID,
  boost_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  UPDATE worker_boosts
  SET
    status = 'expired',
    expired_at = NOW(),
    updated_at = NOW()
  WHERE status = 'active'
    AND expires_at <= NOW()
  RETURNING id, worker_boosts.user_id, worker_boosts.boost_type;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Fire price from USD
CREATE OR REPLACE FUNCTION calculate_fire_from_usd(usd_amount DECIMAL)
RETURNS INTEGER AS $$
DECLARE
  fire_rate DECIMAL := 5.00; -- 1 USD = 5 Fire
BEGIN
  RETURN FLOOR(usd_amount * fire_rate)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate USD price from Fire
CREATE OR REPLACE FUNCTION calculate_usd_from_fire(fire_amount INTEGER)
RETURNS DECIMAL AS $$
DECLARE
  fire_rate DECIMAL := 5.00; -- 1 USD = 5 Fire
BEGIN
  RETURN ROUND(fire_amount / fire_rate, 2);
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 9. INSERT DEFAULT PLATFORM SETTINGS FOR FIRE
-- -----------------------------------------------------------------------------

-- Add Fire-related settings to platform_settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('fire_usd_rate', '5', 'Fire points per 1 USD (1 USD = 5 Fire)'),
  ('fire_daily_login_reward', '1', 'Fire points earned per daily login'),
  ('fire_boost_recommendation_cost', '1', 'Fire cost to activate recommendation boost'),
  ('fire_boost_recommendation_hours', '12', 'Duration of recommendation boost in hours'),
  ('fire_boost_profile_cost', '1', 'Fire cost to activate profile boost'),
  ('fire_boost_profile_hours', '2', 'Duration of profile boost in hours'),
  ('fire_enabled', 'true', 'Whether Fire system is enabled')
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 10. COMMENTS DOCUMENTATION
-- -----------------------------------------------------------------------------

COMMENT ON TABLE worker_fire_balances IS 'Current Fire point balances for workers';
COMMENT ON TABLE fire_transactions IS 'History of all Fire earning and spending';
COMMENT ON TABLE fire_purchases IS 'Fire purchases with money';
COMMENT ON TABLE daily_login_rewards IS 'Daily login reward claims tracking';
COMMENT ON TABLE worker_boosts IS 'Active and past worker boost activations';

COMMENT ON COLUMN worker_fire_balances.fire_balance IS 'Current available Fire points';
COMMENT ON COLUMN worker_fire_balances.total_earned IS 'Total Fire earned (daily login + purchases + adjustments)';
COMMENT ON COLUMN worker_fire_balances.total_spent IS 'Total Fire spent on boosts';
COMMENT ON COLUMN worker_fire_balances.total_purchased IS 'Total Fire purchased with money';

COMMENT ON COLUMN fire_transactions.fire_amount IS 'Positive for earning, negative for spending';
COMMENT ON COLUMN fire_transactions.balance_before IS 'Fire balance before transaction';
COMMENT ON COLUMN fire_transactions.balance_after IS 'Fire balance after transaction';

COMMENT ON COLUMN fire_purchases.usd_to_fire_rate IS 'Exchange rate at time of purchase (e.g., 5 = 1 USD gives 5 Fire)';
COMMENT ON COLUMN fire_purchases.wallet_transaction_id IS 'Link to wallet transaction if paid from wallet';

COMMENT ON COLUMN daily_login_rewards.reward_date IS 'Date of login (YYYY-MM-DD)';

COMMENT ON COLUMN worker_boosts.boost_type IS 'recommendation = top recommendation list, profile = top profile list';
COMMENT ON COLUMN worker_boosts.duration_hours IS '12 hours for recommendation, 2 hours for profile';
COMMENT ON COLUMN worker_boosts.expires_at IS 'When the boost expires (activated_at + duration)';

