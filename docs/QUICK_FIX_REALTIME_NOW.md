# Quick Fix Realtime - Hướng dẫn nhanh

## Tình huống: Đã fix policies nhưng vẫn không hoạt động

## Bước 1: Chạy Script SQL Fix Tất Cả

```sql
-- File: scripts/comprehensive-realtime-debug.sql
-- Copy và chạy trong Supabase SQL Editor
```

Script này sẽ:

- ✅ Grant permissions
- ✅ Set Replica Identity
- ✅ Add table vào publication
- ✅ Fix RLS policies

## Bước 2: Enable Realtime trong Dashboard (BẮT BUỘC!)

1. Vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. **Database** > **Replication**
4. Tìm table `messages`
5. **BẬT toggle "Enable Realtime"** (phải là màu xanh)
6. Lưu lại

⚠️ **QUAN TRỌNG:** Bước này BẮT BUỘC, không thể thay thế bằng SQL!

## Bước 3: Test với RealtimeTest Component

1. Mở chat page (development mode)
2. Component `RealtimeTest` sẽ hiển thị ở cuối chat
3. Click **"Start Test"**
4. Gửi tin nhắn từ user khác
5. Xem kết quả:
   - **WITH FILTER**: Nhận được events?
   - **NO FILTER**: Nhận được events?

### Phân tích kết quả:

- ✅ **Cả 2 đều nhận được** → Realtime OK, có thể là filter format
- ⚠️ **NO FILTER nhận được, WITH FILTER không** → Vấn đề với filter format
- ❌ **Cả 2 đều không nhận được** → Vấn đề với Realtime setup

## Bước 4: Nếu vẫn không hoạt động

### Option A: Sử dụng Hook Fixed

Thay `useSupabaseRealtime` bằng `useSupabaseRealtimeFixed`:

```typescript
// Trong components/chat/MessageList.tsx
import { useSupabaseRealtimeFixed } from "@/hooks/chat/useSupabaseRealtimeFixed";

// Thay dòng này:
// useSupabaseRealtime({...})

// Bằng:
useSupabaseRealtimeFixed({
  conversationId,
  onMessage: (newMessage) => {
    // ... existing code
  },
});
```

Hook này có fallback subscription không filter để debug.

### Option B: Test trong Browser Console

1. Mở chat page
2. Mở Developer Tools (F12) > Console
3. Copy code từ `scripts/test-realtime-complete.js`
4. Paste vào console và chạy
5. Nhập conversation ID khi được hỏi
6. Gửi tin nhắn từ user khác và xem kết quả

## Bước 5: Kiểm tra Console Logs

Khi hoạt động đúng, bạn sẽ thấy:

```
🔌 Setting up realtime subscription
✅ Primary subscription SUBSCRIBED
✅ Fallback subscription SUBSCRIBED
📨 ===== REALTIME MESSAGE RECEIVED =====
```

Nếu chỉ thấy SUBSCRIBED nhưng không có events:

- ❌ Kiểm tra Dashboard (Realtime enabled?)
- ❌ Kiểm tra WebSocket connection (Network tab > WS)
- ❌ Kiểm tra RLS policies

## Checklist Nhanh

- [ ] Chạy `scripts/comprehensive-realtime-debug.sql`
- [ ] Enable Realtime trong Dashboard
- [ ] Test với RealtimeTest component
- [ ] Kiểm tra console logs
- [ ] Nếu cần: Sử dụng `useSupabaseRealtimeFixed` hook

## Vẫn không hoạt động?

1. Kiểm tra Network tab > WebSocket connection
2. Kiểm tra browser console có errors không
3. Thử với subscription không filter (fallback)
4. Kiểm tra RLS policies có đang filter không

Xem chi tiết trong: `docs/REALTIME_DEBUG_COMPLETE.md`
