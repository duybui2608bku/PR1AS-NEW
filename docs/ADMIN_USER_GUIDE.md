# Hướng dẫn sử dụng Admin Panel - PR1AS

## 📖 Mục lục

1. [Giới thiệu](#giới-thiệu)
2. [Cài đặt ban đầu](#cài-đặt-ban-đầu)
3. [Đăng nhập Admin](#đăng-nhập-admin)
4. [Các Module](#các-module)
5. [Bảo mật](#bảo-mật)
6. [FAQ](#faq)

## 🎯 Giới thiệu

Admin Panel là trang quản trị toàn bộ website PR1AS với các tính năng:

- ✅ Dashboard thống kê tổng quan
- ✅ Quản lý SEO & cài đặt website
- ✅ Quản lý người dùng
- 🔜 Quản lý nội dung (Pages, Categories)
- 🔜 Cài đặt hệ thống

## 🚀 Cài đặt ban đầu

### Bước 1: Cài đặt dependencies

```bash
npm install
```

### Bước 2: Chạy Database Migration

1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Copy nội dung file `supabase/migrations/create_site_settings.sql`
5. Paste và chạy SQL

### Bước 3: Tạo tài khoản Admin

**Cách 1: Sử dụng npm script (Khuyến nghị)**

```bash
# Thêm SUPABASE_SERVICE_ROLE_KEY vào .env.local
# Lấy từ: Supabase Dashboard > Settings > API > service_role key

# Chạy script
npm run create-admin
```

**Cách 2: Thủ công**

Xem chi tiết trong `docs/ADMIN_SETUP.md`

### Bước 4: Khởi động Development Server

```bash
npm run dev
```

## 🔐 Đăng nhập Admin

### Demo Credentials

```
URL: http://localhost:3000/auth/login
Email: admin@pr1as.com
Password: Admin@123456
```

⚠️ **LƯU Ý**: Đây là tài khoản demo, chỉ dùng cho development!

### Truy cập Admin Panel

Sau khi đăng nhập thành công:

```
http://localhost:3000/admin
```

## 📂 Các Module

### 1. Dashboard (`/admin`)

**Tính năng:**

- Thống kê tổng quan hệ thống
- Hiển thị số liệu:
  - Tổng người dùng
  - Worker đang hoạt động
  - Tổng công việc
  - Doanh thu

**Cách sử dụng:**

1. Click "Dashboard" trong sidebar
2. Xem các số liệu thống kê
3. Các số liệu sẽ tự động cập nhật

### 2. SEO Settings (`/admin/seo`)

**Tính năng:**

- Cấu hình SEO metadata
- Cài đặt Header
- Cài đặt Footer

**Cách sử dụng:**

#### General SEO

1. Click "SEO Settings" trong sidebar
2. Tab "General SEO":
   - **Site Name**: Tên website (PR1AS)
   - **Site Title**: Tiêu đề hiển thị trên browser tab
   - **Site Description**: Mô tả cho search engines
   - **Keywords**: Từ khóa SEO (phân cách bằng dấu phẩy)
   - **OG Image**: URL hình ảnh khi share trên social media

#### Header Settings

Tab "Header Settings":

- **Logo URL**: Đường dẫn đến logo
- **Tagline**: Slogan của website
- **Contact Phone**: Số điện thoại liên hệ
- **Contact Email**: Email liên hệ

#### Footer Settings

Tab "Footer Settings":

- **Company Name**: Tên công ty
- **Address**: Địa chỉ công ty
- **Phone**: Số điện thoại
- **Email**: Email
- **About Text**: Giới thiệu ngắn
- **Copyright**: Text bản quyền
- **Social Media**: Links Facebook, Twitter, Instagram, LinkedIn

**Lưu cài đặt:**

- Click nút "Save All Settings" ở cuối trang
- Thông báo thành công sẽ hiển thị

### 3. User Management (`/admin/users`)

**Tính năng:**

- Xem danh sách tất cả users
- Tìm kiếm users
- Lọc theo role (Admin, Worker, Client)
- Ban/Unban users
- Xóa users

**Cách sử dụng:**

#### Tìm kiếm Users

1. Nhập tên hoặc email vào ô "Search users..."
2. Danh sách tự động lọc

#### Lọc theo Role

1. Click dropdown "All Roles"
2. Chọn role muốn xem:
   - Admin (màu đỏ)
   - Worker (màu xanh dương)
   - Client (màu xanh lá)

#### Ban User

1. Click nút "Ban" ở cột Actions
2. Xác nhận trong popup
3. User sẽ không thể đăng nhập

#### Unban User

1. User bị ban sẽ có tag "Banned" màu đỏ
2. Click nút "Unban"
3. User có thể đăng nhập lại

#### Delete User

1. Click nút "Delete" (màu đỏ)
2. Xác nhận xóa trong popup
3. ⚠️ Hành động này không thể hoàn tác!

**Lưu ý:**

- Không thể ban/delete tài khoản Admin
- Admin accounts được bảo vệ

### 4. Settings (Coming Soon)

Module cài đặt hệ thống sẽ bao gồm:

- Email templates
- Payment settings
- Notification settings
- System preferences

## 🔒 Bảo mật

### Kiểm tra quyền Admin

Hệ thống tự động kiểm tra:

1. User đã đăng nhập chưa
2. Email có phải `admin@pr1as.com` không
3. Hoặc `user_metadata.role === 'admin'`

Nếu không đủ điều kiện → chuyển về trang login

### Row Level Security (RLS)

Database được bảo vệ bởi RLS policies:

- Public: Chỉ đọc site settings
- Admin: Có thể thêm/sửa/xóa

### Best Practices

✅ **Nên làm:**

- Đổi mật khẩu admin ngay lập tức
- Sử dụng email chính thức cho admin
- Thường xuyên kiểm tra activity logs
- Backup database định kỳ

❌ **Không nên:**

- Để tài khoản demo trong production
- Share credentials admin
- Sử dụng mật khẩu yếu
- Tắt RLS policies

## 🛠️ Troubleshooting

### Không đăng nhập được Admin Panel

**Kiểm tra:**

1. Email có đúng `admin@pr1as.com` không?
2. User metadata có `role: "admin"` chưa?
3. Check console browser để xem lỗi

**Giải pháp:**

```sql
-- Chạy SQL này trong Supabase SQL Editor
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@pr1as.com';
```

### Không lưu được SEO Settings

**Kiểm tra:**

1. Bảng `site_settings` đã tạo chưa?
2. RLS policies đã setup chưa?
3. User có quyền admin không?

**Giải pháp:**

- Chạy lại migration: `create_site_settings.sql`
- Check console browser để xem error cụ thể

### Không thấy Users trong User Management

**Nguyên nhân:**

- Cần service_role key để list users
- API auth.admin chỉ hoạt động với service role

**Lưu ý:**

- User Management cần Supabase service_role key
- Module này đang trong development
- Sẽ cải thiện trong các phiên bản sau

## 📝 FAQ

### Q: Làm sao thêm admin mới?

**A:** Có 2 cách:

1. **Sử dụng SQL:**

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'newemail@example.com';
```

2. **Sử dụng script:**

- Edit `scripts/create-admin.ts`
- Thay đổi email/password
- Chạy `npm run create-admin`

### Q: Xóa tài khoản demo như thế nào?

**A:**

1. Tạo admin mới với email chính thức
2. Đăng nhập bằng admin mới
3. Vào User Management
4. Tìm `admin@pr1as.com`
5. Click Delete

### Q: SEO settings áp dụng ở đâu?

**A:**

- Settings lưu trong database
- Cần tạo API/hook để fetch settings
- Apply vào `app/layout.tsx` metadata
- Sẽ cập nhật trong version tiếp theo

### Q: Có thể customize sidebar không?

**A:** Có! Edit file `app/admin/layout.tsx`:

```typescript
const menuItems: MenuItem[] = [
  // Thêm menu item mới
  getItem("My Module", "/admin/my-module", <MyIcon />),
];
```

### Q: Làm sao tạo module mới?

**A:**

1. Tạo folder: `app/admin/my-module/`
2. Tạo file: `app/admin/my-module/page.tsx`
3. Code component:

```typescript
export default function MyModulePage() {
  return <div>My Module Content</div>;
}
```

4. Thêm vào sidebar (xem câu trên)

## 🔄 Roadmap

### Version 1.1 (Sắp tới)

- [ ] Content Management module
- [ ] Category management
- [ ] Page builder
- [ ] Media library

### Version 1.2

- [ ] Email template editor
- [ ] Notification settings
- [ ] Activity logs
- [ ] Analytics dashboard

### Version 2.0

- [ ] Role-based access control (RBAC)
- [ ] Multi-admin support
- [ ] 2FA authentication
- [ ] Advanced reporting

## 💡 Tips & Tricks

### Keyboard Shortcuts

| Shortcut       | Action                     |
| -------------- | -------------------------- |
| `Ctrl/Cmd + K` | Quick search (coming soon) |
| `Ctrl/Cmd + S` | Save current form          |
| `Esc`          | Close modal                |

### Performance Tips

1. **Pagination**: Sử dụng pagination cho lists lớn
2. **Lazy Loading**: Load data khi cần
3. **Caching**: Cache API responses
4. **Debounce**: Debounce search inputs

### UI/UX Best Practices

1. **Feedback**: Luôn show loading states
2. **Confirmation**: Confirm trước khi delete/ban
3. **Messages**: Show success/error messages
4. **Validation**: Validate forms trước khi submit

## 📞 Support

Nếu cần hỗ trợ:

1. Check documentation này
2. Xem code examples trong project
3. Check Supabase documentation
4. Contact development team

---

**Version**: 1.0.0  
**Last Updated**: November 17, 2025  
**Author**: PR1AS Development Team
