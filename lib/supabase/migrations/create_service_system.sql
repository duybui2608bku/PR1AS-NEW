-- =============================================================================
-- SERVICE SYSTEM MIGRATION
-- =============================================================================
-- This migration creates tables for:
-- 1. Service categories (Homecare, Grooming, Assistance, Companionship)
-- 2. Services with enum keys for i18n support
-- 3. Service options (cooking types, interpreter language pairs, etc.)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. SERVICE CATEGORIES TABLE
-- Store main service categories
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_key TEXT UNIQUE NOT NULL, -- Enum key for i18n (e.g., 'CATEGORY_HOMECARE')
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  description TEXT,
  icon TEXT, -- Icon identifier for frontend
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO service_categories (name_key, slug, description, display_order) VALUES
  ('CATEGORY_HOMECARE', 'homecare', 'Home care and household services', 1),
  ('CATEGORY_GROOMING', 'grooming', 'Personal grooming and beauty services', 2),
  ('CATEGORY_ASSISTANCE', 'assistance', 'Professional assistance services', 3),
  ('CATEGORY_COMPANIONSHIP', 'companionship', 'Companionship services with different levels', 4)
ON CONFLICT (name_key) DO NOTHING;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_service_categories_slug ON service_categories(slug);
CREATE INDEX IF NOT EXISTS idx_service_categories_is_active ON service_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_service_categories_display_order ON service_categories(display_order);

-- -----------------------------------------------------------------------------
-- 2. SERVICES TABLE
-- Store all available services with enum keys for i18n
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name_key TEXT UNIQUE NOT NULL, -- Enum key for i18n (e.g., 'SERVICE_HOMECARE_COOKING_VIETNAMESE')
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  description TEXT,
  icon TEXT, -- Icon identifier for frontend

  -- Service type classification
  has_options BOOLEAN NOT NULL DEFAULT false, -- Whether this service has additional options
  parent_service_id UUID REFERENCES services(id), -- For nested services (e.g., cooking -> Vietnamese cooking)

  -- Display and status
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_certification BOOLEAN NOT NULL DEFAULT false, -- Some services may require proof

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional service-specific data

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Homecare services
INSERT INTO services (category_id, name_key, slug, description, display_order)
SELECT
  id,
  'SERVICE_HOMECARE_ORGANIZING',
  'homecare-organizing',
  'Home organizing and tidying services',
  1
FROM service_categories WHERE slug = 'homecare'
ON CONFLICT (name_key) DO NOTHING;

-- Cooking services (with cuisine types)
INSERT INTO services (category_id, name_key, slug, description, has_options, display_order)
SELECT
  id,
  'SERVICE_HOMECARE_COOKING',
  'homecare-cooking',
  'Cooking services with various cuisine options',
  true,
  2
FROM service_categories WHERE slug = 'homecare'
ON CONFLICT (name_key) DO NOTHING;

-- Insert Grooming services
INSERT INTO services (category_id, name_key, slug, description, display_order)
SELECT
  id,
  name_key,
  slug,
  description,
  display_order
FROM service_categories sc, (VALUES
  ('SERVICE_GROOMING_NAIL', 'grooming-nail', 'Nail care services', 1),
  ('SERVICE_GROOMING_FACIAL', 'grooming-facial', 'Facial care services', 2),
  ('SERVICE_GROOMING_BODY', 'grooming-body', 'Body care services', 3),
  ('SERVICE_GROOMING_HAIRCARE', 'grooming-haircare', 'Hair care services', 4)
) AS v(name_key, slug, description, display_order)
WHERE sc.slug = 'grooming'
ON CONFLICT (name_key) DO NOTHING;

-- Insert Assistance services
INSERT INTO services (category_id, name_key, slug, description, display_order)
SELECT
  id,
  name_key,
  slug,
  description,
  display_order
FROM service_categories sc, (VALUES
  ('SERVICE_ASSISTANCE_PERSONAL', 'assistance-personal', 'Personal assistant services', 1),
  ('SERVICE_ASSISTANCE_ONSITE', 'assistance-onsite', 'On-site professional assistance', 2),
  ('SERVICE_ASSISTANCE_VIRTUAL', 'assistance-virtual', 'Virtual assistant services', 3),
  ('SERVICE_ASSISTANCE_TOUR_GUIDE', 'assistance-tour-guide', 'Tour guide services', 4),
  ('SERVICE_ASSISTANCE_INTERPRETER', 'assistance-interpreter', 'Interpretation services', 5)
) AS v(name_key, slug, description, display_order)
WHERE sc.slug = 'assistance'
ON CONFLICT (name_key) DO NOTHING;

-- Insert Companionship services (3 levels)
INSERT INTO services (category_id, name_key, slug, description, display_order, metadata)
SELECT
  id,
  name_key,
  slug,
  description,
  display_order,
  metadata::jsonb
FROM service_categories sc, (VALUES
  ('SERVICE_COMPANIONSHIP_LEVEL_1', 'companionship-level-1', 'Level 1: No physical contact, casual conversation, casual attire', 1, '{"level": 1, "physical_contact": false, "intellectual_conversation": false, "attire": "casual"}'),
  ('SERVICE_COMPANIONSHIP_LEVEL_2', 'companionship-level-2', 'Level 2: No physical contact, intellectual conversation, semi-formal attire', 2, '{"level": 2, "physical_contact": false, "intellectual_conversation": true, "attire": "semi_formal"}'),
  ('SERVICE_COMPANIONSHIP_LEVEL_3', 'companionship-level-3', 'Level 3: Non-intimate physical contact allowed, intellectual conversation, formal attire', 3, '{"level": 3, "physical_contact": true, "physical_contact_type": "non_intimate", "intellectual_conversation": true, "attire": "formal"}')
) AS v(name_key, slug, description, display_order, metadata)
WHERE sc.slug = 'companionship'
ON CONFLICT (name_key) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_parent_service_id ON services(parent_service_id);
CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);

-- -----------------------------------------------------------------------------
-- 3. SERVICE OPTIONS TABLE
-- Store additional options for services (cooking types, haircare types, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  option_key TEXT NOT NULL, -- Enum key for i18n (e.g., 'COOKING_VIETNAMESE', 'HAIRCARE_CHEMICAL')
  option_type TEXT NOT NULL, -- Type of option (e.g., 'cuisine', 'haircare_type', 'language_pair')
  option_value TEXT NOT NULL, -- Value identifier (e.g., 'vietnamese', 'chemical', 'EN_TO_JA')

  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata for complex options
  metadata JSONB DEFAULT '{}'::jsonb, -- For interpreter: {"source_lang": "EN", "target_lang": "JA"}

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(service_id, option_value)
);

-- Insert cooking cuisine options
INSERT INTO service_options (service_id, option_key, option_type, option_value, display_order)
SELECT
  id,
  option_key,
  'cuisine',
  option_value,
  display_order
FROM services s, (VALUES
  ('COOKING_VIETNAMESE', 'vietnamese', 1),
  ('COOKING_KOREAN', 'korean', 2),
  ('COOKING_JAPANESE', 'japanese', 3),
  ('COOKING_CHINESE', 'chinese', 4),
  ('COOKING_WESTERN', 'western', 5)
) AS v(option_key, option_value, display_order)
WHERE s.slug = 'homecare-cooking'
ON CONFLICT (service_id, option_value) DO NOTHING;

-- Insert haircare type options
INSERT INTO service_options (service_id, option_key, option_type, option_value, display_order)
SELECT
  id,
  option_key,
  'haircare_type',
  option_value,
  display_order
FROM services s, (VALUES
  ('HAIRCARE_NON_CHEMICAL', 'non_chemical', 1),
  ('HAIRCARE_CHEMICAL', 'chemical', 2)
) AS v(option_key, option_value, display_order)
WHERE s.slug = 'grooming-haircare'
ON CONFLICT (service_id, option_value) DO NOTHING;

-- Insert interpreter language pair options
-- Format: SOURCE_TO_TARGET (e.g., EN_TO_JA means English to Japanese)
INSERT INTO service_options (service_id, option_key, option_type, option_value, metadata, display_order)
SELECT
  s.id,
  v.option_key,
  'language_pair',
  v.option_value,
  v.metadata::jsonb,
  v.display_order
FROM services s, (VALUES
  -- Vietnamese pairs
  ('INTERPRETER_VI_TO_EN', 'vi_to_en', '{"source": "VI", "target": "EN", "source_name": "Vietnamese", "target_name": "English"}', 1),
  ('INTERPRETER_VI_TO_KO', 'vi_to_ko', '{"source": "VI", "target": "KO", "source_name": "Vietnamese", "target_name": "Korean"}', 2),
  ('INTERPRETER_VI_TO_JA', 'vi_to_ja', '{"source": "VI", "target": "JA", "source_name": "Vietnamese", "target_name": "Japanese"}', 3),
  ('INTERPRETER_VI_TO_ZH', 'vi_to_zh', '{"source": "VI", "target": "ZH", "source_name": "Vietnamese", "target_name": "Chinese"}', 4),
  -- English pairs
  ('INTERPRETER_EN_TO_VI', 'en_to_vi', '{"source": "EN", "target": "VI", "source_name": "English", "target_name": "Vietnamese"}', 5),
  ('INTERPRETER_EN_TO_KO', 'en_to_ko', '{"source": "EN", "target": "KO", "source_name": "English", "target_name": "Korean"}', 6),
  ('INTERPRETER_EN_TO_JA', 'en_to_ja', '{"source": "EN", "target": "JA", "source_name": "English", "target_name": "Japanese"}', 7),
  ('INTERPRETER_EN_TO_ZH', 'en_to_zh', '{"source": "EN", "target": "ZH", "source_name": "English", "target_name": "Chinese"}', 8),
  -- Korean pairs
  ('INTERPRETER_KO_TO_VI', 'ko_to_vi', '{"source": "KO", "target": "VI", "source_name": "Korean", "target_name": "Vietnamese"}', 9),
  ('INTERPRETER_KO_TO_EN', 'ko_to_en', '{"source": "KO", "target": "EN", "source_name": "Korean", "target_name": "English"}', 10),
  ('INTERPRETER_KO_TO_JA', 'ko_to_ja', '{"source": "KO", "target": "JA", "source_name": "Korean", "target_name": "Japanese"}', 11),
  ('INTERPRETER_KO_TO_ZH', 'ko_to_zh', '{"source": "KO", "target": "ZH", "source_name": "Korean", "target_name": "Chinese"}', 12),
  -- Japanese pairs
  ('INTERPRETER_JA_TO_VI', 'ja_to_vi', '{"source": "JA", "target": "VI", "source_name": "Japanese", "target_name": "Vietnamese"}', 13),
  ('INTERPRETER_JA_TO_EN', 'ja_to_en', '{"source": "JA", "target": "EN", "source_name": "Japanese", "target_name": "English"}', 14),
  ('INTERPRETER_JA_TO_KO', 'ja_to_ko', '{"source": "JA", "target": "KO", "source_name": "Japanese", "target_name": "Korean"}', 15),
  ('INTERPRETER_JA_TO_ZH', 'ja_to_zh', '{"source": "JA", "target": "ZH", "source_name": "Japanese", "target_name": "Chinese"}', 16),
  -- Chinese pairs
  ('INTERPRETER_ZH_TO_VI', 'zh_to_vi', '{"source": "ZH", "target": "VI", "source_name": "Chinese", "target_name": "Vietnamese"}', 17),
  ('INTERPRETER_ZH_TO_EN', 'zh_to_en', '{"source": "ZH", "target": "EN", "source_name": "Chinese", "target_name": "English"}', 18),
  ('INTERPRETER_ZH_TO_KO', 'zh_to_ko', '{"source": "ZH", "target": "KO", "source_name": "Chinese", "target_name": "Korean"}', 19),
  ('INTERPRETER_ZH_TO_JA', 'zh_to_ja', '{"source": "ZH", "target": "JA", "source_name": "Chinese", "target_name": "Japanese"}', 20)
) AS v(option_key, option_value, metadata, display_order)
WHERE s.slug = 'assistance-interpreter'
ON CONFLICT (service_id, option_value) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_options_service_id ON service_options(service_id);
CREATE INDEX IF NOT EXISTS idx_service_options_option_type ON service_options(option_type);
CREATE INDEX IF NOT EXISTS idx_service_options_is_active ON service_options(is_active);

-- -----------------------------------------------------------------------------
-- 4. TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- -----------------------------------------------------------------------------

CREATE TRIGGER update_service_categories_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_options_updated_at
  BEFORE UPDATE ON service_options
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_options ENABLE ROW LEVEL SECURITY;

-- Public read access for all service-related tables
CREATE POLICY "Anyone can view active service categories"
  ON service_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can view active service options"
  ON service_options FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Only admins can modify service data
CREATE POLICY "Admins can manage service categories"
  ON service_categories FOR ALL
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

CREATE POLICY "Admins can manage services"
  ON services FOR ALL
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

CREATE POLICY "Admins can manage service options"
  ON service_options FOR ALL
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

-- Comment documentation
COMMENT ON TABLE service_categories IS 'Main service categories (Homecare, Grooming, Assistance, Companionship)';
COMMENT ON TABLE services IS 'All available services with i18n enum keys';
COMMENT ON TABLE service_options IS 'Additional options for services (cuisine types, language pairs, etc.)';

COMMENT ON COLUMN services.name_key IS 'i18n enum key for service name translation';
COMMENT ON COLUMN service_options.option_key IS 'i18n enum key for option name translation';
COMMENT ON COLUMN service_options.metadata IS 'Additional data for complex options like language pairs';
