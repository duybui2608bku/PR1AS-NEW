-- =============================================================================
-- CHAT USER INFO SUPPORT MIGRATION
-- =============================================================================
-- This migration adds support for displaying user information in chat:
-- 1. Adds full_name and avatar_url columns to user_profiles (if not exists)
-- 2. Adds RLS policy to allow users to read profiles of conversation partners
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ADD COLUMNS TO USER_PROFILES
-- -----------------------------------------------------------------------------

-- Add full_name column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Add avatar_url column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index on full_name for faster search
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON user_profiles(full_name);

-- -----------------------------------------------------------------------------
-- 2. ADD RLS POLICY FOR CHAT
-- -----------------------------------------------------------------------------

-- Policy: Users can read profiles of their conversation partners
-- This allows authenticated users to read basic profile information
-- (email, full_name, avatar_url) of users they have conversations with.
DO $$
BEGIN
  -- Drop policy if it exists
  DROP POLICY IF EXISTS "Users can read profiles of conversation partners" ON user_profiles;
  
  -- Create the policy
  CREATE POLICY "Users can read profiles of conversation partners"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (
      -- Allow if user is reading their own profile
      auth.uid() = id
      OR
      -- Allow if user has a conversation with this profile
      EXISTS (
        SELECT 1
        FROM conversations c
        WHERE (
          (c.client_id = auth.uid() AND c.worker_id = user_profiles.id)
          OR
          (c.worker_id = auth.uid() AND c.client_id = user_profiles.id)
        )
      )
    );
END $$;

