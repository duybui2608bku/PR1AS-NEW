# Fix Lỗi Storage RLS: "new row violates row-level security policy"

## Vấn đề

Lỗi này xảy ra khi Supabase Storage bucket "image" chưa có RLS policies hoặc policies chưa được cấu hình đúng.

## Giải pháp nhanh

### Bước 1: Chạy Script SQL

1. Mở **Supabase Dashboard** → **SQL Editor**
2. Copy toàn bộ nội dung file: `scripts/fix-storage-rls-now.sql`
3. Paste và chạy trong SQL Editor

Script này sẽ:

- ✅ Tạo policies cho phép authenticated users upload/update/delete ảnh
- ✅ Cho phép public đọc ảnh (public access)
- ✅ Verify policies đã được tạo

### Bước 2: Kiểm tra Bucket

Đảm bảo bucket "image" đã được tạo:

1. Vào **Storage** trong Supabase Dashboard
2. Kiểm tra có bucket tên "image" không
3. Nếu chưa có, tạo mới:
   - Name: `image`
   - **Public bucket**: `true` ✅
   - Click **Create bucket**

### Bước 3: Test lại

Sau khi chạy script, thử upload ảnh lại. Nếu vẫn lỗi, kiểm tra:

1. **User đã đăng nhập chưa?** - API yêu cầu authentication
2. **Token có hợp lệ không?** - Kiểm tra cookies `sb-access-token`
3. **Bucket name có đúng là "image" không?**

## Policies được tạo

Script sẽ tạo 4 policies:

1. **Public can view images** - Cho phép mọi người xem ảnh
2. **Authenticated users can upload images** - Cho phép user đã đăng nhập upload
3. **Authenticated users can update images** - Cho phép user update ảnh
4. **Authenticated users can delete images** - Cho phép user xóa ảnh

## Alternative: Disable RLS (Development only)

⚠️ **CHỈ DÙNG CHO DEVELOPMENT!**

Nếu muốn disable RLS tạm thời (không khuyến khích):

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

## Files liên quan

- `scripts/fix-storage-rls-now.sql` - Script fix nhanh (CHẠY FILE NÀY)
- `lib/supabase/migrations/setup_storage_policies.sql` - Migration file với policies phức tạp hơn
- `app/api/upload/image/route.ts` - API endpoint upload

## Troubleshooting

### Vẫn lỗi sau khi chạy script?

1. **Kiểm tra bucket có tồn tại:**

   ```sql
   SELECT * FROM storage.buckets WHERE name = 'image';
   ```

2. **Kiểm tra policies đã được tạo:**

   ```sql
   SELECT policyname FROM pg_policies
   WHERE schemaname = 'storage'
   AND tablename = 'objects';
   ```

3. **Kiểm tra user đã authenticated:**
   - Mở DevTools → Application → Cookies
   - Tìm cookie `sb-access-token`
   - Nếu không có, cần đăng nhập lại

### Lỗi "bucket does not exist"

Tạo bucket trong Supabase Dashboard:

- Storage → Create bucket → Name: `image` → Public: `true`
