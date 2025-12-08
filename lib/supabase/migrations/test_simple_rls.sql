-- =============================================================================
-- TEST: Simple RLS Policy để test Realtime
-- =============================================================================
-- CHỈ DÙNG ĐỂ TEST! Không dùng trong production!
-- =============================================================================

-- Drop tất cả SELECT policies hiện tại
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;
DROP POLICY IF EXISTS "Test: Simple policy" ON messages;
DROP POLICY IF EXISTS "Test: Allow all authenticated users" ON messages;

-- Tạo policy đơn giản nhất để test
-- Policy này cho phép TẤT CẢ authenticated users đọc TẤT CẢ messages
CREATE POLICY "Test: Allow all authenticated users"
  ON messages FOR SELECT
  TO authenticated
  USING (true);

-- Verify policy
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages'
  AND cmd = 'SELECT';

-- Lưu ý: 
-- ⚠️ Policy này KHÔNG BẢO MẬT - cho phép tất cả users đọc tất cả messages
-- CHỈ dùng để test xem Realtime có hoạt động không
-- Sau khi test xong, phải xóa và tạo lại policy đúng

