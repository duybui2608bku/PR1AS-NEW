# Test với Simple RLS Policy

## Mục đích

Test xem có phải RLS policy đang chặn Realtime events không.

## Các bước

### Bước 1: Chạy SQL test

Chạy file `lib/supabase/migrations/test_simple_rls.sql` trong Supabase SQL Editor.

Hoặc chạy trực tiếp:

```sql
-- Drop tất cả SELECT policies hiện tại
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;
DROP POLICY IF EXISTS "Test: Simple policy" ON messages;

-- Tạo policy đơn giản nhất để test
CREATE POLICY "Test: Allow all authenticated users"
  ON messages FOR SELECT
  TO authenticated
  USING (true);
```

### Bước 2: Test Realtime

1. Refresh browser ở user 2
2. Click "Start Test" lại trong component test
3. Gửi tin nhắn từ user 1
4. Kiểm tra xem có nhận được events không

### Bước 3: Phân tích kết quả

- ✅ Nếu nhận được events với policy đơn giản:
  - Vấn đề là với logic trong RLS policy cũ
  - Cần điều chỉnh policy để phù hợp với Realtime
  - Có thể cần sử dụng cách khác để check permissions

- ❌ Nếu vẫn không nhận được events:
  - Vấn đề không phải RLS
  - Có thể là:
    - Publication chưa được setup đúng
    - Permissions chưa đủ
    - WebSocket connection issues
    - Vấn đề với cách Supabase Realtime hoạt động

### Bước 4: Restore policy sau khi test

Sau khi test xong, phải restore lại policy đúng:

```sql
-- Drop test policy
DROP POLICY IF EXISTS "Test: Allow all authenticated users" ON messages;

-- Tạo lại policy đúng
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
```

## Lưu ý

⚠️ **QUAN TRỌNG**: Policy test này KHÔNG BẢO MẬT - cho phép tất cả authenticated users đọc tất cả messages. CHỈ dùng để test và phải restore lại policy đúng sau khi test!

