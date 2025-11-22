# 📁 API STRUCTURE - PR1AS Platform

## 🏗️ Tổng quan cấu trúc API

Dự án PR1AS đã được tổ chức lại với cấu trúc API rõ ràng, khoa học và dễ bảo trì.

---

## 📂 Cấu trúc thư mục API

```
app/api/
├── auth/                        # 🔐 Authentication APIs
│   ├── signup/route.ts          # Đăng ký email/password
│   ├── signup-oauth/route.ts    # Khởi tạo OAuth signup
│   ├── login/route.ts           # Đăng nhập
│   ├── logout/route.ts          # Đăng xuất
│   ├── callback/route.ts        # OAuth callback handler
│   ├── profile/route.ts         # Quản lý profile
│   └── create-profile/route.ts  # Tạo profile sau OAuth
│
├── admin/                       # 👑 Admin Management APIs
│   ├── users/
│   │   ├── route.ts             # List users
│   │   └── [id]/route.ts        # User operations (ban/delete/update)
│   ├── stats/route.ts           # Dashboard statistics
│   └── settings/
│       └── seo/route.ts         # SEO settings
│
├── client/                      # 👤 Client APIs (future)
│   └── [to be implemented]
│
└── worker/                      # 💼 Worker APIs (future)
    └── [to be implemented]
```

---

## 🎯 Nguyên tắc tổ chức

### 1. **Phân chia theo vai trò (Role-based)**

Mỗi thư mục tương ứng với một vai trò trong hệ thống:
- `auth/` - Xác thực và phân quyền
- `admin/` - Quản trị viên
- `client/` - Người thuê dịch vụ
- `worker/` - Người cung cấp dịch vụ

### 2. **RESTful naming**

- Sử dụng danh từ số nhiều cho resources: `/users`, `/stats`
- Sử dụng HTTP methods chuẩn: GET, POST, PUT, PATCH, DELETE
- Nested routes cho sub-resources: `/users/[id]`

### 3. **Consistent structure**

Mỗi route file tuân theo pattern:
```typescript
// 1. Imports
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// 2. Constants & initialization
const supabaseAdmin = createClient(...);

// 3. Helper functions
async function checkAuth() { ... }

// 4. HTTP method handlers
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
```

---

## 🔐 Authentication & Authorization

### Middleware (`middleware.ts`)

Tự động bảo vệ routes dựa trên role:

```typescript
Route Pattern              Required Role      Redirect if Wrong
──────────────────────────────────────────────────────────────
/admin/**                  admin             → User's dashboard
/client/**                 client            → User's dashboard
/worker/**                 worker            → User's dashboard
/login, /signup            public            → Dashboard if logged in
Any protected route        authenticated     → /login
```

### API Authentication

Sử dụng Bearer token trong header:

```typescript
Authorization: Bearer <supabase_jwt_token>
```

Helper để check auth:

```typescript
// Client-side
import { authAPI } from '@/lib/auth/api-client';
const profile = await authAPI.getProfile();

// Server-side
import { getUserProfile, isAdmin } from '@/lib/auth/helpers';
const profile = await getUserProfile(token);
```

---

## 📡 API Categories

### 🔐 Authentication APIs (`/api/auth`)

**Purpose:** Xác thực người dùng, quản lý session, phân quyền

**Endpoints:**
- `POST /api/auth/signup` - Đăng ký email/password
- `POST /api/auth/signup-oauth` - Chuẩn bị OAuth signup
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/callback` - Xử lý OAuth callback
- `GET /api/auth/profile` - Lấy profile
- `PATCH /api/auth/profile` - Cập nhật profile
- `POST /api/auth/create-profile` - Tạo profile

**Security:**
- JWT tokens via Supabase Auth
- RLS policies on user_profiles table
- Role-based access control
- Banned user detection

**Documentation:** `docs/AUTH_API.md`

---

### 👑 Admin APIs (`/api/admin`)

**Purpose:** Quản trị hệ thống, users, settings

**Endpoints:**

**User Management:**
- `GET /api/admin/users` - Danh sách users
- `PUT /api/admin/users/[id]/ban` - Ban/unban user
- `DELETE /api/admin/users/[id]` - Xóa user
- `PATCH /api/admin/users/[id]` - Cập nhật user metadata

**Dashboard:**
- `GET /api/admin/stats` - Thống kê tổng quan

**Settings:**
- `GET /api/admin/settings/seo` - Lấy SEO settings
- `POST /api/admin/settings/seo` - Cập nhật SEO settings

**Security:**
- Requires admin role
- Checks via `user_metadata.role === 'admin'` hoặc `email === 'admin@pr1as.com'`

**Documentation:** `docs/ADMIN_API.md`

---

### 👤 Client APIs (`/api/client`) - Future

**Purpose:** Chức năng cho người thuê dịch vụ

**Planned endpoints:**
- Tìm kiếm workers
- Đặt dịch vụ
- Quản lý bookings
- Payment
- Reviews

---

### 💼 Worker APIs (`/api/worker`) - Future

**Purpose:** Chức năng cho người cung cấp dịch vụ

**Planned endpoints:**
- Quản lý services
- Nhận bookings
- Cập nhật availability
- Earnings tracking
- Reviews

---

## 🗄️ Database Structure

### Tables

```
auth.users                      # Supabase Auth (built-in)
├── id (UUID)
├── email
└── user_metadata

public.user_profiles            # Custom user profiles
├── id → auth.users(id)
├── email
├── role (client|worker|admin)
├── status (active|banned)
├── created_at
└── updated_at

public.site_settings            # Site configuration
├── id
├── key
├── value (JSONB)
├── created_at
└── updated_at
```

### Migrations

Located in `supabase/migrations/`:
- `create_site_settings.sql` - Site settings table
- `create_user_profiles.sql` - User profiles table

---

## 🛠️ Helper Libraries

### Client-side (`lib/auth/api-client.ts`)

```typescript
import { authAPI, redirectByRole, hasRole } from '@/lib/auth/api-client';

// Auth operations
await authAPI.signUp(email, password, role);
await authAPI.login(email, password);
await authAPI.logout();
const profile = await authAPI.getProfile();

// Helpers
const dashboardUrl = redirectByRole(user.role);
const isAllowed = hasRole(user.role, ['admin', 'worker']);
```

### Server-side (`lib/auth/helpers.ts`)

```typescript
import { getUserProfile, isAdmin, hasRole } from '@/lib/auth/helpers';

const profile = await getUserProfile(token);
const admin = await isAdmin(token);
const allowed = await hasRole(token, 'client');
```

### Admin Client (`lib/admin/api-client.ts`)

```typescript
import { adminUsersAPI, adminStatsAPI, adminSEOAPI } from '@/lib/admin/api-client';

const { users } = await adminUsersAPI.listUsers();
await adminUsersAPI.banUser(userId);
const stats = await adminStatsAPI.getStats();
```

---

## 🔒 Security Best Practices

### 1. **Environment Variables**

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     # NEVER expose to client!
```

### 2. **RLS Policies**

All tables have Row-Level Security enabled:
- Users can only read/update their own data
- Admins have full access
- Public read for certain tables (e.g., site_settings)

### 3. **Token Validation**

Every protected API:
```typescript
// 1. Get token from header
const authHeader = request.headers.get("authorization");
const token = authHeader.replace("Bearer ", "");

// 2. Validate with Supabase
const { data: { user } } = await supabase.auth.getUser(token);

// 3. Check role & status
const profile = await getUserProfile(user.id);
if (profile.status === 'banned') { /* reject */ }
```

### 4. **Error Handling**

Consistent error format:
```json
{
  "error": "ERROR_CODE",
  "message": "User-friendly message"
}
```

---

## 📊 API Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "error": "ERROR_CODE",
  "message": "Error description",
  "details": { ... }  // Optional
}
```

### List Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

## 🧪 Testing APIs

### Using curl

```bash
# Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","role":"client"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (authenticated)
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using fetch (client-side)

```typescript
// Use the helper libraries
import { authAPI } from '@/lib/auth/api-client';

try {
  const result = await authAPI.login('user@example.com', 'password');
  console.log('Logged in:', result.user);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

---

## 📖 Documentation Index

- `AUTH_API_COMPLETE.md` - Auth system summary
- `docs/AUTH_API.md` - Full auth API documentation
- `docs/auth.md` - Original requirements
- `docs/ADMIN_API.md` - Admin API documentation (if exists)
- `API_COMPLETE.md` - Admin API summary
- `API_STRUCTURE.md` - This file

---

## 🚀 Next Steps

### Immediate
1. ✅ Implement auth system - **DONE**
2. ✅ Set up middleware - **DONE**
3. ✅ Create migrations - **DONE**

### Short-term
1. Implement client dashboard & APIs
2. Implement worker dashboard & APIs
3. Add email verification
4. Add password reset

### Long-term
1. Two-factor authentication
2. Session management across devices
3. OAuth with more providers
4. API rate limiting
5. API versioning

---

**Last Updated:** Nov 17, 2025
**Maintainer:** Development Team
**Status:** ✅ In active development
