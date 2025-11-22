# Fix Lỗi Infinite Recursion trong RLS Policies

## Vấn đề

Lỗi: `infinite recursion detected in policy for relation "user_profiles"` (Code: 42P17)

**Nguyên nhân:** Các RLS policies trên bảng `user_profiles` đang query chính bảng đó để kiểm tra quyền admin, tạo ra vòng lặp đệ quy vô hạn.

## Giải pháp

Có 2 bước cần thực hiện:

### Bước 1: Chạy Script SQL Fix trên Database

**QUAN TRỌNG:** Bạn PHẢI chạy script SQL này trên Supabase database để fix các policies.

1. Mở Supabase Dashboard
2. Vào **SQL Editor**
3. Copy và chạy toàn bộ nội dung file: `scripts/fix-rls-recursion-now.sql`

Script này sẽ:
- Drop các policies gây đệ quy
- Tạo các security definer functions để bypass RLS
- Tạo lại các policies sử dụng functions mới
- Grant permissions cần thiết

### Bước 2: Code đã được fix

Code trong `app/api/auth/login/route.ts` đã được cập nhật để:
- Sử dụng admin client riêng cho việc query profile
- Đảm bảo bypass RLS bằng service role key

## Kiểm tra sau khi fix

Sau khi chạy script SQL, kiểm tra:

```sql
-- Kiểm tra các policies đã được tạo
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Kiểm tra các functions đã được tạo
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_admin', 'get_user_role', 'get_user_status');
```

## Nếu vẫn còn lỗi

1. **Đảm bảo script SQL đã được chạy hoàn toàn** - Kiểm tra trong SQL Editor xem có lỗi nào không
2. **Kiểm tra environment variables:**
   - `SUPABASE_SERVICE_ROLE_KEY` phải được set đúng
   - `NEXT_PUBLIC_SUPABASE_URL` phải đúng
3. **Clear cache và restart server:**
   ```bash
   npm run dev
   ```

## Files liên quan

- `scripts/fix-rls-recursion-now.sql` - Script SQL để fix (CHẠY TRƯỚC)
- `lib/supabase/migrations/fix_user_profiles_rls_recursion.sql` - Migration file (backup)
- `app/api/auth/login/route.ts` - Code đăng nhập đã được fix

## Chi tiết kỹ thuật

### Security Definer Functions

Các functions được tạo với `SECURITY DEFINER` sẽ chạy với quyền của người tạo function (thường là superuser), bypass RLS hoàn toàn:

- `is_admin(user_id UUID)` - Kiểm tra user có phải admin
- `get_user_role(user_id UUID)` - Lấy role của user
- `get_user_status(user_id UUID)` - Lấy status của user

### Policies mới

Các policies mới sử dụng functions thay vì query trực tiếp:

```sql
-- Thay vì:
USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))

-- Dùng:
USING (is_admin(auth.uid()))
```

Điều này ngăn chặn đệ quy vì function bypass RLS.

