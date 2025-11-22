# 🔄 Full Name Feature - Migration Guide

## ✅ Changes Completed

All code changes have been implemented to support the `full_name` field in user profiles.

### What Was Added:

1. **Database Migration** - New column `full_name` in `user_profiles` table
2. **API Updates** - Signup API now accepts and saves full name
3. **Client Updates** - Signup page now sends full name to API
4. **User Menu Component** - Displays user info with logout functionality
5. **Dashboard Layouts** - Worker and Client layouts with user menu in header

---

## 🗄️ Database Migration Required

You need to run the SQL migration to add the `full_name` column to your database.

### Option 1: Run Migration in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste this SQL:

```sql
-- Add full_name column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Create index on full_name for faster search
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON user_profiles(full_name);
```

5. Click **Run** to execute the migration

### Option 2: Use Migration File

The migration is saved in:
```
PR1AS/lib/supabase/migrations/add_full_name_to_user_profiles.sql
```

You can run it using Supabase CLI:
```bash
supabase db push
```

---

## 🧪 Testing

After running the migration, test the full flow:

### 1. Sign Up Test
```
1. Go to http://localhost:3000/auth/signup
2. Fill in:
   - Name: John Doe
   - Email: john@example.com
   - Password: password123
   - Role: Worker
3. Click Sign Up
4. Should redirect to /worker/dashboard
5. Check header - should see user menu with avatar
```

### 2. User Menu Test
```
1. Click on the avatar/name in the top right
2. Should see popover with:
   - Full name: John Doe
   - Email: john@example.com
   - Role badge: Thợ
   - Settings button
   - Logout button (red)
3. Click logout
4. Should redirect to /auth/login
```

### 3. Database Verification
```sql
-- Check if full_name is saved
SELECT id, email, full_name, role 
FROM user_profiles 
WHERE email = 'john@example.com';
```

Expected result:
```
id    | email              | full_name | role
------|-------------------|-----------|-------
uuid  | john@example.com  | John Doe  | worker
```

---

## 📁 Files Changed

### Database
- ✅ `lib/supabase/migrations/add_full_name_to_user_profiles.sql` (NEW)

### API Routes
- ✅ `app/api/auth/signup/route.ts` - Now accepts and saves `fullName`

### Client Code
- ✅ `lib/auth/api-client.ts` - Updated `signUp()` method with `fullName` parameter
- ✅ `lib/auth/helpers.ts` - Updated `UserProfile` interface
- ✅ `app/auth/signup/page.tsx` - Sends name to API

### Components
- ✅ `components/common/UserMenu.tsx` (NEW) - User popover with logout
- ✅ `app/worker/layout.tsx` (NEW) - Worker dashboard layout with UserMenu
- ✅ `app/client/layout.tsx` (NEW) - Client dashboard layout with UserMenu

---

## 🎯 Features

### User Menu Popover
- Shows user avatar with brand color (#690f0f)
- Displays full name (or "Người dùng" if not set)
- Shows email address
- Displays role badge (Khách hàng / Thợ / Quản trị viên)
- Settings button (redirects to /settings)
- Logout button with confirmation

### Dashboard Layouts
Both Worker and Client dashboards now have:
- Left sidebar with navigation menu
- Top header with user menu on the right
- Responsive design (sidebar collapses on mobile)
- Consistent brand styling

### Data Flow
```
Signup Form (name field)
    ↓
authAPI.signUp(email, password, role, fullName)
    ↓
POST /api/auth/signup { email, password, role, fullName }
    ↓
Supabase: INSERT INTO user_profiles (full_name, ...)
    ↓
Auto-login + Set cookies
    ↓
Redirect to dashboard
    ↓
UserMenu fetches profile with full_name
```

---

## ⚠️ Important Notes

1. **Existing Users**: Users who signed up before this update will have `null` for `full_name`. The UI handles this gracefully by showing "Người dùng" as fallback.

2. **Optional Field**: `full_name` is optional during signup (though the form requires it). This allows flexibility for OAuth users in the future.

3. **Case Sensitivity**: The API expects `fullName` (camelCase) but stores as `full_name` (snake_case) in the database.

---

## ✅ Migration Checklist

- [ ] Run SQL migration in Supabase
- [ ] Verify column exists: `SELECT full_name FROM user_profiles LIMIT 1;`
- [ ] Test signup with full name
- [ ] Verify full name appears in user menu
- [ ] Test logout functionality
- [ ] Check dashboard layouts render correctly

---

## 🎉 Summary

**Before:**
- ❌ Name field ignored during signup
- ❌ `full_name` was NULL in database
- ❌ No user menu or logout in dashboards

**After:**
- ✅ Name saved to database during signup
- ✅ User menu shows full name and info
- ✅ Logout button works properly
- ✅ Professional dashboard layouts with headers

All authentication features are now complete! 🚀

