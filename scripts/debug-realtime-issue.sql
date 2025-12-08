-- =============================================================================
-- DEBUG REALTIME ISSUE - Kiểm tra chi tiết khi Permissions đã đầy đủ
-- =============================================================================
-- Chạy script này để kiểm tra các nguyên nhân khác khiến realtime không hoạt động
-- =============================================================================

-- =============================================================================
-- 1. KIỂM TRA PUBLICATION VÀ TABLE
-- =============================================================================
SELECT 
  '1. Publication Check' as check_step,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    THEN '✅ Publication exists'
    ELSE '❌ Publication NOT found'
  END as status;

SELECT 
  '2. Table in Publication' as check_step,
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

-- Hiển thị tất cả tables trong publication
SELECT 
  '3. All Tables in Publication' as check_step,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- =============================================================================
-- 2. KIỂM TRA PERMISSIONS (Xác nhận lại)
-- =============================================================================
SELECT 
  '4. SELECT Permissions' as check_step,
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

-- =============================================================================
-- 3. KIỂM TRA RLS POLICIES CHI TIẾT
-- =============================================================================
SELECT 
  '5. RLS Enabled' as check_step,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'messages'
      AND rowsecurity = true
    )
    THEN '✅ RLS is enabled'
    ELSE '❌ RLS is NOT enabled'
  END as status;

-- Xem tất cả SELECT policies
SELECT 
  '6. SELECT Policies' as check_step,
  policyname,
  permissive,
  roles,
  qual as policy_condition,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- =============================================================================
-- 4. KIỂM TRA REPLICA IDENTITY (QUAN TRỌNG CHO REALTIME)
-- =============================================================================
SELECT 
  '7. Replica Identity' as check_step,
  relname as table_name,
  relreplident as replica_identity,
  CASE 
    WHEN relreplident = 'd' THEN '✅ DEFAULT (primary key) - OK'
    WHEN relreplident = 'f' THEN '✅ FULL - OK'
    WHEN relreplident = 'n' THEN '❌ NOTHING - Realtime may not work!'
    WHEN relreplident = 'i' THEN '✅ INDEX - OK'
    ELSE '⚠️ Unknown'
  END as status
FROM pg_class
WHERE relname = 'messages'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- =============================================================================
-- 5. KIỂM TRA TRIGGERS (Có thể ảnh hưởng đến Realtime)
-- =============================================================================
SELECT 
  '8. Triggers on messages table' as check_step,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'messages'
ORDER BY trigger_name;

-- =============================================================================
-- 6. TEST QUERY VỚI RLS (Thay YOUR_USER_ID và YOUR_CONVERSATION_ID)
-- =============================================================================
-- Uncomment và chạy với user ID và conversation ID thực tế để test RLS
/*
SELECT 
  '9. Test RLS Query' as check_step,
  COUNT(*) as message_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ RLS allows SELECT - User can see messages'
    ELSE '❌ RLS blocks SELECT - User cannot see messages'
  END as status
FROM messages
WHERE conversation_id = 'YOUR_CONVERSATION_ID'
  AND EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.client_id = 'YOUR_USER_ID' OR c.worker_id = 'YOUR_USER_ID')
  );
*/

-- =============================================================================
-- 7. KIỂM TRA CẤU TRÚC TABLE (Đảm bảo có primary key)
-- =============================================================================
SELECT 
  '10. Primary Key Check' as check_step,
  a.attname as column_name,
  CASE 
    WHEN a.attname IS NOT NULL THEN '✅ Primary key exists'
    ELSE '❌ No primary key - Realtime requires primary key!'
  END as status
FROM pg_index i
JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
WHERE i.indrelid = 'public.messages'::regclass
  AND i.indisprimary = true
LIMIT 1;

-- =============================================================================
-- 8. KIỂM TRA REALTIME CONFIGURATION TRONG SUPABASE
-- =============================================================================
-- Lưu ý: Cần kiểm tra trong Supabase Dashboard:
-- 1. Database > Replication > messages table có toggle ON không?
-- 2. Có error messages nào trong Replication logs không?
-- 3. WebSocket connection có được establish không?

SELECT 
  '11. Next Steps' as check_step,
  'Check Supabase Dashboard: Database > Replication > messages table' as instruction;

-- =============================================================================
-- SUMMARY - TỔNG KẾT CÁC VẤN ĐỀ CÓ THỂ
-- =============================================================================
SELECT 
  'SUMMARY' as section,
  'If all checks pass but realtime still not working:' as note,
  '1. Check Supabase Dashboard: Database > Replication > Enable Realtime for messages' as step1,
  '2. Test with RealtimeTest component (no filter vs with filter)' as step2,
  '3. Check browser console for WebSocket connection errors' as step3,
  '4. Verify RLS policy allows SELECT for authenticated users' as step4,
  '5. Check if replica_identity is NOT "n" (NOTHING)' as step5;
