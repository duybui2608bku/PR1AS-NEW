-- Create site_settings table for storing site configuration
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Only authenticated users can read
CREATE POLICY "Public can read site settings"
  ON site_settings FOR SELECT
  TO public
  USING (true);

-- Create policy: Only admins can insert/update/delete
CREATE POLICY "Only admins can modify site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@pr1as.com'
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'email' = 'admin@pr1as.com'
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Insert default SEO settings
INSERT INTO site_settings (key, value) VALUES (
  'seo_settings',
  '{
    "siteName": "PR1AS",
    "siteTitle": "PR1AS - Nền tảng kết nối Client & Worker",
    "siteDescription": "Tìm kiếm và thuê Worker chuyên nghiệp hoặc cung cấp dịch vụ và kiếm thu nhập",
    "siteKeywords": "worker, client, dịch vụ, tìm việc, thuê người, PR1AS",
    "ogImage": "",
    "headerLogo": "/logo.png",
    "headerTagline": "Connect. Work. Succeed.",
    "headerContactPhone": "",
    "headerContactEmail": "contact@pr1as.com",
    "footerCompanyName": "PR1AS Company Ltd.",
    "footerAddress": "",
    "footerPhone": "",
    "footerEmail": "info@pr1as.com",
    "footerCopyright": "© 2024 PR1AS. All rights reserved.",
    "footerAbout": "",
    "facebookUrl": "",
    "twitterUrl": "",
    "instagramUrl": "",
    "linkedinUrl": ""
  }'::jsonb
) ON CONFLICT (key) DO NOTHING;
