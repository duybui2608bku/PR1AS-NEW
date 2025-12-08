# Quick Fix cho Realtime Issue

## Vấn đề hiện tại

- ✅ Subscriptions SUBSCRIBED thành công
- ❌ Không nhận được events khi INSERT

## Giải pháp nhanh

### Bước 1: Sửa RLS Policy thành PERMISSIVE

Chạy SQL sau trong Supabase SQL Editor:

```sql
-- Drop policy cũ
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON messages;

-- Tạo lại policy (PERMISSIVE là mặc định)
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

### Bước 2: Test lại

1. Refresh browser ở user 2
2. Gửi tin nhắn từ user 1
3. Kiểm tra xem có nhận được events không

## Tại sao PERMISSIVE?

- PERMISSIVE policies được OR với nhau (thay vì AND)
- Realtime có thể hoạt động tốt hơn với PERMISSIVE policies
- Policy vẫn bảo mật vì chỉ cho phép authenticated users và chỉ trong conversations của họ

## Nếu vẫn không hoạt động

Thử test với policy đơn giản hơn (CHỈ ĐỂ TEST):

```sql
-- Test policy - CHỈ DÙNG ĐỂ TEST!
DROP POLICY IF EXISTS "Participants can view messages in their conversations" ON messages;

CREATE POLICY "Test: Simple policy"
  ON messages FOR SELECT
  TO authenticated
  USING (true); -- Allow all for testing
```

⚠️ **WARNING**: Policy này cho phép tất cả authenticated users đọc tất cả messages. CHỈ dùng để test!

Nếu policy này hoạt động → Vấn đề với logic trong policy cũ
Nếu policy này cũng không hoạt động → Vấn đề khác (không phải RLS)

