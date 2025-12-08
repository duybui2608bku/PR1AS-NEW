-- =============================================================================
-- TEST: Temporarily modify RLS policy to allow Realtime events
-- =============================================================================
-- This is a TEMPORARY test to see if RLS is blocking Realtime events
-- DO NOT use in production!
-- =============================================================================

-- Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages'
ORDER BY policyname;

-- Option 1: Temporarily disable RLS for testing (NOT RECOMMENDED FOR PRODUCTION)
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Option 2: Create a more permissive policy for Realtime testing
-- This policy allows authenticated users to see messages in conversations they're part of
-- but might work better with Realtime
DROP POLICY IF EXISTS "Test: Realtime friendly policy" ON messages;

CREATE POLICY "Test: Realtime friendly policy" AS PERMISSIVE
  ON messages FOR SELECT
  TO authenticated
  USING (
    -- Check if user is participant in the conversation
    EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    )
  );

-- Note: This creates a PERMISSIVE policy which means it will be combined with other policies
-- If you have other SELECT policies, they will be OR'd together

-- To revert: Drop this test policy
-- DROP POLICY IF EXISTS "Test: Realtime friendly policy" ON messages;

