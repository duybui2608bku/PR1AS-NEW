# Hướng dẫn Debug Realtime Issues

## Vấn đề: Subscription thành công nhưng không nhận được events

### Bước 0: Grant SELECT Permission cho supabase_realtime (QUAN TRỌNG NHẤT!)

**Đây thường là nguyên nhân chính!**

Supabase Realtime cần quyền SELECT để đọc dữ liệu và áp dụng RLS policies. Nếu không có quyền này, subscription sẽ thành công nhưng không nhận được events.

Chạy SQL sau trong Supabase SQL Editor:

```sql
-- Grant SELECT permission to supabase_realtime role
GRANT SELECT ON public.messages TO supabase_realtime;
GRANT SELECT ON public.conversations TO supabase_realtime;
```

Hoặc chạy migration: `lib/supabase/migrations/fix_realtime_permissions.sql`

Sau khi grant permission, refresh browser và test lại!

### Bước 1: Kiểm tra Publication Setup

1. Mở Supabase SQL Editor
2. Chạy script `scripts/check-realtime-setup.sql`
3. Kiểm tra kết quả:
   - ✅ Publication exists
   - ✅ Messages table is in publication
   - ✅ RLS is enabled

4. Nếu `Messages table NOT in publication`, chạy:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE messages;
   ```

### Bước 2: Kiểm tra Back-end Logs

1. Mở terminal/server logs
2. Khi gửi tin nhắn, kiểm tra logs:
   - `📤 [API] Sending message:` - API nhận được request
   - `✅ [API] Message inserted successfully:` - Message được insert vào database

3. Nếu không thấy logs này, có thể là:
   - API route không được gọi
   - Có lỗi khi insert

### Bước 3: Kiểm tra Front-end Subscription

1. Mở browser console (F12)
2. Kiểm tra logs khi mở conversation:
   - `🔌 Setting up realtime subscription`
   - `✅ Realtime subscribed successfully`
   - `💡 Waiting for INSERT events`

3. Khi gửi tin nhắn từ user khác, kiểm tra:
   - `📨 ===== REALTIME MESSAGE RECEIVED =====` - Event được nhận
   - `📬 MessageList: Received new message` - MessageList nhận được

### Bước 4: Test Subscription Không Filter

Để kiểm tra xem có phải do filter không, test subscription không filter:

1. Mở browser console
2. Chạy code sau (thay YOUR_CONVERSATION_ID):
   ```javascript
   const { createClient } = require('@/lib/supabase/client');
   const supabase = createClient();
   
   const channel = supabase
     .channel('test-no-filter-' + Date.now())
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'messages',
       // KHÔNG có filter
     }, (payload) => {
       console.log('📨 TEST: Received INSERT event:', payload);
       console.log('   Conversation ID:', payload.new.conversation_id);
     })
     .subscribe((status) => {
       console.log('📡 TEST Subscription Status:', status);
       if (status === 'SUBSCRIBED') {
         console.log('✅ TEST: Subscribed! Now send a message...');
       }
     });
   
   // Cleanup sau 5 phút
   setTimeout(() => {
     console.log('🧹 Cleaning up test subscription...');
     supabase.removeChannel(channel);
   }, 5 * 60 * 1000);
   ```

3. Gửi tin nhắn từ user khác
4. Nếu nhận được event không filter nhưng không nhận được với filter:
   - Có thể là vấn đề với filter format
   - Hoặc RLS policies filter events trước khi đến client

### Bước 5: Kiểm tra WebSocket Connection

1. Mở Network tab (F12 > Network)
2. Filter: `WS` hoặc `wss://`
3. Tìm connection đến Supabase Realtime
4. Click vào connection để xem details
5. Kiểm tra:
   - Status: 101 Switching Protocols (thành công)
   - Messages tab: Xem có messages nào được gửi/nhận không
   - Nếu có error messages, ghi lại để debug

### Bước 6: Kiểm tra RLS Policies

1. Đảm bảo RLS policy cho SELECT cho phép user đọc messages:
   ```sql
   -- Test với user hiện tại
   SELECT * FROM messages 
   WHERE conversation_id = 'your-conversation-id'
   LIMIT 1;
   ```

2. Nếu query này fail, RLS policy có thể chặn realtime events

### Bước 7: Test Direct Database Insert

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

3. Kiểm tra xem front-end có nhận được realtime event không
4. Nếu nhận được từ SQL nhưng không nhận được từ API:
   - Có thể là vấn đề với server-side client
   - Hoặc cách API insert message

## Checklist Debug

- [ ] Publication `supabase_realtime` tồn tại
- [ ] Table `messages` có trong publication
- [ ] RLS được enable cho table `messages`
- [ ] RLS policies cho phép SELECT
- [ ] Subscription status = SUBSCRIBED
- [ ] WebSocket connection thành công (101)
- [ ] Back-end logs hiển thị message được insert
- [ ] Test subscription không filter nhận được events
- [ ] Direct SQL insert trigger realtime event

## Common Issues và Solutions

### Issue 1: Table không trong publication
**Solution**: Chạy `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`

### Issue 2: RLS chặn events
**Solution**: Kiểm tra RLS policies, đảm bảo SELECT policy đúng

### Issue 3: Filter không hoạt động
**Solution**: Test với subscription không filter trước, sau đó thêm filter

### Issue 4: Server-side insert không trigger realtime
**Solution**: Đảm bảo server-side client sử dụng đúng credentials và có quyền

### Issue 5: WebSocket connection bị đóng
**Solution**: Kiểm tra network, firewall, hoặc proxy settings

