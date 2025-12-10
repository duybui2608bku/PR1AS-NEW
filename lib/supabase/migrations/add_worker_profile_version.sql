-- =============================================================================
-- ADD VERSION FIELD FOR OPTIMISTIC LOCKING
-- =============================================================================
-- This migration adds a version field to worker_profiles table for optimistic locking
-- to prevent concurrent update conflicts
-- =============================================================================

-- Add version column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'worker_profiles' 
    AND column_name = 'version'
  ) THEN
    ALTER TABLE worker_profiles 
    ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
    
    -- Create index for version column
    CREATE INDEX IF NOT EXISTS idx_worker_profiles_version 
    ON worker_profiles(version);
    
    -- Add comment
    COMMENT ON COLUMN worker_profiles.version IS 
    'Version number for optimistic locking. Increments on each update.';
  END IF;
END $$;

