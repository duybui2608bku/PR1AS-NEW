-- Setup Storage RLS Policies for image bucket
-- This script configures Row Level Security policies for Supabase Storage

-- ===========================================
-- Step 1: Ensure bucket exists
-- ===========================================
-- Note: Bucket must be created manually in Supabase Dashboard first
-- Storage > Create bucket > Name: "image" > Public: true

-- ===========================================
-- Step 2: Drop existing policies if they exist
-- ===========================================
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- ===========================================
-- Step 3: Create RLS Policies
-- ===========================================

-- Policy 1: Anyone can view/read images (public access)
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'image');

-- Policy 2: Authenticated users can upload images
-- Note: File naming pattern is: folder/userId_timestamp_random.extension
-- We allow any authenticated user to upload to 'image' bucket
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'image'
  AND (storage.foldername(name))[1] IS NOT NULL
);

-- Policy 3: Users can update their own images
-- Check if userId in file path matches auth.uid()
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'image'
  AND (
    -- Extract userId from path: folder/userId_timestamp_random.ext
    -- Pattern: split by '_' and check if first part after folder matches user id
    (storage.foldername(name))[1] IS NOT NULL
    AND (
      -- Try to match userId pattern in filename
      -- File format: folder/userId_timestamp_random.ext
      -- We check if the filename starts with auth.uid()::text
      (storage.foldername(name))[2] LIKE auth.uid()::text || '_%'
      OR
      -- Fallback: allow if user owns the file based on folder structure
      (storage.foldername(name))[1] = auth.uid()::text
    )
  )
)
WITH CHECK (
  bucket_id = 'image'
  AND (
    (storage.foldername(name))[1] IS NOT NULL
    AND (
      (storage.foldername(name))[2] LIKE auth.uid()::text || '_%'
      OR
      (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);

-- Policy 4: Users can delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'image'
  AND (
    -- Check if userId in filename matches auth.uid()
    (storage.foldername(name))[2] LIKE auth.uid()::text || '_%'
    OR
    -- Or if folder name is the userId
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- ===========================================
-- Alternative: Simpler policies (less strict)
-- Uncomment below if the above policies are too complex
-- ===========================================

/*
-- Simpler approach: Allow authenticated users to upload/update/delete
-- File ownership is enforced at API level, not storage level

-- Policy: Authenticated users can upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'image');

-- Policy: Authenticated users can update
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'image')
WITH CHECK (bucket_id = 'image');

-- Policy: Authenticated users can delete
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'image');
*/

-- ===========================================
-- Step 4: Verify policies
-- ===========================================
-- Check created policies
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%image%'
ORDER BY policyname;

