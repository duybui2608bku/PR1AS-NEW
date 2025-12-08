# Fix Realtime Issue - Subscription SUBSCRIBED nhưng không nhận được Events

## Vấn đề

- ✅ Subscription SUBSCRIBED thành công
- ✅ WebSocket connection OK
- ❌ **KHÔNG nhận được events** khi có message mới từ user khác

## Nguyên nhân có thể

### 1. 🔴 RLS Policies đang filter events

**Triệu chứng:**

- Subscription SUBSCRIBED thành công
- Nhưng không nhận được events

**Giải pháp:**

- Đã thay hook bằng `useSupabaseRealtimeFixed` có fallback subscription không filter
- Fallback sẽ nhận TẤT CẢ INSERT events và filter ở client-side
- Nếu fallback nhận được nhưng primary không → RLS đang filter

### 2. 🔴 Realtime chưa được enable trong Dashboard

**Triệu chứng:**

- Subscription SUBSCRIBED
- Nhưng Supabase không gửi events

**Giải pháp:**

1. Vào Supabase Dashboard
2. Database > Replication
3. Tìm table `messages`
4. **BẬT toggle "Enable Realtime"** (phải là màu xanh)
5. Lưu lại

### 3. 🔴 Table chưa được add vào Publication

**Triệu chứng:**

- Subscription SUBSCRIBED
- Nhưng không có events

**Giải pháp:**

```sql
-- Kiểm tra
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'messages';

-- Nếu không có, add vào
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### 4. 🔴 Filter format không đúng với UUID

**Triệu chứng:**

- Subscription SUBSCRIBED
- Fallback (no filter) có thể nhận được nhưng primary (with filter) không

**Giải pháp:**

- Hook fixed đã có fallback subscription
- Nếu fallback nhận được → Filter format là vấn đề

## ✅ Đã thực hiện

### 1. Thay hook bằng useSupabaseRealtimeFixed

**File:** `components/chat/MessageList.tsx`

**Thay đổi:**

```typescript
// Trước
import { useSupabaseRealtime } from "@/hooks/chat/useSupabaseRealtime";
useSupabaseRealtime({...})

// Sau
import { useSupabaseRealtimeFixed } from "@/hooks/chat/useSupabaseRealtimeFixed";
useSupabaseRealtimeFixed({...})
```

**Lợi ích:**

- ✅ Có fallback subscription không filter
- ✅ Better error handling
- ✅ Debug logging chi tiết hơn

## 📋 Checklist Fix

### Bước 1: Kiểm tra Dashboard

- [ ] Vào Supabase Dashboard
- [ ] Database > Replication
- [ ] Tìm table `messages`
- [ ] **BẬT toggle "Enable Realtime"** (màu xanh)
- [ ] Lưu lại

### Bước 2: Kiểm tra Publication

```sql
-- Chạy trong Supabase SQL Editor
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'messages';

-- Nếu không có, chạy:
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Bước 3: Test lại với Hook Fixed

1. Refresh browser
2. Mở conversation
3. Kiểm tra console logs:
   - `✅ Primary subscription SUBSCRIBED`
   - `✅ Fallback subscription SUBSCRIBED (no filter)`
4. Gửi message từ user khác
5. Xem logs:
   - Nếu thấy `📨 NO FILTER: MESSAGE RECEIVED` nhưng không thấy `WITH FILTER` → Filter format issue
   - Nếu cả 2 đều không nhận được → Realtime setup issue

### Bước 4: Kiểm tra RLS Policies

```sql
-- Kiểm tra policies
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages'
  AND cmd = 'SELECT';
```

Nếu có policy test, xóa và tạo lại production policy:

```sql
-- Xóa test policies
DROP POLICY IF EXISTS "Test: Allow all authenticated users" ON messages;

-- Tạo lại production policy
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON messages;

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

## 🔍 Debug tiếp theo

Sau khi thay hook fixed, kiểm tra:

1. **Console logs khi mở conversation:**

   - Có `✅ Primary subscription SUBSCRIBED`?
   - Có `✅ Fallback subscription SUBSCRIBED`?

2. **Khi gửi message từ user khác:**

   - Có `📨 WITH FILTER: MESSAGE RECEIVED`?
   - Có `📨 NO FILTER: MESSAGE RECEIVED`?
   - Nếu chỉ có NO FILTER → Filter format issue
   - Nếu cả 2 đều không → Realtime setup issue

3. **RealtimeTest Component:**
   - Xem có events nào được nhận không
   - So sánh WITH FILTER vs NO FILTER

## 💡 Kết luận

**Đã fix:**

- ✅ Thay hook bằng `useSupabaseRealtimeFixed` với fallback subscription

**Cần kiểm tra:**

- ⚠️ Realtime có được enable trong Dashboard không?
- ⚠️ Table có trong publication không?
- ⚠️ RLS policies có đang filter không?

**Test tiếp:**

1. Refresh browser
2. Mở conversation
3. Gửi message từ user khác
4. Kiểm tra console logs và RealtimeTest component

## 🔗 Tài liệu liên quan

- `hooks/chat/useSupabaseRealtimeFixed.ts` - Hook fixed với fallback
- `docs/REALTIME_DEBUG_COMPLETE.md` - Hướng dẫn debug chi tiết
- `docs/QUICK_FIX_REALTIME_NOW.md` - Hướng dẫn fix nhanh
- `scripts/comprehensive-realtime-debug.sql` - Script SQL debug
