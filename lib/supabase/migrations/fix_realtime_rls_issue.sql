-- =============================================================================
-- FIX REALTIME RLS ISSUE
-- =============================================================================
-- Vấn đề: Subscriptions SUBSCRIBED nhưng không nhận được events
-- Nguyên nhân có thể: RLS policies filter events trước khi gửi đến client
-- =============================================================================

-- Bước 1: Kiểm tra policy hiện tại
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages'
  AND cmd = 'SELECT';

-- Bước 2: Tạo lại policy (PERMISSIVE là mặc định, không cần khai báo)
-- Drop policy cũ nếu cần
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON messages;

-- Tạo policy mới (mặc định là PERMISSIVE)
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

-- Bước 3: Đảm bảo policy được apply đúng
-- Verify policy
SELECT 
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages'
  AND policyname = 'Participants can view messages in their conversations';

-- Bước 4: Test với query trực tiếp (thay YOUR_USER_ID và YOUR_CONVERSATION_ID)
-- Uncomment và chạy với user ID và conversation ID thực tế
/*
SELECT * FROM messages 
WHERE conversation_id = 'YOUR_CONVERSATION_ID'
  AND EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.client_id = 'YOUR_USER_ID' OR c.worker_id = 'YOUR_USER_ID')
  )
LIMIT 1;
*/

-- Lưu ý: 
-- - PERMISSIVE policy sẽ được OR với các policies khác
-- - Nếu có nhiều SELECT policies, chúng sẽ được OR lại
-- - Điều này có thể giúp Realtime hoạt động tốt hơn

