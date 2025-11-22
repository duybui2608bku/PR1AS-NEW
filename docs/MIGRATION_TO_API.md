# 🔄 Migration Guide: Cập nhật Components sử dụng API Routes

## 📋 Tổng quan

Hiện tại components đang gọi **trực tiếp Supabase** (không an toàn với service role).  
Cần migrate sang sử dụng **API Routes** đã tạo.

---

## ⚠️ Vấn đề hiện tại

### File: `app/admin/users/page.tsx`

❌ **Đang làm (KHÔNG AN TOÀN):**

```typescript
const { data, error } = await supabase.auth.admin.listUsers();
```

**Vấn đề:**

- Cần service role key ở client (không an toàn)
- Hoặc API sẽ fail vì không có quyền

---

## ✅ Giải pháp

### Option 1: Giữ nguyên code hiện tại

**Nếu bạn muốn giữ code hiện tại:**

- Đảm bảo RLS policies đúng
- Chấp nhận giới hạn (không thể dùng admin APIs)
- SEO settings vẫn hoạt động ok (vì dùng RLS)

### Option 2: Migrate sang API Routes (Khuyến nghị)

**Cập nhật để sử dụng API routes an toàn hơn**

---

## 🔧 Cách migrate

### 1. User Management Page

**File:** `app/admin/users/page.tsx`

**Thay thế:**

```typescript
// ❌ OLD
const fetchUsers = async () => {
  setLoading(true);
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    setUsers(data.users as unknown as User[]);
  } catch (error) {
    console.error("Error fetching users:", error);
    message.error("Failed to load users");
  } finally {
    setLoading(false);
  }
};

// ✅ NEW
import { adminUsersAPI } from "@/lib/admin/api-client";

const fetchUsers = async () => {
  setLoading(true);
  try {
    const { users } = await adminUsersAPI.listUsers();
    setUsers(users as unknown as User[]);
  } catch (error) {
    console.error("Error fetching users:", error);
    message.error("Failed to load users");
  } finally {
    setLoading(false);
  }
};
```

**Ban user:**

```typescript
// ❌ OLD
const { error } = await supabase.auth.admin.updateUserById(userId, {
  ban_duration: "876000h",
});

// ✅ NEW
await adminUsersAPI.banUser(userId);
```

**Unban user:**

```typescript
// ❌ OLD
const { error } = await supabase.auth.admin.updateUserById(userId, {
  ban_duration: "none",
});

// ✅ NEW
await adminUsersAPI.unbanUser(userId);
```

**Delete user:**

```typescript
// ❌ OLD
const { error } = await supabase.auth.admin.deleteUser(userId);

// ✅ NEW
await adminUsersAPI.deleteUser(userId);
```

---

### 2. Dashboard Page

**File:** `app/admin/page.tsx`

**Thay thế:**

```typescript
// ❌ OLD (hardcoded stats)
<Statistic title="Total Users" value={1234} />;

// ✅ NEW (real stats from API)
import { adminStatsAPI } from "@/lib/admin/api-client";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeWorkers: 0,
    totalJobs: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminStatsAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        {/* ... other stats */}
      </Row>
    </div>
  );
}
```

---

### 3. SEO Settings Page

**File:** `app/admin/seo/page.tsx`

**Option A: Giữ nguyên** (vì đang dùng RLS, hoạt động ok)

**Option B: Migrate sang API** (để consistent):

```typescript
// ❌ OLD
const fetchSettings = useCallback(async () => {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("key", "seo_settings")
      .single();

    if (data?.value) {
      form.setFieldsValue(data.value);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}, [form, supabase]);

// ✅ NEW
import { adminSEOAPI } from "@/lib/admin/api-client";

const fetchSettings = useCallback(async () => {
  try {
    const data = await adminSEOAPI.getSettings();
    if (data) {
      form.setFieldsValue(data);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}, [form]);
```

**Save settings:**

```typescript
// ❌ OLD
const handleSave = async (values: SEOSettings) => {
  const { error: updateError } = await supabase
    .from("site_settings")
    .update({ value: values })
    .eq("key", "seo_settings");

  // ... insert logic
};

// ✅ NEW
const handleSave = async (values: SEOSettings) => {
  try {
    await adminSEOAPI.updateSettings(values);
    message.success("Saved successfully!");
  } catch (error) {
    message.error("Failed to save");
  }
};
```

---

## 📝 Full Example: Updated Users Page

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { Table, Card, Typography, message } from "antd";
import { adminUsersAPI } from "@/lib/admin/api-client";

const { Title } = Typography;

interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    role?: string;
    full_name?: string;
  };
  banned_until?: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { users } = await adminUsersAPI.listUsers();
      setUsers(users as unknown as User[]);
    } catch (error) {
      console.error("Error:", error);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBanUser = async (userId: string) => {
    try {
      await adminUsersAPI.banUser(userId);
      message.success("User banned");
      fetchUsers(); // Refresh
    } catch (error) {
      message.error("Failed to ban user");
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await adminUsersAPI.unbanUser(userId);
      message.success("User unbanned");
      fetchUsers();
    } catch (error) {
      message.error("Failed to unban user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminUsersAPI.deleteUser(userId);
      message.success("User deleted");
      fetchUsers();
    } catch (error) {
      message.error("Failed to delete user");
    }
  };

  return (
    <div>
      <Title level={2}>User Management</Title>
      <Card>
        <Table
          dataSource={users}
          loading={loading}
          rowKey="id"
          // ... columns
        />
      </Card>
    </div>
  );
}
```

---

## 🧪 Testing after Migration

### 1. Test User Management

```bash
# Start dev server
npm run dev

# Login as admin
# Go to http://localhost:3000/admin/users

# Check browser console - should see API calls:
# GET /api/admin/users
# PUT /api/admin/users/:id/ban
# etc.
```

### 2. Test Dashboard

```bash
# Go to http://localhost:3000/admin
# Stats should load from API
# Check Network tab - should see:
# GET /api/admin/stats
```

### 3. Test SEO Settings

```bash
# Go to http://localhost:3000/admin/seo
# Update settings
# Check Network tab - should see:
# GET /api/admin/settings/seo
# POST /api/admin/settings/seo
```

---

## ✅ Benefits sau khi migrate

- ✅ **An toàn hơn** - Service key không expose ra client
- ✅ **Dễ maintain** - Logic tập trung ở API routes
- ✅ **Dễ test** - Test API routes độc lập
- ✅ **Dễ thêm features** - Logging, rate limiting, caching
- ✅ **Better error handling** - Centralized error responses

---

## 📚 Tài liệu tham khảo

- API Client: `lib/admin/api-client.ts`
- API Routes: `app/api/admin/**/*.ts`
- Full Docs: `docs/ADMIN_API.md`

---

## 🎯 Recommendation

**Khuyến nghị:**

1. ✅ Migrate User Management ngay (vì dùng admin APIs)
2. ⚠️ SEO Settings có thể để sau (vì RLS hoạt động ok)
3. ✅ Dashboard nên migrate để có real stats

**Ưu tiên:**

1. User Management (HIGH - cần service role)
2. Dashboard (MEDIUM - để có real data)
3. SEO Settings (LOW - đang hoạt động)

---

**Next:** Chọn file muốn cập nhật và bắt đầu migrate!
