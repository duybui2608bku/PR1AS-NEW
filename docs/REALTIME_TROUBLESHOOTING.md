# Realtime Troubleshooting - Browser 2 không nhận được events

## Tình huống hiện tại

- ✅ Back-end: Message được insert thành công
- ✅ Publication: Đã được enable và table đã được add vào
- ✅ Permissions: `authenticated` role đã có SELECT permission
- ✅ Subscription: Browser 2 đã subscribe thành công
- ❌ Events: Browser 2 không nhận được events khi user 1 gửi tin nhắn

## Nguyên nhân có thể

### 1. RLS Policies filter events trước khi đến client

Đây là nguyên nhân phổ biến nhất. RLS policies được evaluate trong Realtime context, và nếu policy không pass, event sẽ không được gửi đến client.

**Kiểm tra**:
- Test với subscription không filter (xem script bên dưới)
- Nếu không filter nhận được events nhưng filter không → RLS đang filter events

**Giải pháp**:
- Đảm bảo RLS policy cho SELECT có thể được evaluate đúng trong Realtime context
- Có thể cần điều chỉnh RLS policy để phù hợp với Realtime

### 2. Filter format không đúng

Filter `conversation_id=eq.${conversationId}` có thể không hoạt động đúng với RLS.

**Kiểm tra**:
- Test với subscription không filter
- So sánh kết quả

### 3. WebSocket connection issues

WebSocket có thể bị đóng hoặc có vấn đề.

**Kiểm tra**:
- Mở Network tab > Filter: WS
- Kiểm tra WebSocket connection status
- Xem có error messages không

## Các bước debug

### Bước 1: Test với subscription không filter

Chạy script test trong browser console của user 2:

1. Mở browser console (F12)
2. Copy code từ `scripts/test-realtime-no-filter.js`
3. Paste vào console và chạy
4. Gửi tin nhắn từ user 1
5. Xem có nhận được events không

**Kết quả mong đợi**:
- Nếu **NO FILTER** nhận được events → Vấn đề với filter hoặc RLS
- Nếu **NO FILTER** cũng không nhận được → Vấn đề với Realtime setup

### Bước 2: Kiểm tra RLS Policy

Test RLS policy trực tiếp với user của browser 2:

```sql
-- Test với user ID của browser 2
-- Thay YOUR_USER_ID và YOUR_CONVERSATION_ID
SELECT * FROM messages 
WHERE conversation_id = 'YOUR_CONVERSATION_ID'
  AND EXISTS (
    SELECT 1
    FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.client_id = 'YOUR_USER_ID' OR c.worker_id = 'YOUR_USER_ID')
  )
LIMIT 1;
```

Nếu query này không trả về kết quả, RLS policy có thể chặn events.

### Bước 3: Kiểm tra WebSocket Messages

1. Mở Network tab (F12 > Network)
2. Filter: `WS` hoặc `wss://`
3. Tìm WebSocket connection đến Supabase
4. Click vào connection > Messages tab
5. Gửi tin nhắn từ user 1
6. Xem có messages nào được gửi/nhận không

### Bước 4: Test với Direct SQL Insert

1. Mở Supabase SQL Editor
2. Chạy query sau (thay YOUR_CONVERSATION_ID và YOUR_USER_ID):
   ```sql
   INSERT INTO messages (conversation_id, sender_id, content, content_type, status)
   VALUES (
     'YOUR_CONVERSATION_ID',
     'YOUR_USER_ID',
     'Test message from SQL',
     'text',
     'sent'
   )
   RETURNING *;
   ```
3. Kiểm tra browser 2 có nhận được event không

Nếu nhận được từ SQL nhưng không nhận được từ API → Có thể là vấn đề với server-side client context.

## Giải pháp có thể

### Giải pháp 1: Điều chỉnh RLS Policy

Nếu RLS policy quá strict, có thể cần điều chỉnh:

```sql
-- Policy hiện tại
CREATE POLICY "Participants can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.client_id = auth.uid() OR c.worker_id = auth.uid())
    )
  );
```

Policy này có thể không hoạt động tốt với Realtime. Thử policy đơn giản hơn để test:

```sql
-- Test policy (tạm thời để debug)
CREATE POLICY "Test: Allow all participants" AS PERMISSIVE
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = messages.conversation_id
        AND (client_id = auth.uid() OR worker_id = auth.uid())
    )
  );
```

### Giải pháp 2: Sử dụng Broadcast thay vì postgres_changes

Nếu postgres_changes không hoạt động, có thể thử broadcast:

```javascript
// Broadcast approach (alternative)
const channel = supabase
  .channel(`chat-${conversationId}`)
  .on('broadcast', { event: 'new-message' }, (payload) => {
    console.log('Received broadcast:', payload);
  })
  .subscribe();

// Khi gửi message, broadcast event
await supabase.channel(`chat-${conversationId}`).send({
  type: 'broadcast',
  event: 'new-message',
  payload: { message: newMessage }
});
```

Nhưng cách này cần thay đổi code nhiều hơn.

## Checklist Debug

- [ ] Test với subscription không filter
- [ ] Kiểm tra RLS policy với user của browser 2
- [ ] Kiểm tra WebSocket connection và messages
- [ ] Test với direct SQL insert
- [ ] So sánh kết quả giữa các test

## Next Steps

Sau khi chạy các test trên, hãy gửi kết quả:
1. NO FILTER có nhận được events không?
2. WITH FILTER có nhận được events không?
3. WebSocket có messages nào không?
4. Direct SQL insert có trigger event không?

Dựa vào kết quả, chúng ta sẽ tìm giải pháp phù hợp.

