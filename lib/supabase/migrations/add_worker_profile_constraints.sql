-- =============================================================================
-- ADDITIONAL DATABASE CONSTRAINTS FOR DATA INTEGRITY
-- =============================================================================
-- This migration adds additional constraints to ensure data integrity
-- =============================================================================

-- Add constraints to worker_profiles table
DO $$
BEGIN
  -- Add length constraints
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'worker_profiles_full_name_length_check'
  ) THEN
    ALTER TABLE worker_profiles 
    ADD CONSTRAINT worker_profiles_full_name_length_check 
    CHECK (LENGTH(full_name) >= 2 AND LENGTH(full_name) <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'worker_profiles_nickname_length_check'
  ) THEN
    ALTER TABLE worker_profiles 
    ADD CONSTRAINT worker_profiles_nickname_length_check 
    CHECK (nickname IS NULL OR (LENGTH(nickname) >= 1 AND LENGTH(nickname) <= 50));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'worker_profiles_personal_quote_length_check'
  ) THEN
    ALTER TABLE worker_profiles 
    ADD CONSTRAINT worker_profiles_personal_quote_length_check 
    CHECK (personal_quote IS NULL OR LENGTH(personal_quote) <= 200);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'worker_profiles_bio_length_check'
  ) THEN
    ALTER TABLE worker_profiles 
    ADD CONSTRAINT worker_profiles_bio_length_check 
    CHECK (bio IS NULL OR LENGTH(bio) <= 1000);
  END IF;

  -- Add constraint for completed_steps (bitmask: 0, 1, 2, 3)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'worker_profiles_completed_steps_check'
  ) THEN
    ALTER TABLE worker_profiles 
    ADD CONSTRAINT worker_profiles_completed_steps_check 
    CHECK (profile_completed_steps >= 0 AND profile_completed_steps <= 3);
  END IF;

  -- Add constraint for version (must be positive)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'worker_profiles' 
    AND column_name = 'version'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'worker_profiles_version_check'
    ) THEN
      ALTER TABLE worker_profiles 
      ADD CONSTRAINT worker_profiles_version_check 
      CHECK (version > 0);
    END IF;
  END IF;
END $$;

-- Add constraints to worker_tags table
DO $$
BEGIN
  -- Add length constraints
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'worker_tags_tag_key_length_check'
  ) THEN
    ALTER TABLE worker_tags 
    ADD CONSTRAINT worker_tags_tag_key_length_check 
    CHECK (LENGTH(tag_key) >= 1 AND LENGTH(tag_key) <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'worker_tags_tag_value_length_check'
  ) THEN
    ALTER TABLE worker_tags 
    ADD CONSTRAINT worker_tags_tag_value_length_check 
    CHECK (LENGTH(tag_value) >= 1 AND LENGTH(tag_value) <= 200);
  END IF;
END $$;

-- Add constraints to worker_images table
DO $$
BEGIN
  -- Add file size constraint (max 10MB)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'worker_images_file_size_check'
  ) THEN
    ALTER TABLE worker_images 
    ADD CONSTRAINT worker_images_file_size_check 
    CHECK (file_size_bytes IS NULL OR (file_size_bytes > 0 AND file_size_bytes <= 10485760));
  END IF;

  -- Add dimension constraints
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'worker_images_width_check'
  ) THEN
    ALTER TABLE worker_images 
    ADD CONSTRAINT worker_images_width_check 
    CHECK (width_px IS NULL OR (width_px > 0 AND width_px <= 10000));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'worker_images_height_check'
  ) THEN
    ALTER TABLE worker_images 
    ADD CONSTRAINT worker_images_height_check 
    CHECK (height_px IS NULL OR (height_px > 0 AND height_px <= 10000));
  END IF;

  -- Add URL format constraint (basic check)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'worker_images_url_format_check'
  ) THEN
    ALTER TABLE worker_images 
    ADD CONSTRAINT worker_images_url_format_check 
    CHECK (image_url ~ '^https?://');
  END IF;
END $$;

-- Add constraints to worker_service_prices table
DO $$
BEGIN
  -- Add discount percentage constraints
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'worker_service_prices_discount_check'
  ) THEN
    ALTER TABLE worker_service_prices 
    ADD CONSTRAINT worker_service_prices_discount_check 
    CHECK (
      daily_discount_percent >= 0 AND daily_discount_percent <= 100 AND
      weekly_discount_percent >= 0 AND weekly_discount_percent <= 100 AND
      monthly_discount_percent >= 0 AND monthly_discount_percent <= 100
    );
  END IF;
END $$;

