# Hướng dẫn Debug Realtime Hoàn Chỉnh

## Tình huống: Đã fix hết Policies nhưng vẫn không hoạt động

Sau khi đã fix tất cả policies và permissions, nếu realtime vẫn không hoạt động, có thể do các nguyên nhân sau:

## 🔴 Nguyên nhân 1: Filter Format không đúng với UUID

**Vấn đề:**

- Supabase Realtime filter với UUID có thể cần format đặc biệt
- Filter `conversation_id=eq.${conversationId}` có thể không hoạt động với UUID

**Giải pháp:**

1. Sử dụng hook `useSupabaseRealtimeFixed` (đã tạo) - có fallback subscription không filter
2. Hoặc thử các filter formats khác:

   ```typescript
   // Format 1: Standard
   filter: `conversation_id=eq.${conversationId}`;

   // Format 2: Quoted
   filter: `conversation_id=eq."${conversationId}"`;

   // Format 3: Single quotes
   filter: `conversation_id=eq.'${conversationId}'`;
   ```

**Test:**

- Sử dụng `RealtimeTest` component
- Nếu **NO FILTER** nhận được events nhưng **WITH FILTER** không → Vấn đề với filter format

---

## 🔴 Nguyên nhân 2: Client Caching Issue

**Vấn đề:**

- Supabase client được cache có thể không có authenticated context đúng
- Realtime subscriptions cần authenticated user context

**Giải pháp:**

1. Đảm bảo user đã authenticate trước khi subscribe
2. Kiểm tra `supabase.auth.getUser()` trước khi setup subscription
3. Hoặc tạo client mới mỗi lần (không cache)

**Code fix:**

```typescript
// Trong useSupabaseRealtime hook, thêm check:
const supabase = createClient();
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  console.warn("⚠️ User not authenticated, cannot setup realtime");
  return;
}
```

---

## 🔴 Nguyên nhân 3: Realtime chưa enable trong Dashboard

**Vấn đề:**

- Ngay cả khi đã add table vào publication, Realtime vẫn cần được enable trong Dashboard
- Đây là bước BẮT BUỘC

**Giải pháp:**

1. Vào Supabase Dashboard
2. Database > Replication
3. Tìm table `messages`
4. **BẬT toggle "Enable Realtime"**
5. Lưu và đợi vài giây

---

## 🔴 Nguyên nhân 4: WebSocket Connection Issues

**Vấn đề:**

- WebSocket có thể bị chặn bởi firewall/proxy
- Connection có thể bị đóng sớm

**Kiểm tra:**

1. Mở Developer Tools (F12)
2. Network tab > Filter: `WS` hoặc `wss://`
3. Tìm connection đến Supabase Realtime
4. Kiểm tra:
   - Status code (should be 101 Switching Protocols)
   - Có error messages không?
   - Connection có bị đóng sớm không?

**Giải pháp:**

- Kiểm tra firewall/proxy settings
- Kiểm tra `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server

---

## 🔴 Nguyên nhân 5: RLS Policy vẫn đang filter (mặc dù đã fix)

**Vấn đề:**

- RLS policies có thể vẫn đang filter events ngay cả khi đã được fix
- Policy với `EXISTS` subquery có thể không hoạt động tốt với Realtime

**Test:**

1. Tạm thời disable RLS để test:
   ```sql
   ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
   ```
2. Test realtime - nếu hoạt động → RLS đang filter
3. Enable lại và điều chỉnh policy

**Giải pháp:**

- Sử dụng policy đơn giản hơn (không dùng EXISTS subquery)
- Hoặc test với policy cho phép tất cả authenticated users (tạm thời)

---

## Checklist Debug Hoàn Chỉnh

### Bước 1: Chạy Script Comprehensive Debug

```sql
-- File: scripts/comprehensive-realtime-debug.sql
-- Chạy trong Supabase SQL Editor
```

**Kiểm tra:**

- ✅ Permissions (supabase_realtime và authenticated)
- ✅ Replica Identity = DEFAULT
- ✅ Table trong publication
- ✅ RLS policies đúng (không có test policies)

### Bước 2: Enable Realtime trong Dashboard

- ✅ Database > Replication > Enable Realtime cho `messages`
- ✅ Toggle phải là ON (màu xanh)
- ✅ Không có error messages

### Bước 3: Test với RealtimeTest Component

1. Mở chat page (development mode)
2. Click "Start Test"
3. Gửi tin nhắn từ user khác
4. Xem kết quả:
   - **WITH FILTER**: Nhận được?
   - **NO FILTER**: Nhận được?

**Phân tích:**

- Cả 2 đều nhận được → ✅ Realtime OK, có thể là filter format
- NO FILTER nhận được, WITH FILTER không → ❌ Filter format issue
- Cả 2 đều không nhận được → ❌ Realtime setup issue

### Bước 4: Kiểm tra Console Logs

**Khi hoạt động đúng:**

```
🔌 Setting up realtime subscription
✅ Primary subscription SUBSCRIBED
✅ Fallback subscription SUBSCRIBED
📨 REALTIME MESSAGE RECEIVED
```

**Nếu chỉ thấy SUBSCRIBED nhưng không có events:**

- Kiểm tra Dashboard
- Kiểm tra WebSocket connection
- Kiểm tra RLS policies

### Bước 5: Test với Hook Fixed

Thay `useSupabaseRealtime` bằng `useSupabaseRealtimeFixed`:

```typescript
// Trong MessageList.tsx
import { useSupabaseRealtimeFixed } from "@/hooks/chat/useSupabaseRealtimeFixed";

// Thay useSupabaseRealtime bằng useSupabaseRealtimeFixed
useSupabaseRealtimeFixed({
  conversationId,
  onMessage: (newMessage) => {
    // ...
  },
});
```

Hook này có:

- ✅ Fallback subscription không filter
- ✅ Better error handling
- ✅ Debug logging chi tiết

---

## Quick Fix Script

Chạy script này để fix tất cả:

```sql
-- File: scripts/comprehensive-realtime-debug.sql
```

Sau đó:

1. Enable Realtime trong Dashboard
2. Test với RealtimeTest component
3. Nếu vẫn không hoạt động → Sử dụng `useSupabaseRealtimeFixed` hook

---

## Tài liệu tham khảo

- `scripts/comprehensive-realtime-debug.sql` - Script fix tất cả
- `hooks/chat/useSupabaseRealtimeFixed.ts` - Hook cải tiến với fallback
- `components/chat/RealtimeTest.tsx` - Component test realtime
- `docs/CHAT_REALTIME_ANALYSIS.md` - Phân tích chi tiết
