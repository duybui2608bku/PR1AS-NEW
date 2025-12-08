-- =============================================================================
-- COMPREHENSIVE REALTIME DEBUG & FIX
-- =============================================================================
-- Script này sẽ kiểm tra và fix TẤT CẢ các vấn đề có thể khiến realtime không hoạt động
-- =============================================================================

-- =============================================================================
-- PHẦN 1: KIỂM TRA VÀ FIX PERMISSIONS
-- =============================================================================
DO $$
BEGIN
  -- Grant cho supabase_realtime role (nếu tồn tại)
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime') THEN
    GRANT SELECT ON public.messages TO supabase_realtime;
    GRANT SELECT ON public.conversations TO supabase_realtime;
    RAISE NOTICE '✅ Granted SELECT to supabase_realtime role';
  ELSE
    RAISE NOTICE '⚠️ supabase_realtime role does not exist';
  END IF;
  
  -- Đảm bảo authenticated có permission
  GRANT SELECT ON public.messages TO authenticated;
  GRANT SELECT ON public.conversations TO authenticated;
  RAISE NOTICE '✅ Verified SELECT for authenticated role';
END $$;

-- =============================================================================
-- PHẦN 2: KIỂM TRA VÀ FIX REPLICA IDENTITY
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
    RAISE NOTICE '✅ Set REPLICA IDENTITY to DEFAULT';
  ELSE
    RAISE NOTICE '✅ REPLICA IDENTITY is OK (current: %)', 
      CASE 
        WHEN current_identity = 'd' THEN 'DEFAULT'
        WHEN current_identity = 'f' THEN 'FULL'
        ELSE 'Other'
      END;
  END IF;
END $$;

-- =============================================================================
-- PHẦN 3: KIỂM TRA VÀ FIX PUBLICATION
-- =============================================================================
DO $$
BEGIN
  -- Kiểm tra publication tồn tại
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    RAISE WARNING '⚠️ Publication supabase_realtime does not exist! Enable Realtime in Dashboard.';
  ELSE
    -- Kiểm tra messages table trong publication
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'messages'
      AND schemaname = 'public'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE messages;
      RAISE NOTICE '✅ Added messages table to publication';
    ELSE
      RAISE NOTICE '✅ Messages table is already in publication';
    END IF;
  END IF;
END $$;

-- =============================================================================
-- PHẦN 4: KIỂM TRA VÀ FIX RLS POLICIES
-- =============================================================================
-- Xóa tất cả test policies
DROP POLICY IF EXISTS "Test: Allow all authenticated users" ON messages;
DROP POLICY IF EXISTS "Test: Simple policy" ON messages;
DROP POLICY IF EXISTS "Test: Realtime friendly policy" ON messages;

-- Tạo lại production policy
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

-- Admin policy
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

-- =============================================================================
-- PHẦN 5: VERIFY TẤT CẢ
-- =============================================================================
SELECT '=== VERIFICATION RESULTS ===' as section;

-- 1. Permissions
SELECT 
  '1. Permissions' as check_type,
  grantee,
  privilege_type,
  CASE 
    WHEN grantee = 'supabase_realtime' THEN '✅'
    WHEN grantee = 'authenticated' THEN '✅'
    ELSE '⚠️'
  END as status
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'messages'
  AND privilege_type = 'SELECT'
  AND grantee IN ('supabase_realtime', 'authenticated', 'anon')
ORDER BY grantee;

-- 2. Replica Identity
SELECT 
  '2. Replica Identity' as check_type,
  relname,
  CASE 
    WHEN relreplident = 'd' THEN '✅ DEFAULT - OK'
    WHEN relreplident = 'f' THEN '✅ FULL - OK'
    WHEN relreplident = 'n' THEN '❌ NOTHING - BAD!'
    ELSE '⚠️ Unknown'
  END as status
FROM pg_class
WHERE relname = 'messages'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Publication
SELECT 
  '3. Publication' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'messages'
    )
    THEN '✅ Table in publication'
    ELSE '❌ Table NOT in publication'
  END as status;

-- 4. RLS Policies
SELECT 
  '4. RLS Policies' as check_type,
  policyname,
  CASE 
    WHEN policyname LIKE 'Test:%' THEN '❌ Test policy'
    WHEN policyname = 'Participants can view messages in their conversations' THEN '✅ Production'
    WHEN policyname = 'Admins can manage all messages' THEN '✅ Admin'
    ELSE '⚠️ Other'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- =============================================================================
-- PHẦN 6: NEXT STEPS
-- =============================================================================
SELECT 
  '=== NEXT STEPS ===' as section,
  '1. Enable Realtime in Supabase Dashboard: Database > Replication > Enable for messages' as step1,
  '2. Test with RealtimeTest component in browser' as step2,
  '3. Check browser console for subscription status' as step3,
  '4. Send message from another user and check if event is received' as step4;
