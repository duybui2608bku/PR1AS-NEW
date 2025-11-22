# 🎉 Hướng dẫn sử dụng nhanh

## ✅ Đã setup xong

Tôi đã thiết lập hoàn chỉnh các component cơ bản cho website của bạn với Ant Design, lấy cảm hứng từ Airbnb:

### 📦 Các component đã tạo:

#### 1. Layout Components

- **Header** (`components/layout/Header.tsx`)

  - Logo PR1AS
  - User menu với avatar
  - Nút "Trở thành Worker"
  - Language selector
  - Hoàn toàn responsive

- **Footer** (`components/layout/Footer.tsx`)

  - 4 cột: Giới thiệu, Cộng đồng, Worker, Hỗ trợ
  - Social media icons
  - Links pháp lý

- **MainLayout** (`components/layout/MainLayout.tsx`)
  - Wrapper cho Header + Content + Footer
  - ConfigProvider cho Ant Design theme
  - Theme màu #FF385C (giống Airbnb)

#### 2. Authentication Pages

- **Login** (`app/auth/login/page.tsx`)

  - Đăng nhập với Google OAuth
  - Đăng nhập với Email/Password
  - Checkbox "Ghi nhớ đăng nhập"
  - Link "Quên mật khẩu"
  - Validation form đầy đủ

- **Signup** (`app/auth/signup/page.tsx`)
  - **Chọn role**: Client hoặc Worker (theo yêu cầu auth.md)
  - Đăng ký với Google OAuth
  - Đăng ký với Email/Password
  - Validation: email, password match, v.v.
  - Terms & Privacy links

#### 3. Special Pages

- **Banned Page** (`app/banned/page.tsx`)

  - Thông báo tài khoản bị khóa
  - Hướng dẫn liên hệ hỗ trợ
  - Email support

- **404 Not Found** (`app/not-found.tsx`)
- **Error Page** (`app/error.tsx`) - với retry button
- **Loading State** (`app/loading.tsx`)

#### 4. Utilities

- **Toast System** (`lib/utils/toast.ts`)

  ```typescript
  // Sử dụng trong component
  import {
    showMessage,
    showNotification,
    showLoading,
  } from "@/lib/utils/toast";

  showMessage.success("Thành công!");
  showMessage.error("Lỗi!");
  showMessage.warning("Cảnh báo!");
  showMessage.loading("Đang tải...");

  showNotification.success("Tiêu đề", "Mô tả chi tiết");

  const hide = showLoading.message();
  // Khi xong
  hide();
  ```

#### 5. Homepage

- **Landing Page** (`app/page.tsx`)
  - Hero section với gradient background
  - 3 feature cards
  - CTA section
  - Hoàn toàn responsive

## 🎨 Design System

### Colors

- Primary: `#FF385C` (Airbnb red)
- Primary Hover: `#E61E4D`
- Text: `#222222`
- Text Secondary: `#717171`
- Border: `#DDDDDD`

### Components Style

- Button height: 48px (default), 56px (large)
- Border radius: 8px (standard), 16px (cards), 28px (pills)
- Font size: 14px, 16px, 18px
- Shadow: `0 4px 12px rgba(0, 0, 0, 0.08)`

## 🚀 Chạy project

```bash
npm run dev
```

Mở http://localhost:3000

## 📍 Routes hiện có

- `/` - Homepage
- `/auth/login` - Đăng nhập
- `/auth/signup` - Đăng ký (với lựa chọn role)
- `/banned` - Trang tài khoản bị khóa

## 🔧 Cần làm tiếp

### Phần Authentication (theo auth.md)

1. **Kết nối Supabase**

   - Setup Google OAuth provider trong Supabase
   - Config redirect URLs
   - Tạo bảng `user_profiles`

2. **Implement Auth Logic**

   - Google OAuth flow
   - Email/Password signup/login
   - Check email đã tồn tại
   - Validate role (1 email = 1 role)
   - Session management

3. **Middleware & Route Guards**

   - Check banned status
   - Redirect logged-in users từ /auth
   - Role-based routing

4. **User Profile**
   - Tạo/update profile sau signup
   - Avatar upload
   - Profile completion flow

### Phần Dashboard (chưa làm)

- Client Dashboard
- Worker Dashboard
- Admin Panel

## 💡 Tips

### Sử dụng MainLayout

```tsx
import MainLayout from "@/components/layout/MainLayout";

export default function YourPage() {
  return <MainLayout>{/* Your content */}</MainLayout>;
}
```

### Sử dụng Toast

```tsx
"use client";
import { showMessage } from "@/lib/utils/toast";

const handleSubmit = async () => {
  const hide = showMessage.loading("Đang xử lý...");
  try {
    await someAsyncOperation();
    hide();
    showMessage.success("Thành công!");
  } catch {
    hide();
    showMessage.error("Có lỗi xảy ra");
  }
};
```

### Custom Theme Ant Design

Chỉnh trong `components/layout/MainLayout.tsx`:

```tsx
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#FF385C', // Đổi màu chính
      borderRadius: 8,
      // ... thêm tokens khác
    }
  }}
>
```

## 📚 Tài liệu tham khảo

- [Next.js Docs](https://nextjs.org/docs)
- [Ant Design](https://ant.design/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- Auth Spec: `docs/auth.md`

---

**Lưu ý**: Tất cả các trang auth đã được thiết kế nhưng **chưa kết nối với Supabase**. Bạn cần implement phần backend authentication theo file `docs/auth.md`.
