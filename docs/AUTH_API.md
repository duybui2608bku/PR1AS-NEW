# 🔐 AUTHENTICATION API DOCUMENTATION

## Overview

Complete authentication system for the PR1AS platform with role-based access control (RBAC).

**Supported Roles:**
- `client` - Users who hire services
- `worker` - Service providers
- `admin` - System administrators

**Key Features:**
- Email/Password authentication
- Google OAuth authentication
- Role-based route protection
- Banned user detection
- One email per role enforcement

---

## 📡 API Endpoints

### 1. Sign Up (Email/Password)

**Endpoint:** `POST /api/auth/signup`

**Description:** Register a new user with email and password

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "client" // or "worker"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client"
  }
}
```

**Error Responses:**

**400 - Bad Request:**
```json
{
  "error": "Email, password, and role are required"
}
```

**409 - Email Already Exists:**
```json
{
  "error": "EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE",
  "message": "Email này đã được đăng ký với vai trò WORKER...",
  "existingRole": "worker"
}
```

**403 - Account Banned:**
```json
{
  "error": "ACCOUNT_BANNED",
  "message": "Tài khoản này đã bị khóa"
}
```

---

### 2. Sign Up (OAuth)

**Endpoint:** `POST /api/auth/signup-oauth`

**Description:** Initiate OAuth signup flow with role selection

**Request Body:**
```json
{
  "role": "client", // or "worker"
  "provider": "google",
  "redirectTo": "https://yourapp.com/auth/callback" // optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "provider": "google",
  "role": "client",
  "callbackUrl": "https://yourapp.com/auth/callback?role=client",
  "message": "Use Supabase client to call signInWithOAuth on the frontend"
}
```

**Usage Example:**
```typescript
import { authAPI } from '@/lib/auth/api-client';

// Use the helper method
await authAPI.signInWithGoogle('client');
```

---

### 3. Login (Email/Password)

**Endpoint:** `POST /api/auth/login`

**Description:** Login with email and password

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client",
    "status": "active"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

**Error Responses:**

**401 - Invalid Credentials:**
```json
{
  "error": "Invalid email or password"
}
```

**404 - No Profile:**
```json
{
  "error": "NO_PROFILE",
  "message": "Email này chưa có tài khoản. Vui lòng đăng ký.",
  "userId": "uuid",
  "email": "user@example.com"
}
```

**403 - Account Banned:**
```json
{
  "error": "ACCOUNT_BANNED",
  "message": "Tài khoản này đã bị khóa"
}
```

---

### 4. Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Logout user (client-side via Supabase)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Usage:**
```typescript
import { authAPI } from '@/lib/auth/api-client';

await authAPI.logout(); // Handles both client and server logout
```

---

### 5. OAuth Callback Handler

**Endpoint:** `POST /api/auth/callback`

**Description:** Process OAuth callback and create/verify profile

**Request Body:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "client" // optional for new users
}
```

**Success Response - New Profile (200):**
```json
{
  "success": true,
  "created": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client",
    "status": "active"
  }
}
```

**Success Response - Existing Profile (200):**
```json
{
  "success": true,
  "created": false,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "worker",
    "status": "active"
  }
}
```

**Error Responses:**

**404 - No Profile, Role Required:**
```json
{
  "error": "NO_PROFILE_NO_ROLE",
  "message": "Email này chưa có tài khoản. Bạn muốn đăng ký Client hay Worker?",
  "userId": "uuid",
  "email": "user@example.com"
}
```

**409 - Role Conflict:**
```json
{
  "error": "EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE",
  "message": "Email này đã được đăng ký với vai trò WORKER...",
  "existingRole": "worker"
}
```

---

### 6. Get Profile

**Endpoint:** `GET /api/auth/profile`

**Description:** Get current user's profile

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**

**401 - Unauthorized:**
```json
{
  "error": "Authorization header required"
}
```

**404 - No Profile:**
```json
{
  "error": "NO_PROFILE",
  "message": "Profile not found",
  "userId": "uuid",
  "email": "user@example.com"
}
```

**403 - Account Banned:**
```json
{
  "error": "ACCOUNT_BANNED",
  "message": "Tài khoản này đã bị khóa"
}
```

---

### 7. Create Profile

**Endpoint:** `POST /api/auth/create-profile`

**Description:** Create profile for authenticated user (after OAuth)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "role": "client" // or "worker"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "client",
    "status": "active"
  }
}
```

**Error Responses:**

**409 - Profile Already Exists:**
```json
{
  "error": "PROFILE_ALREADY_EXISTS",
  "message": "Profile already exists",
  "role": "worker"
}
```

**409 - Role Conflict:**
```json
{
  "error": "EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE",
  "message": "Email này đã được đăng ký với vai trò WORKER...",
  "existingRole": "worker"
}
```

---

## 🔧 Client Library Usage

### Installation

The auth client is available at `@/lib/auth/api-client`:

```typescript
import { authAPI, redirectByRole, hasRole } from '@/lib/auth/api-client';
```

### Examples

#### 1. Sign Up with Email/Password

```typescript
try {
  const result = await authAPI.signUp(
    'user@example.com',
    'password123',
    'client'
  );

  console.log('User created:', result.user);

  // Redirect to dashboard
  window.location.href = redirectByRole(result.user.role);
} catch (error) {
  console.error('Sign up failed:', error.message);
}
```

#### 2. Sign In with Google

```typescript
try {
  await authAPI.signInWithGoogle('worker');
  // User will be redirected to Google OAuth
} catch (error) {
  console.error('OAuth failed:', error.message);
}
```

#### 3. Login

```typescript
try {
  const result = await authAPI.login('user@example.com', 'password123');

  // Store session if needed
  console.log('Logged in:', result.user);

  // Redirect based on role
  window.location.href = redirectByRole(result.user.role);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

#### 4. Get Current User Profile

```typescript
try {
  const profile = await authAPI.getProfile();

  console.log('User role:', profile.role);
  console.log('User status:', profile.status);
} catch (error) {
  if (error.message.includes('ACCOUNT_BANNED')) {
    // User will be redirected to /banned automatically
  }
}
```

#### 5. Logout

```typescript
try {
  await authAPI.logout();
  window.location.href = '/login';
} catch (error) {
  console.error('Logout failed:', error.message);
}
```

#### 6. Check Role

```typescript
const profile = await authAPI.getProfile();

if (hasRole(profile.role, 'admin')) {
  console.log('User is admin');
}

if (hasRole(profile.role, ['client', 'worker'])) {
  console.log('User is client or worker');
}
```

---

## 🛡️ Middleware & Route Protection

The middleware automatically protects routes based on patterns:

### Protected Routes

- `/admin/**` - Admin only
- `/client/**` - Client only
- `/worker/**` - Worker only

### Public Routes

- `/` - Home page
- `/login` - Login page
- `/signup` - Signup page
- `/banned` - Banned user page

### Behavior

1. **Accessing protected route without auth** → Redirect to `/login?redirect=<path>`
2. **Accessing wrong role route** → Redirect to user's dashboard
3. **Accessing auth pages while logged in** → Redirect to dashboard
4. **Banned user accessing any page** → Redirect to `/banned`

### Example Flow

```
User (worker role) tries to access /client/dashboard
  ↓
Middleware checks: user.role === 'client'? NO
  ↓
Redirect to /worker/dashboard
```

---

## 🗄️ Database Schema

### Table: `user_profiles`

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'worker', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Constraints:**
- One email per role (except admin)
- Email cannot be reused for different roles
- Automatic `updated_at` trigger

---

## 🚨 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `EMAIL_ALREADY_REGISTERED_WITH_DIFFERENT_ROLE` | Email registered with different role | 409 |
| `ACCOUNT_BANNED` | User account is banned | 403 |
| `NO_PROFILE` | User has no profile | 404 |
| `NO_PROFILE_NO_ROLE` | OAuth user needs to select role | 404 |
| `PROFILE_ALREADY_EXISTS` | Cannot create duplicate profile | 409 |
| `Invalid or expired token` | Auth token invalid | 401 |

---

## 🔐 Security Notes

1. **Service Role Key** - Required in `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Token Storage** - Tokens stored in httpOnly cookies by Supabase

3. **RLS Policies** - Row-level security enabled on `user_profiles`

4. **Admin Check** - Verified via JWT metadata + database lookup

5. **Banned User** - Checked on every API call and route access

---

## 📚 Complete File Structure

```
app/api/auth/
├── signup/route.ts              # Email/password signup
├── signup-oauth/route.ts        # OAuth signup prep
├── login/route.ts               # Email/password login
├── logout/route.ts              # Logout handler
├── callback/route.ts            # OAuth callback processor
├── profile/route.ts             # Get/update profile
└── create-profile/route.ts      # Create profile after OAuth

lib/auth/
├── api-client.ts                # Client-side auth API wrapper
└── helpers.ts                   # Server-side auth utilities

supabase/migrations/
└── create_user_profiles.sql     # Database schema

middleware.ts                    # Route protection middleware
```

---

## ✅ Testing Checklist

- [ ] Sign up with email/password (client role)
- [ ] Sign up with email/password (worker role)
- [ ] Sign up with existing email (different role) → Error
- [ ] Sign in with Google (new user)
- [ ] Sign in with Google (existing user)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials → Error
- [ ] Access `/admin` as non-admin → Redirect
- [ ] Access `/client` as worker → Redirect
- [ ] Access `/worker` as client → Redirect
- [ ] Access protected route without auth → Redirect to login
- [ ] Logout and clear session
- [ ] Banned user tries to login → Redirect to /banned
- [ ] Get profile while authenticated
- [ ] Try to change role via PATCH → Error

---

**Status:** ✅ COMPLETE
**Last Updated:** Nov 17, 2025
**Version:** 1.0
