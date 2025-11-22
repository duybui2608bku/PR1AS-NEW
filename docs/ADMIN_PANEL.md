# Admin Panel - PR1AS

Trang quản trị toàn website với nhiều module quản lý khác nhau.

## 🎯 Tính năng

### ✅ Đã hoàn thành

1. **Admin Layout với Sidebar**

   - Sidebar có thể thu gọn/mở rộng
   - Menu điều hướng với icon
   - Header với thông tin user
   - Responsive design

2. **Dashboard**

   - Thống kê tổng quan
   - Số liệu người dùng, worker, công việc, doanh thu

3. **SEO Settings Module**

   - Cài đặt SEO metadata chung (title, description, keywords, OG image)
   - Cài đặt Header (logo, tagline, thông tin liên hệ)
   - Cài đặt Footer (thông tin công ty, địa chỉ, liên kết mạng xã hội)
   - Lưu vào database (Supabase)
   - Hỗ trợ đa ngôn ngữ (EN, VI)

4. **Authentication & Authorization**
   - Kiểm tra quyền admin
   - Chuyển hướng nếu không phải admin
   - Tài khoản admin demo (tạm thời)

### 📋 Cấu trúc thư mục

```
app/admin/
├── layout.tsx          # Layout chính với sidebar
├── page.tsx           # Dashboard
├── styles.css         # Styles cho admin
└── seo/
    └── page.tsx       # Module SEO settings

docs/
└── ADMIN_SETUP.md     # Hướng dẫn setup admin

scripts/
└── create-admin.ts    # Script tạo tài khoản admin

supabase/migrations/
└── create_site_settings.sql  # Migration cho bảng settings
```

## 🚀 Cài đặt & Sử dụng

### 1. Chạy Migration

Truy cập Supabase Dashboard > SQL Editor và chạy file:

```
supabase/migrations/create_site_settings.sql
```

### 2. Tạo tài khoản Admin Demo

**Cách 1: Sử dụng script (Khuyến nghị)**

```bash
# Cài đặt tsx nếu chưa có
npm install -g tsx

# Thêm SUPABASE_SERVICE_ROLE_KEY vào .env.local
# Lấy từ Supabase Dashboard > Settings > API > service_role key

# Chạy script
npx tsx scripts/create-admin.ts
```

**Cách 2: Tạo thủ công**

Xem hướng dẫn chi tiết trong `docs/ADMIN_SETUP.md`

### 3. Đăng nhập Admin

```
URL: http://localhost:3000/auth/login
Email: admin@pr1as.com
Password: Admin@123456
```

Sau khi đăng nhập, truy cập: `http://localhost:3000/admin`

## 📂 Modules

### Dashboard (`/admin`)

- Tổng quan thống kê hệ thống
- Số liệu users, workers, jobs, revenue

### SEO Settings (`/admin/seo`)

- **General SEO**: Site name, title, description, keywords, OG image
- **Header Settings**: Logo, tagline, contact info
- **Footer Settings**: Company info, address, social media links

### Modules sắp tới

- Content Management (Pages, Categories)
- User Management
- Settings

## 🔒 Bảo mật

### Kiểm tra quyền admin

File `app/admin/layout.tsx` kiểm tra:

```typescript
const isAdmin =
  user.email === "admin@pr1as.com" || user.user_metadata?.role === "admin";
```

### RLS Policies (Supabase)

```sql
-- Chỉ admin mới được sửa settings
CREATE POLICY "Only admins can modify site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'admin@pr1as.com'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
```

## ⚠️ Lưu ý quan trọng

### Tài khoản Demo

- **CHỈ SỬ DỤNG CHO DEVELOPMENT**
- **XÓA TRƯỚC KHI PRODUCTION**
- Email: `admin@pr1as.com`
- Hardcoded trong code, cần refactor

### TODO cho Production

- [ ] Xóa tài khoản admin demo
- [ ] Implement hệ thống RBAC đầy đủ
- [ ] Tạo bảng `admin_users` hoặc `user_roles`
- [ ] Thêm module quản lý admin users
- [ ] Implement 2FA cho admin
- [ ] Add audit logging
- [ ] Environment variables cho admin emails
- [ ] Rate limiting cho admin actions

## 🎨 UI/UX

- **Framework**: Ant Design
- **Theme**: Dark sidebar, white content area
- **Responsive**: Mobile-friendly sidebar
- **Icons**: Ant Design Icons
- **Layout**: Fixed sidebar, scrollable content

## 🌐 Đa ngôn ngữ

Đã thêm translations vào:

- `messages/en.json` - English
- `messages/vi.json` - Tiếng Việt

Namespace: `admin.*`

## 📊 Database Schema

### Table: `site_settings`

```sql
id          UUID PRIMARY KEY
key         TEXT UNIQUE NOT NULL
value       JSONB NOT NULL
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

Key: `seo_settings`

Value structure:

```json
{
  "siteName": "string",
  "siteTitle": "string",
  "siteDescription": "string",
  "siteKeywords": "string",
  "ogImage": "string",
  "headerLogo": "string",
  "headerTagline": "string",
  "headerContactPhone": "string",
  "headerContactEmail": "string",
  "footerCompanyName": "string",
  "footerAddress": "string",
  "footerPhone": "string",
  "footerEmail": "string",
  "footerCopyright": "string",
  "footerAbout": "string",
  "facebookUrl": "string",
  "twitterUrl": "string",
  "instagramUrl": "string",
  "linkedinUrl": "string"
}
```

## 🔧 Customization

### Thêm menu item mới

Edit `app/admin/layout.tsx`:

```typescript
const menuItems: MenuItem[] = [
  // ... existing items
  getItem("New Module", "/admin/new-module", <NewIcon />),
];
```

### Tạo module mới

1. Tạo folder: `app/admin/new-module/`
2. Tạo file: `app/admin/new-module/page.tsx`
3. Component sẽ tự động render trong admin layout

## 📝 License

© 2024 PR1AS. All rights reserved.
