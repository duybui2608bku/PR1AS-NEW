# 🚀 QUICK START - Admin Panel

## ✅ Checklist Setup (5 phút)

### 1️⃣ Install Dependencies

```bash
npm install
```

### 2️⃣ Setup Environment Variables

```bash
# Copy .env.example to .env.local
cp .env.example .env.local

# Edit .env.local và điền:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY (từ Supabase Dashboard > Settings > API)
```

### 3️⃣ Run Database Migration

1. Mở [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Copy toàn bộ nội dung file: `supabase/migrations/create_site_settings.sql`
5. Paste vào SQL Editor
6. Click **"Run"** hoặc **"Execute"**
7. Kiểm tra: Vào **Table Editor** → Nên thấy table `site_settings`

### 4️⃣ Create Admin Account

```bash
npm run create-admin
```

**Output sẽ hiển thị:**

```
✅ Admin user created successfully!
═══════════════════════════════════════
📋 ADMIN CREDENTIALS
═══════════════════════════════════════
Email:     admin@pr1as.com
Password:  Admin@123456
═══════════════════════════════════════
```

### 5️⃣ Start Development Server

```bash
npm run dev
```

### 6️⃣ Login & Access Admin

1. Mở browser: `http://localhost:3000/auth/login`
2. Login với:
   - Email: `admin@pr1as.com`
   - Password: `Admin@123456`
3. Sau khi login thành công, vào: `http://localhost:3000/admin`

---

## 🎯 Admin Panel Features

### ✅ Modules hiện có:

1. **Dashboard** (`/admin`)

   - Thống kê tổng quan hệ thống

2. **SEO Settings** (`/admin/seo`)

   - General SEO (Title, Description, Keywords, OG Image)
   - Header Settings (Logo, Tagline, Contact)
   - Footer Settings (Company Info, Social Links)

3. **User Management** (`/admin/users`)
   - Xem danh sách users
   - Tìm kiếm & filter theo role
   - Ban/Unban users
   - Delete users

---

## 📖 Quick References

### Admin URLs

- Dashboard: `http://localhost:3000/admin`
- SEO Settings: `http://localhost:3000/admin/seo`
- User Management: `http://localhost:3000/admin/users`

### Demo Credentials

```
Email: admin@pr1as.com
Password: Admin@123456
```

### Important Files

- Admin Layout: `app/admin/layout.tsx`
- SEO Module: `app/admin/seo/page.tsx`
- Users Module: `app/admin/users/page.tsx`
- Database Migration: `supabase/migrations/create_site_settings.sql`
- Create Admin Script: `scripts/create-admin.ts`

### Documentation

- Setup Guide: `docs/ADMIN_SETUP.md`
- Technical Docs: `docs/ADMIN_PANEL.md`
- User Guide: `docs/ADMIN_USER_GUIDE.md`
- Quick README: `ADMIN_README.md`

---

## ⚠️ Common Issues & Solutions

### Issue: "Missing Supabase environment variables"

**Solution:**

- Check `.env.local` file exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart dev server

### Issue: "Error creating admin" khi chạy npm run create-admin

**Solution:**

- Verify `SUPABASE_SERVICE_ROLE_KEY` trong `.env.local`
- Get service key từ: Supabase Dashboard > Settings > API > service_role
- Không phải anon key!

### Issue: Không vào được /admin (redirect về login)

**Solution:**

1. Đã login với email `admin@pr1as.com` chưa?
2. Check browser console để xem lỗi
3. Verify user metadata có `role: "admin"`:
   ```sql
   -- Chạy trong Supabase SQL Editor
   SELECT email, raw_user_meta_data
   FROM auth.users
   WHERE email = 'admin@pr1as.com';
   ```

### Issue: SEO Settings không lưu được

**Solution:**

- Check bảng `site_settings` đã tạo chưa
- Run migration: `supabase/migrations/create_site_settings.sql`
- Check RLS policies đã enable chưa

---

## 🔧 Development Tips

### Hot Reload

Next.js tự động reload khi bạn sửa code. Không cần restart server.

### Clear Cache

Nếu gặp lỗi lạ:

```bash
# Xóa .next folder và rebuild
rm -rf .next
npm run dev
```

### Check Logs

- **Client errors**: Browser Console (F12)
- **Server errors**: Terminal chạy `npm run dev`
- **Database errors**: Supabase Dashboard > Logs

### TypeScript Errors

Chạy type check:

```bash
npx tsc --noEmit
```

---

## 🎨 Customization

### Thêm Menu Item Mới

Edit `app/admin/layout.tsx`:

```typescript
const menuItems: MenuItem[] = [
  // ... existing items
  getItem("My Module", "/admin/my-module", <MyIcon />),
];
```

### Tạo Module Mới

```bash
# 1. Tạo folder
mkdir -p app/admin/my-module

# 2. Tạo page
# File: app/admin/my-module/page.tsx
```

```typescript
export default function MyModulePage() {
  return (
    <div>
      <h1>My Module</h1>
      {/* Your content here */}
    </div>
  );
}
```

### Thêm Translation

Edit `messages/en.json` và `messages/vi.json`:

```json
{
  "admin": {
    "myModule": {
      "title": "My Module"
      // ... more translations
    }
  }
}
```

---

## 🚀 Next Steps

1. ✅ Setup xong? → Test các modules
2. ✅ Quen giao diện? → Đọc User Guide (`docs/ADMIN_USER_GUIDE.md`)
3. ✅ Muốn customize? → Đọc Technical Docs (`docs/ADMIN_PANEL.md`)
4. ✅ Sẵn sàng thêm features? → Check Roadmap trong `ADMIN_README.md`

---

**Chúc bạn code vui vẻ! 🎉**

_Nếu cần hỗ trợ, check các file documentation hoặc xem code examples trong project._
