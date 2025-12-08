# Fix Realtime Permissions Issue

## Vấn đề

Khi chạy migration để grant SELECT permission cho `supabase_realtime` role, gặp lỗi:
```
ERROR: 42704: role "supabase_realtime" does not exist
```

## Nguyên nhân

Role `supabase_realtime` không tồn tại trong database. Điều này có thể xảy ra vì:
1. Supabase project chưa được setup Realtime extension đầy đủ
2. Role được tạo tự động khi enable Realtime trong Dashboard, nhưng có thể chưa được tạo
3. Một số Supabase projects sử dụng cách khác để handle Realtime permissions

## Giải pháp

### Cách 1: Grant cho `authenticated` role (Khuyến nghị)

Thay vì grant cho `supabase_realtime`, grant cho `authenticated` role:

```sql
-- Grant SELECT permission to authenticated role
-- This works because Realtime uses the authenticated user's context
GRANT SELECT ON public.messages TO authenticated;
GRANT SELECT ON public.conversations TO authenticated;
```

**Lý do**: Realtime subscriptions sử dụng context của user đã authenticated, nên grant cho `authenticated` role sẽ hoạt động.

### Cách 2: Kiểm tra và tạo role nếu cần

Nếu bạn muốn sử dụng `supabase_realtime` role:

```sql
-- Check if role exists
SELECT EXISTS (
  SELECT 1 FROM pg_roles WHERE rolname = 'supabase_realtime'
) AS role_exists;

-- If role doesn't exist, you might need to enable Realtime in Dashboard first
-- Go to: Database > Replication > Enable for 'messages' table
```

### Cách 3: Sử dụng migration đã được cập nhật

Migration `fix_realtime_permissions.sql` đã được cập nhật để tự động handle cả hai trường hợp:
- Nếu `supabase_realtime` tồn tại → grant cho role đó
- Nếu không → grant cho `authenticated` role

## Các bước thực hiện

1. **Chạy migration đã được cập nhật**:
   ```sql
   -- File: lib/supabase/migrations/fix_realtime_permissions.sql
   -- Migration này sẽ tự động check và grant permission đúng cách
   ```

2. **Hoặc chạy SQL trực tiếp**:
   ```sql
   -- Grant to authenticated role (works in most cases)
   GRANT SELECT ON public.messages TO authenticated;
   GRANT SELECT ON public.conversations TO authenticated;
   ```

3. **Verify permissions**:
   ```sql
   -- Check permissions
   SELECT 
     grantee, 
     table_schema, 
     table_name, 
     privilege_type
   FROM information_schema.role_table_grants
   WHERE grantee IN ('authenticated', 'supabase_realtime')
     AND table_name IN ('messages', 'conversations')
     AND privilege_type = 'SELECT';
   ```

4. **Test lại Realtime**:
   - Refresh browser
   - Gửi tin nhắn từ user 1
   - Kiểm tra user 2 có nhận được realtime event không

## Lưu ý

- Grant cho `authenticated` role là an toàn vì:
  - RLS policies vẫn được áp dụng
  - Chỉ users đã authenticated mới có quyền này
  - Realtime events vẫn được filter bởi RLS policies

- Nếu sau khi grant permission mà vẫn không hoạt động:
  1. Kiểm tra Realtime đã được enable trong Dashboard chưa
  2. Kiểm tra publication đã có table `messages` chưa
  3. Kiểm tra RLS policies có đúng không
  4. Xem logs trong browser console và Network tab

