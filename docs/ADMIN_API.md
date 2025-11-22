# Admin API Routes Documentation

## 📋 Tổng quan

API routes cho admin panel được thiết kế để:

- ✅ Bảo mật với authentication & authorization checks
- ✅ Sử dụng service role key ở server-side (an toàn)
- ✅ Tách biệt logic khỏi client components
- ✅ RESTful design pattern

## 🔒 Authentication

Tất cả API routes (trừ GET SEO settings) yêu cầu:

- Bearer token trong Authorization header
- User phải có role = 'admin' hoặc email = 'admin@pr1as.com'

**Example:**

```typescript
const response = await fetch("/api/admin/users", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

## 📡 API Endpoints

### 1. Users Management

#### GET `/api/admin/users`

List tất cả users trong hệ thống.

**Request:**

```typescript
GET / api / admin / users;
Headers: {
  Authorization: Bearer<token>;
}
```

**Response:**

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2024-01-01T00:00:00Z",
      "user_metadata": {
        "role": "worker",
        "full_name": "John Doe"
      },
      "banned_until": null
    }
  ]
}
```

#### PUT `/api/admin/users/:id/ban`

Ban hoặc unban một user.

**Request:**

```typescript
PUT /api/admin/users/:id/ban
Headers: {
  Authorization: Bearer <token>,
  Content-Type: application/json
}
Body: {
  "action": "ban" | "unban"
}
```

**Response:**

```json
{
  "message": "User banned successfully"
}
```

#### DELETE `/api/admin/users/:id`

Xóa một user vĩnh viễn.

**Request:**

```typescript
DELETE /api/admin/users/:id
Headers: {
  Authorization: Bearer <token>
}
```

**Response:**

```json
{
  "message": "User deleted successfully"
}
```

#### PATCH `/api/admin/users/:id`

Cập nhật user metadata.

**Request:**

```typescript
PATCH /api/admin/users/:id
Headers: {
  Authorization: Bearer <token>,
  Content-Type: application/json
}
Body: {
  "user_metadata": {
    "role": "admin",
    "full_name": "Jane Doe"
  }
}
```

**Response:**

```json
{
  "message": "User updated successfully"
}
```

---

### 2. Dashboard Statistics

#### GET `/api/admin/stats`

Lấy thống kê cho dashboard.

**Request:**

```typescript
GET / api / admin / stats;
Headers: {
  Authorization: Bearer<token>;
}
```

**Response:**

```json
{
  "totalUsers": 1234,
  "activeWorkers": 456,
  "totalJobs": 0,
  "revenue": 0
}
```

**Note:** `totalJobs` và `revenue` hiện tại return 0. Cần implement khi có tables tương ứng.

---

### 3. SEO Settings

#### GET `/api/admin/settings/seo`

Lấy SEO settings (public endpoint).

**Request:**

```typescript
GET / api / admin / settings / seo;
```

**Response:**

```json
{
  "data": {
    "siteName": "PR1AS",
    "siteTitle": "PR1AS - Platform",
    "siteDescription": "Description...",
    "siteKeywords": "keyword1, keyword2",
    "ogImage": "https://...",
    "headerLogo": "/logo.png",
    "headerTagline": "Connect. Work. Succeed.",
    "headerContactPhone": "+84...",
    "headerContactEmail": "contact@pr1as.com",
    "footerCompanyName": "PR1AS Ltd.",
    "footerAddress": "123 Street...",
    "footerPhone": "+84...",
    "footerEmail": "info@pr1as.com",
    "footerCopyright": "© 2024 PR1AS",
    "footerAbout": "About text...",
    "facebookUrl": "https://facebook.com/...",
    "twitterUrl": "https://twitter.com/...",
    "instagramUrl": "https://instagram.com/...",
    "linkedinUrl": "https://linkedin.com/..."
  }
}
```

#### POST `/api/admin/settings/seo`

Cập nhật SEO settings (admin only).

**Request:**

```typescript
POST /api/admin/settings/seo
Headers: {
  Authorization: Bearer <token>,
  Content-Type: application/json
}
Body: {
  "settings": {
    "siteName": "PR1AS",
    "siteTitle": "New Title",
    // ... other fields
  }
}
```

**Response:**

```json
{
  "message": "Settings saved successfully"
}
```

---

## 🛠️ Cách sử dụng trong Components

### Option 1: Sử dụng API Client Helper

```typescript
import {
  adminUsersAPI,
  adminStatsAPI,
  adminSEOAPI,
} from "@/lib/admin/api-client";

// List users
const { users } = await adminUsersAPI.listUsers();

// Ban user
await adminUsersAPI.banUser(userId);

// Get stats
const stats = await adminStatsAPI.getStats();

// Get SEO settings
const settings = await adminSEOAPI.getSettings();

// Update SEO settings
await adminSEOAPI.updateSettings(newSettings);
```

### Option 2: Gọi trực tiếp

```typescript
import { getSupabaseClient } from "@/lib/supabase/client";

async function fetchUsers() {
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
  return data.users;
}
```

---

## 🔐 Security Features

### Server-side Authorization

- Mọi admin operations đều check quyền ở server
- Service role key chỉ tồn tại ở server-side
- Client không bao giờ thấy service role key

### Token Validation

```typescript
async function checkIsAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);

  if (!user) return false;

  return (
    user.email === "admin@pr1as.com" || user.user_metadata?.role === "admin"
  );
}
```

### Error Handling

Tất cả endpoints return proper HTTP status codes:

- `200` - Success
- `403` - Unauthorized (not admin)
- `500` - Server error

---

## 📊 Database Schema Requirements

### site_settings table

```sql
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Future tables (for full stats)

```sql
-- Jobs table (TODO)
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  title TEXT,
  status TEXT,
  created_at TIMESTAMP
);

-- Transactions table (TODO)
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  amount DECIMAL,
  created_at TIMESTAMP
);
```

---

## 🧪 Testing APIs

### Using curl

```bash
# Get access token first
TOKEN="your-access-token"

# List users
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/users

# Ban user
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"ban"}' \
  http://localhost:3000/api/admin/users/USER_ID/ban

# Get stats
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/admin/stats

# Get SEO settings (public)
curl http://localhost:3000/api/admin/settings/seo

# Update SEO settings
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"settings":{"siteName":"New Name"}}' \
  http://localhost:3000/api/admin/settings/seo
```

### Using Postman/Insomnia

1. Create new request
2. Set method (GET/POST/PUT/DELETE)
3. Add Authorization header: `Bearer <token>`
4. For POST/PUT: Set Content-Type: `application/json`
5. Add request body if needed

---

## 🚀 Migration Guide

### Updating existing components to use API routes

**Before (Direct Supabase):**

```typescript
const { data, error } = await supabase.auth.admin.listUsers();
```

**After (API Route):**

```typescript
import { adminUsersAPI } from "@/lib/admin/api-client";
const { users } = await adminUsersAPI.listUsers();
```

### Benefits

- ✅ More secure (service key on server)
- ✅ Centralized authorization logic
- ✅ Easier to add middleware/logging
- ✅ Better error handling
- ✅ Can add rate limiting

---

## 📝 TODO

- [ ] Implement jobs statistics
- [ ] Implement revenue statistics
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Add caching for stats
- [ ] Implement pagination for users list
- [ ] Add filtering/sorting params
- [ ] Create webhooks for user events

---

**Version:** 1.0.0  
**Last Updated:** November 17, 2025
