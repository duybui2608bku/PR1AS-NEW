-- =============================================================================
-- SCRIPT KIỂM TRA REALTIME SETUP
-- =============================================================================
-- Chạy script này trong Supabase SQL Editor để kiểm tra setup Realtime
-- =============================================================================

-- 1. Kiểm tra xem publication supabase_realtime có tồn tại không
SELECT 
  'Publication Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
    THEN '✅ Publication exists'
    ELSE '❌ Publication NOT found'
  END as status;

-- 2. Kiểm tra xem messages table có trong publication không
SELECT 
  'Table in Publication' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'messages'
      AND schemaname = 'public'
    )
    THEN '✅ Messages table is in publication'
    ELSE '❌ Messages table NOT in publication - RUN: ALTER PUBLICATION supabase_realtime ADD TABLE messages;'
  END as status;

-- 3. Hiển thị tất cả tables trong publication
SELECT 
  'Tables in Publication' as info,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- 4. Kiểm tra RLS policies cho messages table
SELECT 
  'RLS Policies' as check_type,
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

-- 5. Kiểm tra xem RLS có được enable không
SELECT 
  'RLS Enabled' as check_type,
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

-- 6. Test query để kiểm tra quyền SELECT (thay YOUR_USER_ID và YOUR_CONVERSATION_ID)
-- Uncomment và chạy với user ID và conversation ID thực tế
/*
SELECT 
  'Test SELECT Permission' as check_type,
  COUNT(*) as message_count
FROM messages
WHERE conversation_id = 'YOUR_CONVERSATION_ID'
  AND EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.client_id = 'YOUR_USER_ID' OR c.worker_id = 'YOUR_USER_ID')
  );
*/

