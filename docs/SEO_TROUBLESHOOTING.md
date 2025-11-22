# 🔧 SEO Settings API - Troubleshooting

## ❌ Lỗi: "Unauthorized"

### Nguyên nhân

Lỗi này xảy ra khi gọi **POST /api/admin/settings/seo** trong các trường hợp:

1. ❌ User chưa đăng nhập
2. ❌ User không có role "admin" trong database
3. ❌ JWT token hết hạn hoặc không hợp lệ

### Giải pháp

#### Bước 1: Kiểm tra đã đăng nhập chưa

1. Vào trang: http://localhost:3000/auth/login
2. Đăng nhập với tài khoản của bạn
3. Sau khi login, thử lại

#### Bước 2: Kiểm tra role trong database

Mở Supabase Dashboard > SQL Editor và chạy:

```sql
-- Xem tất cả users và role
SELECT id, email, role, created_at 
FROM users 
ORDER BY created_at DESC;
```

**Nếu không thấy user hoặc role = null:**

```sql
-- Tạo user với role admin
-- Thay 'your-email@example.com' bằng email thực tế
INSERT INTO users (id, email, role, created_at, updated_at)
SELECT 
  id, 
  email, 
  'admin' as role,
  created_at,
  NOW() as updated_at
FROM auth.users 
WHERE email = 'your-email@example.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();
```

**Nếu user đã tồn tại nhưng role không phải admin:**

```sql
-- Update role thành admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify
SELECT id, email, role FROM users WHERE role = 'admin';
```

#### Bước 3: Verify bảng users tồn tại

```sql
-- Check bảng users
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'users'
);
```

Nếu return `false`, chạy migration:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'client',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

#### Bước 4: Test lại API

**Test GET (Public - không cần auth):**

```bash
curl http://localhost:3000/api/admin/settings/seo
```

Expected: `{"data": {...}}`

**Test POST (Admin only - cần login):**

```bash
# Trong browser console (khi đã login):
fetch('/api/admin/settings/seo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    settings: {
      siteName: "Test PR1AS",
      siteTitle: "Test Title"
    }
  })
})
.then(r => r.json())
.then(console.log);
```

Expected: `{"success": true, "message": "SEO settings updated successfully"}`

---

## ❌ Lỗi: "Admin access required"

### Nguyên nhân

User đã login nhưng **role !== 'admin'** trong database.

### Giải pháp

```sql
-- Set role = admin cho user hiện tại
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

---

## ❌ Lỗi: "Failed to fetch SEO settings"

### Nguyên nhân

1. Bảng `site_settings` chưa tồn tại
2. RLS (Row Level Security) đang block query
3. Permissions không đúng

### Giải pháp

#### 1. Tạo bảng site_settings

```sql
-- Create table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);
```

#### 2. Disable RLS (cho development)

```sql
-- Disable RLS temporarily
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;
```

**Hoặc** setup RLS policies đúng:

```sql
-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read
CREATE POLICY "Anyone can read site_settings"
ON site_settings FOR SELECT
TO public
USING (true);

-- Policy: Admins can insert/update
CREATE POLICY "Admins can modify site_settings"
ON site_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

---

## ❌ Lỗi: POST thành công nhưng không lưu

### Nguyên nhân

Có thể do:
1. JSONB value không đúng format
2. Conflict với unique constraint
3. RLS policies

### Giải pháp

#### Check data đã lưu chưa:

```sql
SELECT * FROM site_settings WHERE key = 'seo_settings';
```

#### Xóa và thử lại:

```sql
-- Delete existing
DELETE FROM site_settings WHERE key = 'seo_settings';

-- Insert manually để test
INSERT INTO site_settings (key, value)
VALUES (
  'seo_settings',
  '{"siteName": "PR1AS", "siteTitle": "Test"}'::jsonb
);
```

---

## 🔍 Debug Mode

Để debug tốt hơn, thêm logging vào API:

### Cập nhật API route (temporary):

```typescript
// app/api/admin/settings/seo/route.ts

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // DEBUG: Log auth info
    console.log('Auth check:', { user: user?.email, authError });

    if (authError || !user) {
      console.log('❌ No user authenticated');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    // DEBUG: Log role check
    console.log('Role check:', { 
      userData, 
      userError, 
      role: userData?.role 
    });

    if (userError || userData?.role !== "admin") {
      console.log('❌ User not admin');
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    console.log('✅ User authorized:', user.email);
    
    // ... rest of code
  } catch (error) {
    console.error("Error updating SEO settings:", error);
    return NextResponse.json(
      { error: "Failed to update SEO settings" },
      { status: 500 }
    );
  }
}
```

Sau đó check terminal logs khi gọi API.

---

## ✅ Quick Checklist

- [ ] Đã login vào website
- [ ] User tồn tại trong bảng `users`
- [ ] User có `role = 'admin'`
- [ ] Bảng `site_settings` đã được tạo
- [ ] RLS disabled hoặc policies đã setup đúng
- [ ] JWT token còn valid (refresh page nếu cần)

---

## 🚀 Quick Fix Script

Chạy script này trong Supabase SQL Editor:

```sql
-- 1. Tạo bảng site_settings nếu chưa có
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Disable RLS (cho development)
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;

-- 3. Tạo/Update admin user (thay email của bạn)
INSERT INTO users (id, email, role, created_at, updated_at)
SELECT 
  id, 
  email, 
  'admin' as role,
  created_at,
  NOW() as updated_at
FROM auth.users 
WHERE email = 'YOUR_EMAIL_HERE'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- 4. Verify
SELECT 'Users table:', COUNT(*) FROM users;
SELECT 'Admin users:', COUNT(*) FROM users WHERE role = 'admin';
SELECT 'Site settings table:', COUNT(*) FROM site_settings;

-- 5. Show your admin account
SELECT id, email, role FROM users WHERE role = 'admin';
```

**Thay `YOUR_EMAIL_HERE` bằng email bạn dùng để login!**

---

## 📞 Vẫn không work?

1. Check browser console logs
2. Check terminal logs (npm run dev)
3. Check Supabase logs trong Dashboard
4. Verify bạn đang test đúng endpoint:
   - GET: Public, không cần auth
   - POST: Admin only, cần auth

---

**Last Updated:** November 18, 2025

