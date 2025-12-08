# Realtime Events bị RLS Policies chặn

## Vấn đề

- ✅ Subscriptions SUBSCRIBED thành công
- ✅ WebSocket connection hoạt động
- ❌ Không nhận được events khi INSERT

## Nguyên nhân

RLS policies có thể filter events **trước khi** gửi đến client. Khi Supabase Realtime evaluate RLS policy, nếu policy không pass, event sẽ không được gửi đến client.

## Giải pháp

### Giải pháp 1: Test với policy đơn giản hơn

Chạy SQL sau để tạo policy test:

```sql
-- Drop existing SELECT policy temporarily
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON messages;

-- Create simpler policy for testing
CREATE POLICY "Test: Simple SELECT policy" 
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

Sau đó test lại. Nếu hoạt động, có thể là vấn đề với cách policy được viết.

### Giải pháp 2: Sử dụng PERMISSIVE policy

Supabase Realtime có thể hoạt động tốt hơn với PERMISSIVE policies:

```sql
CREATE POLICY "Participants can view messages" AS PERMISSIVE
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

### Giải pháp 3: Kiểm tra với direct SQL insert

Test xem có phải vấn đề với API insert không:

```sql
-- Insert message trực tiếp từ SQL Editor
-- Thay YOUR_CONVERSATION_ID và YOUR_USER_ID
INSERT INTO messages (conversation_id, sender_id, content, content_type, status)
VALUES (
  'YOUR_CONVERSATION_ID',
  'YOUR_USER_ID',
  'Test from SQL',
  'text',
  'sent'
)
RETURNING *;
```

Nếu nhận được event từ SQL nhưng không nhận được từ API → Vấn đề với server-side client context.

### Giải pháp 4: Kiểm tra WebSocket messages

1. Mở Network tab > Filter: WS
2. Click vào WebSocket connection
3. Gửi tin nhắn từ user 1
4. Xem Messages tab có messages nào không

Nếu không có messages nào → Server không gửi events
Nếu có messages nhưng client không nhận được → Vấn đề với client-side code

## Debug Steps

1. **Test với policy đơn giản**:
   ```sql
   -- Temporarily simplify policy
   DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON messages;
   
   CREATE POLICY "Test: Simple policy" 
     ON messages FOR SELECT
     TO authenticated
     USING (true); -- Allow all for testing
   ```
   
   ⚠️ **WARNING**: Chỉ dùng để test! Không dùng trong production!

2. **Test với direct SQL insert**:
   - Insert message từ SQL Editor
   - Xem có nhận được event không

3. **Kiểm tra WebSocket messages**:
   - Xem có messages nào được gửi không
   - Xem có error messages không

4. **Kiểm tra server logs**:
   - Xem message có được insert thành công không
   - Xem có lỗi gì không

## Next Steps

Sau khi test với policy đơn giản:
- Nếu hoạt động → Vấn đề với RLS policy, cần điều chỉnh
- Nếu vẫn không hoạt động → Vấn đề khác (publication, permissions, etc.)

