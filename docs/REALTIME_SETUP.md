# Hướng dẫn Enable Realtime cho Chat

## Vấn đề

Chat chưa hoạt động real-time - tin nhắn mới không tự động hiển thị khi người dùng khác gửi.

## Giải pháp

Sử dụng Supabase Realtime để subscribe vào các thay đổi trên bảng `messages`.

## Các bước thực hiện

### 1. Enable Realtime trong Supabase Dashboard

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Database** > **Replication**
4. Tìm bảng `messages` trong danh sách
5. Bật toggle **Enable Realtime** cho bảng `messages`
6. Lưu lại

### 2. Grant SELECT Permission cho supabase_realtime Role (QUAN TRỌNG!)

**Đây là bước QUAN TRỌNG NHẤT** - Nhiều người bỏ qua bước này!

Supabase Realtime cần quyền SELECT trên bảng `messages` và `conversations` để có thể đọc dữ liệu và áp dụng RLS policies khi gửi events đến clients.

Chạy migration sau trong Supabase SQL Editor:

```sql
-- Grant SELECT permission to supabase_realtime role
GRANT SELECT ON public.messages TO supabase_realtime;
GRANT SELECT ON public.conversations TO supabase_realtime;
```

Hoặc chạy file migration: `lib/supabase/migrations/fix_realtime_permissions.sql`

**Lưu ý**: Nếu không grant permission này, subscription sẽ thành công nhưng không nhận được events!

### 3. Kiểm tra RLS Policies

Đảm bảo RLS policies cho phép user đọc messages trong conversations của họ. Migration `create_chat_system.sql` đã có policies này, nhưng hãy kiểm tra lại:

```sql
-- Policy này đã có trong migration
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

### 4. Chạy Migration (Optional)

Nếu muốn chạy migration để document việc enable Realtime:

```bash
# Migration file đã được tạo tại:
# lib/supabase/migrations/enable_realtime_for_messages.sql
```

**Lưu ý**: Migration này chỉ là documentation. Việc enable Realtime phải được thực hiện qua Supabase Dashboard.

### 5. Kiểm tra Code

Code đã được cập nhật:

- ✅ `hooks/chat/useSupabaseRealtime.ts` - Hook để subscribe realtime
- ✅ `components/chat/MessageList.tsx` - Sử dụng hook để nhận messages realtime
- ✅ Error handling và logging đã được thêm vào

### 6. Test Realtime

1. Mở 2 trình duyệt/tab khác nhau
2. Đăng nhập với 2 user khác nhau
3. Mở cùng một conversation
4. Gửi tin nhắn từ user 1
5. Tin nhắn sẽ tự động xuất hiện ở user 2 (không cần refresh)

### 7. Debug

Nếu realtime không hoạt động:

1. **Kiểm tra Console Logs**:

   - Mở Developer Tools (F12)
   - Xem Console tab
   - Tìm các log sau:
     - `🔌 Setting up realtime subscription for conversation: {conversationId}` - Subscription đang được setup
     - `✅ Realtime subscribed successfully to conversation: {conversationId}` - Subscription thành công
     - `📨 Realtime message received:` - Tin nhắn mới được nhận
   - Nếu thấy `❌ Realtime channel error`, có thể là:
     - Realtime chưa được enable trong Dashboard
     - RLS policy chặn subscription
     - Network issue
     - Filter format không đúng

2. **Kiểm tra Supabase Dashboard**:

   - Vào **Database** > **Replication**
   - Đảm bảo `messages` table có toggle **ON**
   - Kiểm tra xem có thông báo lỗi nào không
   - Thử tắt và bật lại toggle để refresh

3. **Kiểm tra Network Tab**:

   - Mở Network tab trong Developer Tools
   - Filter: `WS` (WebSocket) hoặc `wss://`
   - Tìm connection đến Supabase Realtime (thường là `wss://[project-ref].supabase.co/realtime/v1/websocket`)
   - Kiểm tra status code (should be 101 Switching Protocols)
   - Kiểm tra xem có message nào được gửi/nhận không

4. **Kiểm tra RLS Policies**:

   - Vào **Database** > **Policies** trong Supabase Dashboard
   - Tìm policies cho bảng `messages`
   - Đảm bảo có policy cho phép SELECT:
     ```sql
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
   - Test query trực tiếp trong Supabase SQL Editor:
     ```sql
     SELECT * FROM messages
     WHERE conversation_id = 'your-conversation-id'
     LIMIT 1;
     ```

5. **Kiểm tra Environment Variables**:

   - Đảm bảo `.env.local` có:
     - `NEXT_PUBLIC_SUPABASE_URL` - URL của Supabase project
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key của Supabase project
   - Restart dev server sau khi thay đổi env variables

6. **Test Manual Subscription**:
   - Mở Console trong browser
   - Chạy code sau để test subscription:
     ```javascript
     const { createClient } = require("@/lib/supabase/client");
     const supabase = createClient();
     const channel = supabase
       .channel("test-channel")
       .on(
         "postgres_changes",
         {
           event: "INSERT",
           schema: "public",
           table: "messages",
           filter: "conversation_id=eq.YOUR_CONVERSATION_ID",
         },
         (payload) => {
           console.log("Test message received:", payload);
         }
       )
       .subscribe((status) => {
         console.log("Subscription status:", status);
       });
     ```
   - Gửi một tin nhắn từ user khác
   - Xem console có log "Test message received" không

## Troubleshooting

### Realtime không kết nối

- Kiểm tra firewall/proxy có chặn WebSocket không
- Kiểm tra `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong `.env.local`

### Messages không hiển thị realtime (Subscription thành công nhưng không nhận events)

**Triệu chứng**: Console log hiển thị `✅ Realtime subscribed successfully` nhưng không có log `📨 Realtime message received` khi gửi tin nhắn.

**Nguyên nhân có thể**:

1. **Publication chưa được add table vào** (QUAN TRỌNG):

   - Supabase Realtime sử dụng PostgreSQL publication để replicate changes
   - Cần đảm bảo table `messages` đã được add vào publication `supabase_realtime`
   - Kiểm tra trong Supabase SQL Editor:
     ```sql
     -- Kiểm tra xem messages table có trong publication không
     SELECT * FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
     AND tablename = 'messages';
     ```
   - Nếu không có kết quả, chạy:
     ```sql
     -- Add messages table vào publication
     ALTER PUBLICATION supabase_realtime ADD TABLE messages;
     ```

2. **RLS Policies chặn Realtime events**:

   - Realtime events có thể bị filter bởi RLS policies
   - Đảm bảo RLS policy cho SELECT có thể được evaluate đúng cách
   - Test query trực tiếp:
     ```sql
     -- Test với user hiện tại
     SELECT * FROM messages
     WHERE conversation_id = 'your-conversation-id'
     LIMIT 1;
     ```

3. **Filter không hoạt động đúng**:

   - Thử subscribe mà không có filter để test:
     ```javascript
     // Test subscription không filter
     const channel = supabase
       .channel("test-no-filter")
       .on(
         "postgres_changes",
         {
           event: "INSERT",
           schema: "public",
           table: "messages",
           // Không có filter
         },
         (payload) => {
           console.log("Received:", payload);
         }
       )
       .subscribe();
     ```
   - Nếu nhận được events không filter nhưng không nhận được với filter, có thể là vấn đề với filter format

4. **Kiểm tra WebSocket messages**:

   - Mở Network tab > Filter: WS
   - Tìm WebSocket connection đến Supabase
   - Xem có messages nào được gửi/nhận không
   - Kiểm tra xem có error messages không

5. **Test với SQL trực tiếp**:
   - Gửi tin nhắn từ Supabase SQL Editor để test:
     ```sql
     INSERT INTO messages (conversation_id, sender_id, content, content_type, status)
     VALUES ('your-conversation-id', 'sender-user-id', 'Test message', 'text', 'sent');
     ```
   - Xem có nhận được realtime event không

### Kiểm tra Console Logs

Khi subscription hoạt động đúng, bạn sẽ thấy:

1. `🔌 Setting up realtime subscription for conversation: {id}`
2. `✅ Realtime subscribed successfully to conversation: {id}`
3. `📨 ===== REALTIME MESSAGE RECEIVED =====` (khi có tin nhắn mới)
4. `📬 MessageList: Received new message via realtime` (khi MessageList nhận được)

Nếu chỉ thấy 1 và 2 nhưng không thấy 3 và 4, có thể là vấn đề với publication hoặc RLS.

### Duplicate messages

- Code đã có logic để tránh duplicate (check by ID)
- Nếu vẫn bị duplicate, có thể do subscription được tạo nhiều lần

## Quick Debug Checklist

Nếu realtime không hoạt động, làm theo các bước sau:

1. ✅ **Chạy SQL script kiểm tra**:

   - Mở Supabase SQL Editor
   - Chạy file `scripts/check-realtime-setup.sql`
   - Đảm bảo tất cả checks đều ✅

2. ✅ **Add table vào publication** (nếu chưa có):

   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE messages;
   ```

3. ✅ **Kiểm tra Back-end logs**:

   - Khi gửi tin nhắn, kiểm tra server logs
   - Tìm `📤 [API] Sending message` và `✅ [API] Message inserted successfully`

4. ✅ **Kiểm tra Front-end logs**:

   - Mở browser console
   - Kiểm tra subscription status
   - Tìm `📨 REALTIME MESSAGE RECEIVED` khi có tin nhắn mới

5. ✅ **Test với subscription không filter**:

   - Sử dụng component `RealtimeTest` hoặc chạy code trong console
   - Xem có nhận được events không filter không

6. ✅ **Kiểm tra WebSocket connection**:
   - Network tab > Filter: WS
   - Kiểm tra connection status và messages

Xem chi tiết trong `docs/REALTIME_DEBUG_GUIDE.md`

## Tài liệu tham khảo

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Replication](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Debug Guide](./REALTIME_DEBUG_GUIDE.md) - Hướng dẫn debug chi tiết
