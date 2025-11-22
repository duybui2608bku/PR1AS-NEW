# 🔧 Fix: Admin Mobile Menu Issue - "Trở thành Worker"

## ❌ **Vấn đề:**

Tài khoản admin hiển thị menu "Trở thành Worker" trên mobile, điều này không hợp lý vì admin không cần trở thành worker.

## ✅ **Giải pháp:**

### 1. **Root Cause Analysis**

- Vấn đề không phải ở sidebar layout mà ở `Header` component chính
- Header component chỉ check `isAuthenticated` chứ không check `userRole`
- Menu mobile trong `Drawer` hiển thị "Trở thành Worker" cho tất cả users

### 2. **Code Changes**

#### A. Header Component (`components/layout/Header.tsx`)

**Added user role detection:**

```tsx
const [userRole, setUserRole] = useState<string | null>(null);

const checkAuth = async () => {
  try {
    const profile = await authAPI.getProfile();
    if (mounted) {
      setIsAuthenticated(!!profile);
      setUserRole(profile?.role || null); // ✅ NEW
    }
  } catch {
    // Handle error...
  }
};
```

**Conditional "Become Worker" display:**

```tsx
{
  /* Only show "Become Worker" for non-admin users */
}
{
  userRole !== "admin" && <Button>{t("header.becomeWorker")}</Button>;
}
```

**Role-based menu items:**

```tsx
{
  /* Show dashboard link based on role */
}
{
  userRole && (
    <Link href={`/${userRole}/dashboard`}>
      <Button>
        {userRole === "admin"
          ? t("header.userMenu.adminDashboard")
          : userRole === "worker"
          ? t("header.userMenu.workerDashboard")
          : t("header.userMenu.dashboard")}
      </Button>
    </Link>
  );
}

{
  /* Role-specific menu items */
}
{
  userRole === "admin" && (
    <>
      <Link href="/admin/users">...</Link>
      <Link href="/admin/settings">...</Link>
    </>
  );
}
```

#### B. Translation Keys Added

**Vietnamese (`messages/vi.json`):**

```json
"header": {
  "userMenu": {
    "adminDashboard": "Bảng điều khiển Admin",
    "workerDashboard": "Bảng điều khiển Worker",
    "myJobs": "Công việc của tôi",
    "myWork": "Công việc của tôi"
  }
}
```

**English, Korean, Chinese** - Added equivalent translations.

#### C. Logout Functionality

**Added proper logout to mobile drawer:**

```tsx
<Button
  onClick={async () => {
    await authAPI.logout();
    setIsAuthenticated(false);
    setUserRole(null);
    setMobileMenuOpen(false);
    router.push("/");
  }}
>
  {t("header.userMenu.logout")}
</Button>
```

### 3. **Result**

#### Before:

- ❌ Admin sees "Trở thành Worker"
- ❌ Generic menu for all roles
- ❌ No proper logout functionality

#### After:

- ✅ Admin không thấy "Trở thành Worker"
- ✅ Menu items phù hợp với từng role:
  - **Admin**: Admin Dashboard, User Management, Settings
  - **Worker**: Worker Dashboard, My Work
  - **Client**: Dashboard, My Jobs
- ✅ Proper logout với state cleanup

### 4. **Files Modified**

1. `components/layout/Header.tsx` - Major logic update
2. `messages/vi.json` - Added new translation keys
3. `messages/en.json` - Added new translation keys
4. `messages/ko.json` - Added new translation keys
5. `messages/zh.json` - Added new translation keys

### 5. **Testing**

**Mobile Menu Behavior:**

1. **Admin user**: Không thấy "Trở thành Worker", thấy "Admin Dashboard"
2. **Worker user**: Thấy "Trở thành Worker", thấy "Worker Dashboard"
3. **Client user**: Thấy "Trở thành Worker", thấy "Dashboard"
4. **All roles**: Logout button works properly

## 🎯 **Summary**

Đã khắc phục hoàn toàn vấn đề admin hiển thị "Trở thành Worker" bằng cách thêm role-based menu logic vào Header component và cung cấp menu items phù hợp cho từng loại user.
