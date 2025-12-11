-- Create site_settings_history table for versioning SEO settings
CREATE TABLE IF NOT EXISTS site_settings_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  settings_key TEXT NOT NULL, -- 'seo_settings'
  value JSONB NOT NULL, -- The settings value at this point in time
  version_number INTEGER NOT NULL, -- Sequential version number
  changed_by UUID REFERENCES auth.users(id), -- Admin who made the change
  change_reason TEXT, -- Optional reason for the change
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on settings_key and version_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_history_key ON site_settings_history(settings_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_history_version ON site_settings_history(settings_key, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_site_settings_history_created ON site_settings_history(created_at DESC);

-- Enable RLS
ALTER TABLE site_settings_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public can read site settings history" ON site_settings_history;
DROP POLICY IF EXISTS "Only admins can insert site settings history" ON site_settings_history;

-- Create policy: Public can read (for viewing history)
CREATE POLICY "Public can read site settings history"
  ON site_settings_history FOR SELECT
  TO public
  USING (true);

-- Create policy: Only admins can insert history records
CREATE POLICY "Only admins can insert site settings history"
  ON site_settings_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to get next version number for a settings key
CREATE OR REPLACE FUNCTION get_next_version_number(p_settings_key TEXT)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM site_settings_history
  WHERE settings_key = p_settings_key;
  
  RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create history entry when site_settings is updated
-- Note: This will be called from application code instead for better control
-- But we keep the function available for manual use

