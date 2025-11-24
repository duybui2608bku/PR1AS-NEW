-- =====================================================
-- Fire Points System Migration
-- =====================================================
-- Description: Fire Points system allows workers to boost their visibility
-- Features:
--   - Purchase Fire with wallet balance (1 USD = 1 Fire)
--   - Daily login rewards (+1 Fire per day)
--   - Boost featured recommendations (1 Fire for 12 hours)
--   - Boost top profile ranking (1 Fire for 2 hours)
-- =====================================================

-- =====================================================
-- 1. WORKER_FIRES TABLE
-- Stores each worker's total Fire points balance
-- =====================================================
CREATE TABLE IF NOT EXISTS public.worker_fires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL UNIQUE REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  total_fires INTEGER NOT NULL DEFAULT 0 CHECK (total_fires >= 0),
  lifetime_fires_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_fires_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_worker_fires_worker_profile ON public.worker_fires(worker_profile_id);
CREATE INDEX idx_worker_fires_total ON public.worker_fires(total_fires DESC);

-- Comments
COMMENT ON TABLE public.worker_fires IS 'Stores Fire points balance for each worker';
COMMENT ON COLUMN public.worker_fires.total_fires IS 'Current available Fire points';
COMMENT ON COLUMN public.worker_fires.lifetime_fires_earned IS 'Total Fire points earned (purchases + rewards)';
COMMENT ON COLUMN public.worker_fires.lifetime_fires_spent IS 'Total Fire points spent on boosts';

-- =====================================================
-- 2. DAILY_LOGIN_REWARDS TABLE
-- Tracks daily login rewards to prevent duplicates
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_login_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  login_date DATE NOT NULL,
  fires_awarded INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(worker_profile_id, login_date)
);

-- Indexes
CREATE INDEX idx_daily_login_rewards_worker ON public.daily_login_rewards(worker_profile_id);
CREATE INDEX idx_daily_login_rewards_date ON public.daily_login_rewards(login_date DESC);

-- Comments
COMMENT ON TABLE public.daily_login_rewards IS 'Tracks daily login rewards to ensure one reward per day';
COMMENT ON COLUMN public.daily_login_rewards.login_date IS 'Date of login (system timezone)';

-- =====================================================
-- 3. FIRE_BOOSTS TABLE
-- Tracks active and historical boosts (created before transactions for FK)
-- =====================================================
CREATE TYPE fire_boost_type AS ENUM (
  'featured_recommendation',  -- Boost in featured/recommended list (12 hours, 1 Fire)
  'top_profile'              -- Boost in top profile search (2 hours, 1 Fire)
);

CREATE TABLE IF NOT EXISTS public.fire_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  boost_type fire_boost_type NOT NULL,
  fires_cost INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_fire_boosts_worker ON public.fire_boosts(worker_profile_id);
CREATE INDEX idx_fire_boosts_active ON public.fire_boosts(is_active, expires_at) WHERE is_active = TRUE;
CREATE INDEX idx_fire_boosts_type ON public.fire_boosts(boost_type);
CREATE INDEX idx_fire_boosts_expires ON public.fire_boosts(expires_at);

-- Comments
COMMENT ON TABLE public.fire_boosts IS 'Tracks all Fire boost activations (active and expired)';
COMMENT ON COLUMN public.fire_boosts.is_active IS 'TRUE if boost is currently active, FALSE if expired or cancelled';
COMMENT ON COLUMN public.fire_boosts.expires_at IS 'When the boost expires (auto-expire via cron job)';

-- =====================================================
-- 4. FIRE_TRANSACTIONS TABLE
-- Complete history of all Fire point changes
-- =====================================================
CREATE TYPE fire_transaction_type AS ENUM (
  'purchase',                  -- Purchased Fire with wallet balance
  'daily_login',              -- Daily login reward
  'boost_featured',           -- Spent on featured recommendation boost
  'boost_top_profile',        -- Spent on top profile boost
  'admin_adjustment',         -- Manual adjustment by admin
  'refund'                    -- Refund from cancelled boost
);

CREATE TABLE IF NOT EXISTS public.fire_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES public.worker_profiles(id) ON DELETE CASCADE,
  transaction_type fire_transaction_type NOT NULL,
  fires_amount INTEGER NOT NULL, -- Positive for gain, negative for spend
  fires_before INTEGER NOT NULL,
  fires_after INTEGER NOT NULL,
  payment_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL, -- Link to wallet transaction if purchased
  boost_id UUID REFERENCES public.fire_boosts(id) ON DELETE SET NULL, -- Link to boost if spent
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_fire_transactions_worker ON public.fire_transactions(worker_profile_id);
CREATE INDEX idx_fire_transactions_type ON public.fire_transactions(transaction_type);
CREATE INDEX idx_fire_transactions_created ON public.fire_transactions(created_at DESC);
CREATE INDEX idx_fire_transactions_payment ON public.fire_transactions(payment_transaction_id);

-- Comments
COMMENT ON TABLE public.fire_transactions IS 'Complete history of all Fire point transactions';
COMMENT ON COLUMN public.fire_transactions.fires_amount IS 'Amount changed: positive = gained, negative = spent';

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Function: Initialize worker_fires when worker profile is created
CREATE OR REPLACE FUNCTION public.initialize_worker_fires()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.worker_fires (worker_profile_id, total_fires)
  VALUES (NEW.id, 0)
  ON CONFLICT (worker_profile_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_fire_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-expire boosts (called by cron job)
CREATE OR REPLACE FUNCTION public.expire_fire_boosts()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE public.fire_boosts
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND expires_at <= NOW();

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN QUERY SELECT affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get active boosts for a worker
CREATE OR REPLACE FUNCTION public.get_active_boosts(p_worker_profile_id UUID)
RETURNS TABLE(
  boost_type fire_boost_type,
  expires_at TIMESTAMPTZ,
  time_remaining INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fb.boost_type,
    fb.expires_at,
    fb.expires_at - NOW() as time_remaining
  FROM public.fire_boosts fb
  WHERE fb.worker_profile_id = p_worker_profile_id
    AND fb.is_active = TRUE
    AND fb.expires_at > NOW()
  ORDER BY fb.expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if worker has active boost of specific type
CREATE OR REPLACE FUNCTION public.has_active_boost(
  p_worker_profile_id UUID,
  p_boost_type fire_boost_type
)
RETURNS BOOLEAN AS $$
DECLARE
  boost_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM public.fire_boosts
    WHERE worker_profile_id = p_worker_profile_id
      AND boost_type = p_boost_type
      AND is_active = TRUE
      AND expires_at > NOW()
  ) INTO boost_exists;

  RETURN boost_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger: Auto-create worker_fires when worker profile is created
DROP TRIGGER IF EXISTS trg_initialize_worker_fires ON public.worker_profiles;
CREATE TRIGGER trg_initialize_worker_fires
  AFTER INSERT ON public.worker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_worker_fires();

-- Trigger: Update updated_at on worker_fires
DROP TRIGGER IF EXISTS trg_worker_fires_updated_at ON public.worker_fires;
CREATE TRIGGER trg_worker_fires_updated_at
  BEFORE UPDATE ON public.worker_fires
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fire_updated_at();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.worker_fires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_login_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fire_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fire_boosts ENABLE ROW LEVEL SECURITY;

-- Policies for worker_fires
CREATE POLICY "Workers can view their own Fire balance"
  ON public.worker_fires FOR SELECT
  USING (
    worker_profile_id IN (
      SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage worker_fires"
  ON public.worker_fires FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Policies for daily_login_rewards
CREATE POLICY "Workers can view their own login rewards"
  ON public.daily_login_rewards FOR SELECT
  USING (
    worker_profile_id IN (
      SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage daily_login_rewards"
  ON public.daily_login_rewards FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Policies for fire_transactions
CREATE POLICY "Workers can view their own Fire transactions"
  ON public.fire_transactions FOR SELECT
  USING (
    worker_profile_id IN (
      SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create fire_transactions"
  ON public.fire_transactions FOR INSERT
  WITH CHECK (TRUE);

-- Policies for fire_boosts
CREATE POLICY "Workers can view their own boosts"
  ON public.fire_boosts FOR SELECT
  USING (
    worker_profile_id IN (
      SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active boosts for ranking"
  ON public.fire_boosts FOR SELECT
  USING (is_active = TRUE AND expires_at > NOW());

CREATE POLICY "System can manage fire_boosts"
  ON public.fire_boosts FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- =====================================================
-- 8. INITIAL DATA / CONFIGURATION
-- =====================================================

-- Insert Fire configuration into platform_settings
INSERT INTO public.platform_settings (key, value, description)
VALUES
  ('fire_purchase_rate', '1.0'::jsonb, 'Exchange rate: 1 USD = X Fire (default: 1.0)'),
  ('fire_daily_login_reward', '1'::jsonb, 'Fire points awarded for daily login (default: 1)'),
  ('fire_boost_featured_cost', '1'::jsonb, 'Cost in Fire for featured boost (default: 1)'),
  ('fire_boost_featured_hours', '12'::jsonb, 'Duration in hours for featured boost (default: 12)'),
  ('fire_boost_profile_cost', '1'::jsonb, 'Cost in Fire for top profile boost (default: 1)'),
  ('fire_boost_profile_hours', '2'::jsonb, 'Duration in hours for top profile boost (default: 2)')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 9. GRANTS
-- =====================================================

-- Grant access to authenticated users
GRANT SELECT ON public.worker_fires TO authenticated;
GRANT SELECT ON public.daily_login_rewards TO authenticated;
GRANT SELECT ON public.fire_transactions TO authenticated;
GRANT SELECT ON public.fire_boosts TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.expire_fire_boosts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_boosts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_boost(UUID, fire_boost_type) TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Fire Points System Migration Complete!';
  RAISE NOTICE '✓ Tables: worker_fires, daily_login_rewards, fire_transactions, fire_boosts';
  RAISE NOTICE '✓ Functions: initialize_worker_fires, update_fire_updated_at, expire_fire_boosts';
  RAISE NOTICE '✓ Triggers: Auto-initialize fires, Auto-update timestamps';
  RAISE NOTICE '✓ RLS Policies: Enabled for all tables';
  RAISE NOTICE '✓ Configuration: Added to platform_settings';
END $$;
