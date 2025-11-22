# ✅ ADMIN API ROUTES - HOÀN TẤT

## 🎉 Tóm tắt

Đã tạo xong **API Routes cho Admin Panel** với architecture an toàn và RESTful.

---

## 📡 API Endpoints đã tạo

### 1. **User Management APIs**

#### `GET /api/admin/users`

- ✅ List tất cả users
- ✅ Sử dụng `auth.admin.listUsers()` an toàn ở server
- ✅ Require admin authentication

#### `PUT /api/admin/users/:id/ban`

- ✅ Ban user (100 years)
- ✅ Unban user
- ✅ Body: `{ action: "ban" | "unban" }`

#### `DELETE /api/admin/users/:id`

- ✅ Xóa user vĩnh viễn
- ✅ Admin authorization required

#### `PATCH /api/admin/users/:id`

- ✅ Update user metadata (role, name, etc.)
- ✅ Body: `{ user_metadata: {...} }`

---

### 2. **Dashboard Statistics API**

#### `GET /api/admin/stats`

- ✅ Thống kê dashboard
- ✅ Returns: `totalUsers`, `activeWorkers`, `totalJobs`, `revenue`
- ✅ Auto count users từ Supabase Auth
- ⚠️ Jobs & Revenue = 0 (chưa có tables)

---

### 3. **SEO Settings APIs**

#### `GET /api/admin/settings/seo`

- ✅ Public endpoint (không cần auth)
- ✅ Fetch SEO settings từ database
- ✅ Returns JSONB data

#### `POST /api/admin/settings/seo`

- ✅ Update SEO settings (admin only)
- ✅ Upsert logic (insert nếu chưa có, update nếu đã có)
- ✅ Body: `{ settings: {...} }`

---

## 🛠️ Files đã tạo

```
app/api/admin/
├── users/
│   ├── route.ts                    # GET /api/admin/users
│   └── [id]/
│       └── route.ts                # PUT, DELETE, PATCH /api/admin/users/:id
├── stats/
│   └── route.ts                    # GET /api/admin/stats
└── settings/
    └── seo/
        └── route.ts                # GET, POST /api/admin/settings/seo

lib/admin/
├── api-client.ts                   # Helper functions để gọi APIs
└── utils.ts                        # Utility functions (đã có)

docs/
└── ADMIN_API.md                    # API documentation đầy đủ
```

---

## 🔒 Security Features

### ✅ Server-side Authorization

```typescript
async function checkIsAdmin(authHeader: string | null): Promise<boolean> {
  // Verify token
  // Check user role
  // Return true/false
}
```

### ✅ Service Role Key Protection

- Service role key chỉ tồn tại trong environment variables
- Không bao giờ expose ra client
- Chỉ dùng trong API routes (server-side)

### ✅ Bearer Token Authentication

```typescript
Headers: {
  Authorization: `Bearer ${accessToken}`;
}
```

---

## 💻 Cách sử dụng

### Option 1: Sử dụng API Client (Khuyến nghị)

```typescript
import {
  adminUsersAPI,
  adminStatsAPI,
  adminSEOAPI,
} from "@/lib/admin/api-client";

// Users
const { users } = await adminUsersAPI.listUsers();
await adminUsersAPI.banUser(userId);
await adminUsersAPI.unbanUser(userId);
await adminUsersAPI.deleteUser(userId);
await adminUsersAPI.updateUser(userId, { role: "admin" });

// Stats
const stats = await adminStatsAPI.getStats();
console.log(stats.totalUsers, stats.activeWorkers);

// SEO
const settings = await adminSEOAPI.getSettings();
await adminSEOAPI.updateSettings(newSettings);
```

### Option 2: Fetch trực tiếp

```typescript
import { getSupabaseClient } from "@/lib/supabase/client";

const supabase = getSupabaseClient();
const {
  data: { session },
} = await supabase.auth.getSession();

const response = await fetch("/api/admin/users", {
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});

const data = await response.json();
```

---

## 🔄 Migration từ Client-side sang API Routes

### ❌ BEFORE (Không an toàn)

```typescript
// Trong component - KHÔNG NÊN
const { data, error } = await supabase.auth.admin.listUsers();
```

### ✅ AFTER (An toàn)

```typescript
// Gọi API route
import { adminUsersAPI } from "@/lib/admin/api-client";
const { users } = await adminUsersAPI.listUsers();
```

### Lợi ích:

- ✅ Service key an toàn ở server
- ✅ Centralized authorization
- ✅ Dễ thêm logging, rate limiting
- ✅ Better error handling
- ✅ Có thể cache responses

---

## 📊 API Response Examples

### Success Response

```json
{
  "users": [...],
  "message": "Success"
}
```

### Error Response

```json
{
  "error": "Unauthorized"
}
```

### HTTP Status Codes

- `200` - Success
- `403` - Forbidden (not admin)
- `500` - Server error

---

## 🧪 Testing

### Curl Examples

```bash
# Get access token
TOKEN="your-jwt-token"

# List users
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/users

# Get stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/stats

# Get SEO (public)
curl http://localhost:3000/api/admin/settings/seo

# Update SEO
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"settings":{"siteName":"New Name"}}' \
  http://localhost:3000/api/admin/settings/seo
```

---

## ⚠️ Lưu ý quan trọng

### Environment Variables

Cần có trong `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ KEEP SECRET!
```

### Service Role Key

- **KHÔNG BAO GIỜ** commit vào git
- **KHÔNG BAO GIỜ** expose ra client
- Chỉ dùng trong API routes (server-side)
- Get từ: Supabase Dashboard > Settings > API

### RLS Policies

- API routes bypass RLS (vì dùng service role)
- Vẫn cần check authorization trong code
- Client-side vẫn bị RLS áp dụng

---

## 📚 Documentation

Chi tiết đầy đủ xem trong: **`docs/ADMIN_API.md`**

Bao gồm:

- ✅ Request/Response schemas
- ✅ Authentication flow
- ✅ Error handling
- ✅ Code examples
- ✅ Testing guide
- ✅ Security best practices

---

## 🚀 Next Steps

### Để áp dụng vào components hiện tại:

1. **Update User Management page** (`app/admin/users/page.tsx`):

   ```typescript
   // Thay thế direct supabase calls
   import { adminUsersAPI } from "@/lib/admin/api-client";

   const fetchUsers = async () => {
     const { users } = await adminUsersAPI.listUsers();
     setUsers(users);
   };
   ```

2. **Update Dashboard page** (`app/admin/page.tsx`):

   ```typescript
   import { adminStatsAPI } from "@/lib/admin/api-client";

   const stats = await adminStatsAPI.getStats();
   ```

3. **Update SEO Settings** (`app/admin/seo/page.tsx`):

   ```typescript
   import { adminSEOAPI } from "@/lib/admin/api-client";

   const settings = await adminSEOAPI.getSettings();
   await adminSEOAPI.updateSettings(newSettings);
   ```

---

## ✅ Checklist

- [x] Tạo API routes cho Users
- [x] Tạo API routes cho Stats
- [x] Tạo API routes cho SEO Settings
- [x] Implement authorization checks
- [x] Tạo API client helpers
- [x] Viết documentation
- [ ] Update components để sử dụng APIs (tuỳ chọn)
- [ ] Add rate limiting (future)
- [ ] Add request logging (future)
- [ ] Add caching (future)

---

**Status:** ✅ **READY TO USE**

Tất cả API routes đã sẵn sàng và có thể sử dụng ngay!

---

**Created:** November 17, 2025  
**Version:** 1.0.0
