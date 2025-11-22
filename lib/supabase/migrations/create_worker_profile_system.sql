-- =============================================================================
-- WORKER PROFILE SYSTEM MIGRATION
-- =============================================================================
-- This migration creates tables for:
-- 1. Worker profiles (extended user information for workers)
-- 2. Worker tags (interests and hobbies)
-- 3. Worker availabilities (weekly schedule)
-- 4. Worker images (avatar and gallery)
-- 5. Worker services (many-to-many with services)
-- 6. Worker service prices (pricing per service with multi-currency support)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. WORKER PROFILES TABLE
-- Extended profile information for workers (Step 1 of profile setup)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Basic information (Step 1)
  full_name TEXT NOT NULL, -- Họ và Tên *
  nickname TEXT, -- Biệt Danh
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100), -- Tuổi *
  height_cm INTEGER CHECK (height_cm >= 100 AND height_cm <= 250), -- Chiều cao (cm) *
  weight_kg INTEGER CHECK (weight_kg >= 30 AND weight_kg <= 300), -- Cân nặng (kg) *
  zodiac_sign TEXT, -- Cung hoàng đạo
  lifestyle TEXT, -- Lối sống (enum key for i18n)
  personal_quote TEXT, -- Câu nói cá nhân
  bio TEXT, -- Giới thiệu mô tả

  -- Profile status
  profile_status TEXT NOT NULL DEFAULT 'draft' CHECK (profile_status IN (
    'draft',      -- Still editing
    'pending',    -- Submitted for review
    'approved',   -- Approved by admin
    'rejected',   -- Rejected by admin
    'published'   -- Live and visible to clients
  )),
  profile_completed_steps INTEGER NOT NULL DEFAULT 0, -- Track which steps are completed (bitmask: 1=step1, 2=step2)

  -- Admin review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_profiles_user_id ON worker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_profile_status ON worker_profiles(profile_status);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_lifestyle ON worker_profiles(lifestyle);

-- -----------------------------------------------------------------------------
-- 2. WORKER TAGS TABLE
-- Store interests and hobbies as tags
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  tag_key TEXT NOT NULL, -- Tag identifier (e.g., 'TAG_SPORTS', 'TAG_READING')
  tag_value TEXT NOT NULL, -- Display value for custom tags
  tag_type TEXT NOT NULL DEFAULT 'interest' CHECK (tag_type IN ('interest', 'hobby', 'skill')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(worker_profile_id, tag_key)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_worker_tags_worker_profile_id ON worker_tags(worker_profile_id);
CREATE INDEX IF NOT EXISTS idx_worker_tags_tag_type ON worker_tags(tag_type);

-- -----------------------------------------------------------------------------
-- 3. WORKER AVAILABILITIES TABLE
-- Store weekly availability schedule (Thời gian rảnh trong tuần)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,

  -- Day of week (1 = Monday, 7 = Sunday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),

  -- Availability type
  availability_type TEXT NOT NULL CHECK (availability_type IN (
    'all_day',          -- Rảnh cả ngày
    'time_range',       -- Rảnh theo khung giờ
    'not_available'     -- Không rảnh
  )),

  -- Time ranges (for time_range type)
  start_time TIME, -- e.g., '18:00:00'
  end_time TIME,   -- e.g., '21:00:00'

  -- Notes
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure valid time range
  CHECK (
    (availability_type = 'time_range' AND start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
    OR (availability_type != 'time_range')
  ),

  UNIQUE(worker_profile_id, day_of_week, start_time, end_time)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_worker_availabilities_worker_profile_id ON worker_availabilities(worker_profile_id);
CREATE INDEX IF NOT EXISTS idx_worker_availabilities_day_of_week ON worker_availabilities(day_of_week);

-- -----------------------------------------------------------------------------
-- 4. WORKER IMAGES TABLE
-- Store avatar and gallery images (Step 2 of profile setup)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,

  -- Image details
  image_url TEXT NOT NULL, -- URL from storage
  image_type TEXT NOT NULL CHECK (image_type IN ('avatar', 'gallery')),
  display_order INTEGER NOT NULL DEFAULT 0, -- For gallery sorting

  -- Image metadata
  file_name TEXT,
  file_size_bytes INTEGER,
  mime_type TEXT,
  width_px INTEGER,
  height_px INTEGER,

  -- Status
  is_approved BOOLEAN NOT NULL DEFAULT false, -- Admin approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_images_worker_profile_id ON worker_images(worker_profile_id);
CREATE INDEX IF NOT EXISTS idx_worker_images_image_type ON worker_images(image_type);
CREATE INDEX IF NOT EXISTS idx_worker_images_display_order ON worker_images(display_order);

-- -----------------------------------------------------------------------------
-- 5. WORKER SERVICES TABLE
-- Many-to-many relationship between workers and services (Step 2)
-- Workers can select multiple services they offer
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_profile_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  -- If service has options (e.g., cooking cuisine), store selected option
  service_option_id UUID REFERENCES service_options(id),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false, -- Highlight this service

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(worker_profile_id, service_id, service_option_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_services_worker_profile_id ON worker_services(worker_profile_id);
CREATE INDEX IF NOT EXISTS idx_worker_services_service_id ON worker_services(service_id);
CREATE INDEX IF NOT EXISTS idx_worker_services_service_option_id ON worker_services(service_option_id);
CREATE INDEX IF NOT EXISTS idx_worker_services_is_active ON worker_services(is_active);

-- -----------------------------------------------------------------------------
-- 6. WORKER SERVICE PRICES TABLE
-- Pricing for each worker-service combination with multi-currency support
-- Supports hourly, daily, weekly, monthly rates
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_service_id UUID NOT NULL REFERENCES worker_services(id) ON DELETE CASCADE,

  -- Base pricing (hourly rate in various currencies)
  price_usd DECIMAL(10, 2) CHECK (price_usd >= 0),
  price_vnd DECIMAL(15, 2) CHECK (price_vnd >= 0),
  price_jpy DECIMAL(10, 2) CHECK (price_jpy >= 0),
  price_krw DECIMAL(10, 2) CHECK (price_krw >= 0),
  price_cny DECIMAL(10, 2) CHECK (price_cny >= 0),

  -- Primary currency set by worker
  primary_currency TEXT NOT NULL CHECK (primary_currency IN ('USD', 'VND', 'JPY', 'KRW', 'CNY')),

  -- Auto-calculated rates based on hourly price
  -- Daily rate = hourly * 8
  -- Weekly rate = hourly * 56 (8 hours * 7 days)
  -- Monthly rate = hourly * 160 (8 hours * 20 working days)
  -- These are calculated by application, not stored

  -- Discount for long-term bookings (optional)
  daily_discount_percent DECIMAL(5, 2) DEFAULT 0 CHECK (daily_discount_percent >= 0 AND daily_discount_percent <= 100),
  weekly_discount_percent DECIMAL(5, 2) DEFAULT 0 CHECK (weekly_discount_percent >= 0 AND weekly_discount_percent <= 100),
  monthly_discount_percent DECIMAL(5, 2) DEFAULT 0 CHECK (monthly_discount_percent >= 0 AND monthly_discount_percent <= 100),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure at least one price is set in primary currency
  CHECK (
    (primary_currency = 'USD' AND price_usd IS NOT NULL) OR
    (primary_currency = 'VND' AND price_vnd IS NOT NULL) OR
    (primary_currency = 'JPY' AND price_jpy IS NOT NULL) OR
    (primary_currency = 'KRW' AND price_krw IS NOT NULL) OR
    (primary_currency = 'CNY' AND price_cny IS NOT NULL)
  ),

  UNIQUE(worker_service_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_worker_service_prices_worker_service_id ON worker_service_prices(worker_service_id);
CREATE INDEX IF NOT EXISTS idx_worker_service_prices_primary_currency ON worker_service_prices(primary_currency);

-- -----------------------------------------------------------------------------
-- 7. TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- -----------------------------------------------------------------------------

CREATE TRIGGER update_worker_profiles_updated_at
  BEFORE UPDATE ON worker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_availabilities_updated_at
  BEFORE UPDATE ON worker_availabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_images_updated_at
  BEFORE UPDATE ON worker_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_services_updated_at
  BEFORE UPDATE ON worker_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_worker_service_prices_updated_at
  BEFORE UPDATE ON worker_service_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_service_prices ENABLE ROW LEVEL SECURITY;

-- WORKER PROFILES POLICIES
-- Workers can view and edit their own profile
CREATE POLICY "Workers can view their own profile"
  ON worker_profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
  );

CREATE POLICY "Workers can update their own profile"
  ON worker_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Workers can create their own profile"
  ON worker_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Clients can view published worker profiles
CREATE POLICY "Clients can view published worker profiles"
  ON worker_profiles FOR SELECT
  TO authenticated
  USING (profile_status = 'published');

-- Admins can view and manage all profiles
CREATE POLICY "Admins can manage all worker profiles"
  ON worker_profiles FOR ALL
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

-- WORKER TAGS POLICIES
CREATE POLICY "Workers can manage their own tags"
  ON worker_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE id = worker_profile_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE id = worker_profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view tags of published profiles"
  ON worker_tags FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE id = worker_profile_id AND profile_status = 'published'
    )
  );

-- WORKER AVAILABILITIES POLICIES
CREATE POLICY "Workers can manage their own availabilities"
  ON worker_availabilities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE id = worker_profile_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE id = worker_profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view availabilities of published profiles"
  ON worker_availabilities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE id = worker_profile_id AND profile_status = 'published'
    )
  );

-- WORKER IMAGES POLICIES
CREATE POLICY "Workers can manage their own images"
  ON worker_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE id = worker_profile_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE id = worker_profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view approved images of published profiles"
  ON worker_images FOR SELECT
  TO authenticated
  USING (
    is_approved = true AND
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE id = worker_profile_id AND profile_status = 'published'
    )
  );

-- WORKER SERVICES POLICIES
CREATE POLICY "Workers can manage their own services"
  ON worker_services FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE id = worker_profile_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE id = worker_profile_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view services of published profiles"
  ON worker_services FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM worker_profiles
      WHERE id = worker_profile_id AND profile_status = 'published'
    )
  );

-- WORKER SERVICE PRICES POLICIES
CREATE POLICY "Workers can manage their own prices"
  ON worker_service_prices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM worker_services ws
      JOIN worker_profiles wp ON ws.worker_profile_id = wp.id
      WHERE ws.id = worker_service_id AND wp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM worker_services ws
      JOIN worker_profiles wp ON ws.worker_profile_id = wp.id
      WHERE ws.id = worker_service_id AND wp.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view prices of published profiles"
  ON worker_service_prices FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM worker_services ws
      JOIN worker_profiles wp ON ws.worker_profile_id = wp.id
      WHERE ws.id = worker_service_id AND wp.profile_status = 'published'
    )
  );

-- -----------------------------------------------------------------------------
-- 9. UTILITY FUNCTIONS
-- -----------------------------------------------------------------------------

-- Function to calculate price tiers from hourly rate
CREATE OR REPLACE FUNCTION calculate_price_tiers(
  hourly_price DECIMAL,
  daily_discount DECIMAL DEFAULT 0,
  weekly_discount DECIMAL DEFAULT 0,
  monthly_discount DECIMAL DEFAULT 0,
  OUT hourly DECIMAL,
  OUT daily DECIMAL,
  OUT weekly DECIMAL,
  OUT monthly DECIMAL
)
AS $$
BEGIN
  hourly := hourly_price;
  daily := ROUND(hourly_price * 8 * (1 - daily_discount / 100), 2);
  weekly := ROUND(hourly_price * 56 * (1 - weekly_discount / 100), 2);
  monthly := ROUND(hourly_price * 160 * (1 - monthly_discount / 100), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get highest price when multiple services are booked
CREATE OR REPLACE FUNCTION get_highest_service_price(
  worker_profile_uuid UUID,
  currency TEXT DEFAULT 'USD'
)
RETURNS DECIMAL AS $$
DECLARE
  max_price DECIMAL;
BEGIN
  CASE currency
    WHEN 'USD' THEN
      SELECT MAX(wsp.price_usd) INTO max_price
      FROM worker_service_prices wsp
      JOIN worker_services ws ON wsp.worker_service_id = ws.id
      WHERE ws.worker_profile_id = worker_profile_uuid
        AND ws.is_active = true
        AND wsp.is_active = true
        AND wsp.price_usd IS NOT NULL;
    WHEN 'VND' THEN
      SELECT MAX(wsp.price_vnd) INTO max_price
      FROM worker_service_prices wsp
      JOIN worker_services ws ON wsp.worker_service_id = ws.id
      WHERE ws.worker_profile_id = worker_profile_uuid
        AND ws.is_active = true
        AND wsp.is_active = true
        AND wsp.price_vnd IS NOT NULL;
    WHEN 'JPY' THEN
      SELECT MAX(wsp.price_jpy) INTO max_price
      FROM worker_service_prices wsp
      JOIN worker_services ws ON wsp.worker_service_id = ws.id
      WHERE ws.worker_profile_id = worker_profile_uuid
        AND ws.is_active = true
        AND wsp.is_active = true
        AND wsp.price_jpy IS NOT NULL;
    WHEN 'KRW' THEN
      SELECT MAX(wsp.price_krw) INTO max_price
      FROM worker_service_prices wsp
      JOIN worker_services ws ON wsp.worker_service_id = ws.id
      WHERE ws.worker_profile_id = worker_profile_uuid
        AND ws.is_active = true
        AND wsp.is_active = true
        AND wsp.price_krw IS NOT NULL;
    WHEN 'CNY' THEN
      SELECT MAX(wsp.price_cny) INTO max_price
      FROM worker_service_prices wsp
      JOIN worker_services ws ON wsp.worker_service_id = ws.id
      WHERE ws.worker_profile_id = worker_profile_uuid
        AND ws.is_active = true
        AND wsp.is_active = true
        AND wsp.price_cny IS NOT NULL;
    ELSE
      max_price := 0;
  END CASE;

  RETURN COALESCE(max_price, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check if worker profile is complete
CREATE OR REPLACE FUNCTION is_worker_profile_complete(worker_profile_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
  has_avatar BOOLEAN;
  has_services BOOLEAN;
BEGIN
  -- Check basic profile fields
  SELECT * INTO profile_record
  FROM worker_profiles
  WHERE id = worker_profile_uuid;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Step 1: Check required fields
  IF profile_record.full_name IS NULL OR
     profile_record.age IS NULL OR
     profile_record.height_cm IS NULL OR
     profile_record.weight_kg IS NULL THEN
    RETURN false;
  END IF;

  -- Step 2: Check avatar
  SELECT EXISTS(
    SELECT 1 FROM worker_images
    WHERE worker_profile_id = worker_profile_uuid
      AND image_type = 'avatar'
      AND is_approved = true
  ) INTO has_avatar;

  IF NOT has_avatar THEN
    RETURN false;
  END IF;

  -- Step 2: Check at least one service
  SELECT EXISTS(
    SELECT 1 FROM worker_services
    WHERE worker_profile_id = worker_profile_uuid
      AND is_active = true
  ) INTO has_services;

  IF NOT has_services THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Comment documentation
COMMENT ON TABLE worker_profiles IS 'Extended profile information for workers';
COMMENT ON TABLE worker_tags IS 'Interests and hobbies tags for workers';
COMMENT ON TABLE worker_availabilities IS 'Weekly availability schedule for workers';
COMMENT ON TABLE worker_images IS 'Avatar and gallery images for worker profiles';
COMMENT ON TABLE worker_services IS 'Services offered by workers (many-to-many)';
COMMENT ON TABLE worker_service_prices IS 'Pricing per service with multi-currency support';

COMMENT ON COLUMN worker_profiles.profile_completed_steps IS 'Bitmask tracking completed profile steps (1=step1, 2=step2)';
COMMENT ON COLUMN worker_profiles.lifestyle IS 'Lifestyle enum key for i18n translation';
COMMENT ON COLUMN worker_service_prices.primary_currency IS 'Currency set by worker when creating price';
COMMENT ON FUNCTION calculate_price_tiers IS 'Calculate hourly/daily/weekly/monthly prices with optional discounts';
COMMENT ON FUNCTION get_highest_service_price IS 'Get highest price when worker offers multiple services';
