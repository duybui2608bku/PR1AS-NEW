# PR1AS - Nền tảng kết nối Client & Worker

## 🚀 Tổng quan

PR1AS là nền tảng kết nối giữa Client (người thuê dịch vụ) và Worker (người cung cấp dịch vụ), được xây dựng với Next.js 14, Ant Design, và Supabase.

## 🎨 Giao diện

Giao diện được thiết kế lấy cảm hứng từ Airbnb với:

- Màu chủ đạo: `#FF385C` (Đỏ hồng)
- Font chữ: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- Border radius mềm mại, shadow nhẹ nhàng
- Responsive design cho mọi thiết bị

## 📦 Công nghệ sử dụng

- **Framework**: Next.js 14 (App Router)
- **UI Library**: Ant Design 5.28+
- **Database & Auth**: Supabase
- **Styling**: TailwindCSS 4 + Ant Design
- **Language**: TypeScript

## 🏗️ Cấu trúc dự án

```
pr1as/
├── app/                      # Next.js App Router
│   ├── auth/                # Trang authentication
│   │   ├── login/          # Trang đăng nhập
│   │   ├── signup/         # Trang đăng ký
│   │   └── layout.tsx      # Layout cho auth pages
│   ├── banned/             # Trang tài khoản bị khóa
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Trang chủ
│   ├── loading.tsx         # Loading state
│   ├── error.tsx           # Error handling
│   └── not-found.tsx       # 404 page
├── components/
│   └── layout/             # Layout components
│       ├── Header.tsx      # Header với menu
│       ├── Footer.tsx      # Footer với links
│       └── MainLayout.tsx  # Main layout wrapper
├── lib/
│   ├── supabase/          # Supabase clients
│   │   ├── client.ts      # Client-side Supabase
│   │   └── server.ts      # Server-side Supabase
│   └── utils/
│       └── toast.ts        # Toast/notification utilities
└── docs/
    └── auth.md             # Authentication specification
```

## 🎯 Tính năng hiện tại

### ✅ Đã hoàn thành

1. **Layout Components**

   - Header với menu dropdown
   - Footer với links và social media
   - MainLayout với Ant Design ConfigProvider
   - Responsive design

2. **Toast & Notification System**

   - Message API cho thông báo ngắn
   - Notification API cho thông báo chi tiết
   - Loading utilities
   - Cấu hình global

3. **Authentication Pages**

   - **Login**: Đăng nhập với Google OAuth hoặc Email/Password
   - **Signup**: Đăng ký với lựa chọn role (Client/Worker)
   - Validation form đầy đủ
   - UI hiện đại theo phong cách Airbnb

4. **Special Pages**

   - Banned page cho tài khoản bị khóa
   - 404 Not Found page
   - Error page với retry functionality
   - Loading state

5. **Homepage**
   - Hero section với gradient background
   - Features section
   - CTA section
   - Hoàn toàn responsive

## 🎨 Component Highlights

### Header Component

- Logo và navigation
- Search bar placeholder
- User menu dropdown (khi đã đăng nhập)
- "Trở thành Worker" button
- Language selector
- Airbnb-style design

### Footer Component

- 4 columns: Giới thiệu, Cộng đồng, Worker, Hỗ trợ
- Social media icons
- Copyright và legal links
- Responsive grid layout

### Toast System

```typescript
import { showMessage, showNotification, showLoading } from "@/lib/utils/toast";

// Message
showMessage.success("Thành công!");
showMessage.error("Có lỗi xảy ra");
showMessage.warning("Cảnh báo");
showMessage.info("Thông tin");

// Notification
showNotification.success("Tiêu đề", "Mô tả chi tiết");

// Loading
const hide = showLoading.message("Đang tải...");
// ... sau khi xong
hide();
```

## 🔐 Authentication Flow (Theo auth.md)

### Đăng ký

1. User chọn role: Client hoặc Worker
2. Đăng ký bằng Google OAuth HOẶC Email/Password
3. Hệ thống kiểm tra email đã tồn tại chưa
4. Tạo user_profile với role tương ứng

### Quy tắc

- 1 email chỉ được 1 role (client hoặc worker)
- Admin là role đặc biệt, set từ backend
- Tài khoản banned không thể đăng nhập

## 🚧 Chưa hoàn thành

- [ ] Kết nối Supabase Authentication
- [ ] Implement Google OAuth flow
- [ ] User profile management
- [ ] Role-based routing & middleware
- [ ] Dashboard cho Client
- [ ] Dashboard cho Worker
- [ ] Admin panel

## 🛠️ Cài đặt & Chạy

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

## 📝 Environment Variables

Tạo file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎨 Design Tokens

```typescript
// Colors
Primary: '#FF385C'
Primary Hover: '#E61E4D'
Text Primary: '#222'
Text Secondary: '#717171'
Border: '#ddd'
Background: '#f7f7f7'

// Spacing
Button Height: 48px (default), 56px (large)
Border Radius: 8px (standard), 16px (cards), 28px (pills)

// Typography
Font Size: 14px (small), 16px (default), 18px (large)
Font Weight: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
```

## 📱 Responsive Breakpoints

```typescript
xs: < 576px
sm: ≥ 576px
md: ≥ 768px
lg: ≥ 992px
xl: ≥ 1200px
xxl: ≥ 1600px
```

## 🤝 Contributing

Dự án này đang trong giai đoạn phát triển. Vui lòng tham khảo `docs/auth.md` để hiểu rõ về authentication system.

## 📄 License

Private project - All rights reserved.
