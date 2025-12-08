-- =============================================================================
-- FIX REALTIME REPLICA IDENTITY
-- =============================================================================
-- Vấn đề: Realtime không hoạt động mặc dù permissions đã đầy đủ
-- Nguyên nhân: REPLICA IDENTITY có thể là NOTHING hoặc chưa được set
-- Giải pháp: Set REPLICA IDENTITY to DEFAULT (sử dụng primary key)
-- =============================================================================

-- Kiểm tra Replica Identity hiện tại
DO $$
DECLARE
  current_identity CHAR;
BEGIN
  SELECT relreplident INTO current_identity
  FROM pg_class
  WHERE relname = 'messages'
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  RAISE NOTICE 'Current REPLICA IDENTITY for messages table: %', 
    CASE 
      WHEN current_identity = 'd' THEN 'DEFAULT (primary key) - OK'
      WHEN current_identity = 'f' THEN 'FULL - OK'
      WHEN current_identity = 'n' THEN 'NOTHING - NEEDS FIX!'
      WHEN current_identity = 'i' THEN 'INDEX - OK'
      ELSE 'Unknown'
    END;

  -- Set REPLICA IDENTITY to DEFAULT nếu chưa đúng
  IF current_identity IS NULL OR current_identity = 'n' THEN
    ALTER TABLE messages REPLICA IDENTITY DEFAULT;
    RAISE NOTICE '✅ Set REPLICA IDENTITY to DEFAULT for messages table';
  ELSE
    RAISE NOTICE '✅ REPLICA IDENTITY is already set correctly';
  END IF;
END $$;

-- Verify sau khi set
SELECT 
  'Verification' as check_type,
  relname as table_name,
  relreplident as replica_identity,
  CASE 
    WHEN relreplident = 'd' THEN '✅ DEFAULT (primary key) - Realtime will work'
    WHEN relreplident = 'f' THEN '✅ FULL - Realtime will work'
    WHEN relreplident = 'n' THEN '❌ NOTHING - Realtime will NOT work!'
    WHEN relreplident = 'i' THEN '✅ INDEX - Realtime will work'
    ELSE '⚠️ Unknown'
  END as status
FROM pg_class
WHERE relname = 'messages'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Lưu ý: Sau khi chạy migration này, cần:
-- 1. Enable Realtime trong Supabase Dashboard: Database > Replication > Enable cho messages table
-- 2. Test với RealtimeTest component để verify
