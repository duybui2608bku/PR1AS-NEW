-- =============================================================================
-- FIX REALTIME BASED ON DEBUG RESULTS
-- =============================================================================
-- Dựa trên kết quả debug, fix các vấn đề sau:
-- 1. Grant SELECT permission cho supabase_realtime role (nếu tồn tại)
-- 2. Tạo lại RLS policy production thay vì policy test
-- 3. Set REPLICA IDENTITY
-- 4. Verify publication
-- =============================================================================

-- =============================================================================
-- 1. GRANT SELECT PERMISSION CHO supabase_realtime ROLE
-- =============================================================================
DO $$
BEGIN
  -- Check if supabase_realtime role exists
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime') THEN
    -- Grant SELECT permission to supabase_realtime role
    GRANT SELECT ON public.messages TO supabase_realtime;
    GRANT SELECT ON public.conversations TO supabase_realtime;
    RAISE NOTICE '✅ Granted SELECT permission to supabase_realtime role';
  ELSE
    RAISE NOTICE '⚠️ supabase_realtime role does not exist. Using authenticated role instead.';
    -- Ensure authenticated has permission (should already have it)
    GRANT SELECT ON public.messages TO authenticated;
    GRANT SELECT ON public.conversations TO authenticated;
    RAISE NOTICE '✅ Verified SELECT permission for authenticated role';
  END IF;
END $$;

-- =============================================================================
-- 2. TẠO LẠI RLS POLICY PRODUCTION
-- =============================================================================
-- Drop policy test hiện tại
DROP POLICY IF EXISTS "Test: Allow all authenticated users" ON messages;
DROP POLICY IF EXISTS "Test: Simple policy" ON messages;
DROP POLICY IF EXISTS "Test: Realtime friendly policy" ON messages;

-- Tạo lại policy production
-- Policy này cho phép participants xem messages trong conversations của họ
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON messages;

CREATE POLICY "Participants can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    )
  );

RAISE NOTICE '✅ Created production RLS policy for messages SELECT';

-- Tạo lại admin policy nếu chưa có
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;

CREATE POLICY "Admins can manage all messages"
  ON messages FOR ALL
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

RAISE NOTICE '✅ Created admin policy for messages';

-- =============================================================================
-- 3. SET REPLICA IDENTITY
-- =============================================================================
DO $$
DECLARE
  current_identity CHAR;
BEGIN
  SELECT relreplident INTO current_identity
  FROM pg_class
  WHERE relname = 'messages'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  IF current_identity IS NULL OR current_identity = 'n' THEN
    ALTER TABLE messages REPLICA IDENTITY DEFAULT;
    RAISE NOTICE '✅ Set REPLICA IDENTITY to DEFAULT for messages table';
  ELSE
    RAISE NOTICE '✅ REPLICA IDENTITY is already set correctly (current: %)', 
      CASE 
        WHEN current_identity = 'd' THEN 'DEFAULT'
        WHEN current_identity = 'f' THEN 'FULL'
        WHEN current_identity = 'i' THEN 'INDEX'
        ELSE 'Unknown'
      END;
  END IF;
END $$;

-- =============================================================================
-- 4. VERIFY PUBLICATION
-- =============================================================================
DO $$
BEGIN
  -- Check if publication exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RAISE WARNING '⚠️ Publication supabase_realtime does not exist. Please enable Realtime in Supabase Dashboard.';
  ELSE
    -- Check if messages table is in publication
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'messages'
      AND schemaname = 'public'
    ) THEN
      -- Add messages table to publication
      ALTER PUBLICATION supabase_realtime ADD TABLE messages;
      RAISE NOTICE '✅ Added messages table to supabase_realtime publication';
    ELSE
      RAISE NOTICE '✅ Messages table is already in supabase_realtime publication';
    END IF;
  END IF;
END $$;

-- =============================================================================
-- 5. VERIFY KẾT QUẢ
-- =============================================================================
-- Kiểm tra permissions
SELECT 
  'Permissions Check' as check_type,
  grantee,
  privilege_type,
  CASE 
    WHEN grantee = 'supabase_realtime' THEN '✅ supabase_realtime has permission'
    WHEN grantee = 'authenticated' THEN '✅ authenticated has permission'
    ELSE '⚠️ Other role'
  END as status
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'messages'
  AND privilege_type = 'SELECT'
  AND grantee IN ('supabase_realtime', 'authenticated', 'anon')
ORDER BY grantee;

-- Kiểm tra RLS policies
SELECT 
  'RLS Policies Check' as check_type,
  policyname,
  permissive,
  roles,
  CASE 
    WHEN policyname LIKE 'Test:%' THEN '❌ Test policy - should be removed'
    WHEN policyname = 'Participants can view messages in their conversations' THEN '✅ Production policy'
    WHEN policyname = 'Admins can manage all messages' THEN '✅ Admin policy'
    ELSE '⚠️ Other policy'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- Kiểm tra Replica Identity
SELECT 
  'Replica Identity Check' as check_type,
  relname as table_name,
  relreplident as replica_identity,
  CASE 
    WHEN relreplident = 'd' THEN '✅ DEFAULT (primary key) - OK for Realtime'
    WHEN relreplident = 'f' THEN '✅ FULL - OK for Realtime'
    WHEN relreplident = 'n' THEN '❌ NOTHING - Realtime will NOT work!'
    WHEN relreplident = 'i' THEN '✅ INDEX - OK for Realtime'
    ELSE '⚠️ Unknown'
  END as status
FROM pg_class
WHERE relname = 'messages'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Kiểm tra Publication
SELECT 
  'Publication Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'messages'
      AND schemaname = 'public'
    )
    THEN '✅ Messages table is in publication'
    ELSE '❌ Messages table NOT in publication'
  END as status;

-- =============================================================================
-- SUMMARY
-- =============================================================================
SELECT 
  'SUMMARY' as section,
  'Next Steps:' as note,
  '1. Enable Realtime in Supabase Dashboard: Database > Replication > Enable for messages table' as step1,
  '2. Test with RealtimeTest component to verify realtime is working' as step2,
  '3. Check browser console for subscription status and received events' as step3;
