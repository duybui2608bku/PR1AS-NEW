-- =============================================================================
-- WORKER FAVORITES SYSTEM MIGRATION
-- =============================================================================
-- This migration creates a table for users to favorite workers
-- =============================================================================

-- -----------------------------------------------------------------------------
-- WORKER FAVORITES TABLE
-- Stores favorite relationships between users (clients) and workers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS worker_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  worker_profile_id UUID NOT NULL REFERENCES worker_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only favorite a worker once
  UNIQUE(user_id, worker_profile_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_favorites_user_id ON worker_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_favorites_worker_profile_id ON worker_favorites(worker_profile_id);
CREATE INDEX IF NOT EXISTS idx_worker_favorites_created_at ON worker_favorites(created_at DESC);

-- Enable RLS
ALTER TABLE worker_favorites ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read their own favorites
CREATE POLICY "Users can read their own favorites"
  ON worker_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites"
  ON worker_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites"
  ON worker_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE worker_favorites IS 'Stores favorite relationships between users and workers';

