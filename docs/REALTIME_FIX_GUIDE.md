# Hướng dẫn Fix Realtime khi Permissions đã đầy đủ

## Tình huống

- ✅ Permissions đã được grant đầy đủ cho `supabase_realtime` hoặc `authenticated` role
- ✅ Code front-end và back-end đã được implement đúng
- ❌ Nhưng tin nhắn vẫn chưa realtime được

## Các nguyên nhân còn lại

### 1. 🔴 Replica Identity không đúng

**Vấn đề:**

- Supabase Realtime yêu cầu table phải có `REPLICA IDENTITY` được set đúng
- Nếu `REPLICA IDENTITY` là `NOTHING`, Realtime sẽ không hoạt động

**Kiểm tra:**

```sql
SELECT
  relname,
  relreplident,
  CASE
    WHEN relreplident = 'd' THEN 'DEFAULT (primary key) - OK'
    WHEN relreplident = 'f' THEN 'FULL - OK'
    WHEN relreplident = 'n' THEN 'NOTHING - NEEDS FIX!'
    WHEN relreplident = 'i' THEN 'INDEX - OK'
  END as status
FROM pg_class
WHERE relname = 'messages'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

**Giải pháp:**

```sql
-- Set REPLICA IDENTITY to DEFAULT (sử dụng primary key)
ALTER TABLE messages REPLICA IDENTITY DEFAULT;

-- Hoặc FULL (nếu cần replicate tất cả columns)
ALTER TABLE messages REPLICA IDENTITY FULL;
```

**Lưu ý:** `REPLICA IDENTITY DEFAULT` là tốt nhất vì sử dụng primary key (nhanh hơn).

---

### 2. 🔴 Realtime chưa được enable trong Supabase Dashboard

**Vấn đề:**

- Ngay cả khi đã add table vào publication, Realtime vẫn cần được enable trong Dashboard
- Đây là bước bắt buộc và không thể thay thế bằng SQL

**Giải pháp:**

1. Đăng nhập [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **Database** > **Replication**
4. Tìm table `messages` trong danh sách
5. **Bật toggle "Enable Realtime"** cho table `messages`
6. Lưu lại và đợi vài giây để apply

**Kiểm tra:**

- Toggle phải là màu xanh (ON)
- Không có error messages nào hiển thị

---

### 3. 🟡 RLS Policies đang filter events

**Vấn đề:**

- RLS policies được evaluate trong Realtime context
- Nếu policy không pass, event sẽ không được gửi đến client
- Policy hiện tại sử dụng `EXISTS` subquery có thể không hoạt động tốt với Realtime

**Test:**
Sử dụng `RealtimeTest` component để test:

1. Mở chat page (development mode)
2. Component `RealtimeTest` sẽ hiển thị ở cuối
3. Click "Start Test"
4. Gửi tin nhắn từ user khác
5. Xem kết quả:
   - **NO FILTER** nhận được events → RLS OK, vấn đề ở filter
   - **NO FILTER** không nhận được → RLS đang filter events

**Giải pháp nếu RLS đang filter:**

**Option 1: Test với policy đơn giản hơn (tạm thời)**

```sql
-- Drop policy cũ
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON messages;

-- Tạo policy mới (đơn giản hơn)
CREATE POLICY "Participants can view messages in their conversations"
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

**Option 2: Verify RLS với user thực tế**

```sql
-- Test với user ID và conversation ID thực tế
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

Nếu query này không trả về kết quả → RLS đang chặn.

---

### 4. 🟡 Filter format không đúng

**Vấn đề:**

- Filter `conversation_id=eq.${conversationId}` có thể không hoạt động đúng
- UUID format có thể cần được quote

**Test:**
Sử dụng `RealtimeTest` component để so sánh:

- **WITH FILTER** vs **NO FILTER**
- Nếu NO FILTER nhận được nhưng WITH FILTER không → Vấn đề với filter format

**Giải pháp:**
Thử filter format khác:

```typescript
// Format hiện tại
filter: `conversation_id=eq.${conversationId}`;

// Thử format với quotes (nếu là UUID)
filter: `conversation_id=eq."${conversationId}"`;

// Hoặc không dùng filter, filter ở client-side
```

---

### 5. 🟡 WebSocket Connection Issues

**Vấn đề:**

- WebSocket connection có thể bị đóng hoặc có lỗi
- Network/firewall có thể chặn WebSocket

**Kiểm tra:**

1. Mở Developer Tools (F12)
2. Vào tab **Network**
3. Filter: `WS` hoặc `wss://`
4. Tìm connection đến Supabase Realtime
5. Kiểm tra:
   - Status code (should be 101 Switching Protocols)
   - Có error messages không?
   - Có messages nào được gửi/nhận không?

**Giải pháp:**

- Kiểm tra firewall/proxy có chặn WebSocket không
- Kiểm tra `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong `.env.local`
- Restart dev server sau khi thay đổi env variables

---

## Checklist Debug (Khi Permissions đã đầy đủ)

### Bước 1: Chạy Script Debug

```sql
-- File: scripts/debug-realtime-issue.sql
-- Chạy trong Supabase SQL Editor
```

**Kiểm tra:**

- ✅ Publication exists
- ✅ Table in publication
- ✅ SELECT permissions
- ✅ RLS enabled
- ✅ Replica Identity không phải "NOTHING"
- ✅ Primary key exists

### Bước 2: Kiểm tra Dashboard

- ✅ Database > Replication > Enable Realtime cho `messages` table
- ✅ Toggle phải là ON (màu xanh)
- ✅ Không có error messages

### Bước 3: Test với RealtimeTest Component

1. Mở chat page (development mode)
2. Click "Start Test" trong `RealtimeTest` component
3. Gửi tin nhắn từ user khác
4. Xem kết quả:
   - **WITH FILTER**: Nhận được events?
   - **NO FILTER**: Nhận được events?

**Phân tích kết quả:**

- Cả 2 đều nhận được → ✅ Realtime hoạt động, có thể là vấn đề với filter format
- NO FILTER nhận được, WITH FILTER không → ❌ Vấn đề với filter hoặc RLS
- Cả 2 đều không nhận được → ❌ Vấn đề với publication hoặc Dashboard

### Bước 4: Kiểm tra Console Logs

**Khi hoạt động đúng:**

```
🔌 Setting up realtime subscription for conversation: {id}
✅ Realtime subscribed successfully to conversation: {id}
📨 ===== REALTIME MESSAGE RECEIVED =====
📬 MessageList: Received new message via realtime
```

**Nếu chỉ thấy 2 dòng đầu:**

- Subscription thành công nhưng không nhận events
- → Kiểm tra Dashboard, Replica Identity, hoặc RLS

### Bước 5: Kiểm tra WebSocket Connection

- Network tab > Filter: WS
- Kiểm tra connection status và messages
- Xem có error messages không

---

## Giải pháp nhanh (Quick Fix)

Nếu muốn fix nhanh, chạy các lệnh sau theo thứ tự:

### 1. Set Replica Identity

```sql
ALTER TABLE messages REPLICA IDENTITY DEFAULT;
```

### 2. Verify Publication

```sql
-- Kiểm tra
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'messages';

-- Nếu không có, add vào
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### 3. Enable trong Dashboard

- Database > Replication > Enable Realtime cho `messages`

### 4. Test

- Sử dụng `RealtimeTest` component để verify

---

## Tài liệu tham khảo

- `scripts/debug-realtime-issue.sql` - Script debug chi tiết
- `components/chat/RealtimeTest.tsx` - Component test realtime
- `docs/CHAT_REALTIME_ANALYSIS.md` - Phân tích chi tiết
- `docs/REALTIME_SETUP.md` - Hướng dẫn setup
- `docs/REALTIME_TROUBLESHOOTING.md` - Troubleshooting guide
