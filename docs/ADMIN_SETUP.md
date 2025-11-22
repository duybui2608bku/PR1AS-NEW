# Admin Demo Account Setup

## Demo Admin Credentials

**IMPORTANT: This is a temporary demo account. Remove this before production!**

```
Email: admin@pr1as.com
Password: Admin@123456
```

## Setup Instructions

### Option 1: Manual Setup (Recommended for Demo)

1. Go to your application signup page: `http://localhost:3000/auth/signup`
2. Sign up with:

   - Email: `admin@pr1as.com`
   - Password: `Admin@123456`
   - Role: Any (will be overridden)

3. After signup, go to Supabase Dashboard:
   - Navigate to Authentication > Users
   - Find the user with email `admin@pr1as.com`
   - Click on the user
   - In "User Metadata" section, add:
     ```json
     {
       "role": "admin"
     }
     ```
   - Save

### Option 2: Using Supabase SQL Editor

Run this SQL in your Supabase SQL Editor:

```sql
-- Note: You'll need to sign up first, then update the metadata
-- Replace 'user-uuid-here' with the actual UUID of the created user

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@pr1as.com';
```

### Option 3: Using Supabase Auth Admin API

If you want to create the user programmatically (requires service role key):

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key
);

async function createAdminUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: "admin@pr1as.com",
    password: "Admin@123456",
    email_confirm: true,
    user_metadata: {
      role: "admin",
    },
  });

  if (error) {
    console.error("Error creating admin:", error);
  } else {
    console.log("Admin created:", data);
  }
}
```

## Accessing Admin Panel

After setting up the admin account:

1. Login at: `http://localhost:3000/auth/login`
2. Use the credentials above
3. Navigate to: `http://localhost:3000/admin`

## Security Notes

- **REMOVE THIS ACCOUNT BEFORE PRODUCTION**
- Change the password immediately in production
- Implement proper role-based access control
- Use environment variables for admin emails
- Add multi-factor authentication for admin accounts
- Implement audit logging for admin actions

## TODO: Production Setup

- [ ] Remove demo admin account
- [ ] Implement proper RBAC system
- [ ] Add admin user management interface
- [ ] Set up proper admin invitation system
- [ ] Add activity logging
- [ ] Implement 2FA for admin accounts
