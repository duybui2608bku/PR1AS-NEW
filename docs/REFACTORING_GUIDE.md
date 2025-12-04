# Code Refactoring Guide

## Tổng quan

Tài liệu này mô tả cách refactor các API routes để sử dụng các helper functions tập trung, loại bỏ code duplicate và cải thiện code quality.

## Các vấn đề đã được giải quyết

### 1. ✅ HTTP Status Codes
**Trước:**
```typescript
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

**Sau:**
```typescript
import { HttpStatus } from "@/lib/utils/enums";
import { unauthorizedResponse } from "@/lib/http/response";

return unauthorizedResponse("Unauthorized");
// hoặc
return errorResponse("Unauthorized", HttpStatus.UNAUTHORIZED);
```

### 2. ✅ Error Messages
**Trước:**
```typescript
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
```

**Sau:**
```typescript
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { ApiError, ErrorCode } from "@/lib/http/errors";

throw new ApiError(
  getErrorMessage(ERROR_MESSAGES.UNAUTHORIZED),
  HttpStatus.UNAUTHORIZED,
  ErrorCode.UNAUTHORIZED
);
```

### 3. ✅ Authentication & Authorization
**Trước:**
```typescript
async function verifyAdmin(token: string, supabase: SupabaseClient<any>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    throw new Error("Invalid token");
  }
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = createAdminClient();
    try {
      await verifyAdmin(token, supabase);
    } catch (error: any) {
      if (error.message === "Invalid token") {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      if (error.message === "Admin access required") {
        return NextResponse.json(
          { success: false, error: "Admin access required" },
          { status: 403 }
        );
      }
      throw error;
    }
    // ... business logic
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Sau:**
```typescript
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require admin authentication
  const { supabase } = await requireAdmin(request);
  
  // ... business logic
  
  return successResponse(data);
});
```

### 4. ✅ Error Handling
**Trước:**
```typescript
export async function POST(request: NextRequest) {
  try {
    // ... code
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
```

**Sau:**
```typescript
import { withErrorHandling } from "@/lib/http/errors";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // ... code
  // Errors are automatically handled
});
```

## Các file helper đã tạo

### 1. `lib/http/response.ts`
- `successResponse()` - Tạo success response
- `errorResponse()` - Tạo error response
- `badRequestResponse()` - 400 response
- `unauthorizedResponse()` - 401 response
- `forbiddenResponse()` - 403 response
- `notFoundResponse()` - 404 response
- `internalErrorResponse()` - 500 response
- `createdResponse()` - 201 response

### 2. `lib/http/errors.ts`
- `ApiError` class - Custom error class với status code và error code
- `ErrorCode` enum - Tất cả error codes
- `handleApiError()` - Xử lý errors tự động
- `withErrorHandling()` - Wrapper cho route handlers

### 3. `lib/constants/errors.ts`
- `ERROR_MESSAGES` - Error message keys cho i18n
- `ERROR_MESSAGES_FALLBACK` - Fallback messages (English)
- `getErrorMessage()` - Lấy error message với fallback

### 4. `lib/auth/middleware.ts`
- `requireAuth()` - Yêu cầu authentication
- `requireAdmin()` - Yêu cầu admin role
- `requireRole()` - Yêu cầu specific role(s)
- `requireClient()` - Yêu cầu client role
- `requireWorker()` - Yêu cầu worker role

## Pattern refactoring

### Pattern 1: Admin Routes
```typescript
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);
  // ... business logic
  return successResponse(data);
});
```

### Pattern 2: Client Routes
```typescript
import { NextRequest } from "next/server";
import { requireClient } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { user, supabase } = await requireClient(request);
  
  // Validation
  if (!requiredField) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }
  
  // ... business logic
  return successResponse(data, "Success message");
});
```

### Pattern 3: Public Routes (với optional auth)
```typescript
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling } from "@/lib/http/errors";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Optional auth - wrap in try-catch if needed
  let auth = null;
  try {
    auth = await requireAuth(request);
  } catch {
    // Continue without auth
  }
  
  // ... business logic
  return successResponse(data);
});
```

## Checklist refactoring

Khi refactor một route, kiểm tra:

- [ ] Thay thế hardcoded status codes bằng `HttpStatus` enum
- [ ] Thay thế hardcoded error messages bằng `ERROR_MESSAGES` constants
- [ ] Loại bỏ duplicate `verifyAdmin` functions
- [ ] Sử dụng `requireAdmin()`, `requireClient()`, `requireWorker()` thay vì manual checks
- [ ] Wrap handler với `withErrorHandling()`
- [ ] Sử dụng `successResponse()`, `errorResponse()` thay vì `NextResponse.json()`
- [ ] Sử dụng `ApiError` cho validation errors
- [ ] Loại bỏ try-catch blocks không cần thiết (đã được handle bởi `withErrorHandling`)

## Ví dụ đã refactor

### ✅ Đã refactor:
- `app/api/admin/escrows/route.ts`
- `app/api/admin/transactions/route.ts`
- `app/api/admin/wallet/stats/route.ts`
- `app/api/booking/create/route.ts`
- `app/api/auth/profile/route.ts`
- `app/api/wallet/balance/route.ts`

### ⏳ Cần refactor:
- Tất cả các routes còn lại trong `app/api/`

## Lưu ý

1. **Backward Compatibility**: Các response format phải giữ nguyên để không break frontend
2. **Error Codes**: Sử dụng `ErrorCode` enum thay vì string literals
3. **i18n**: Error messages sẽ được translate tự động thông qua message files
4. **Testing**: Test tất cả routes sau khi refactor

## Next Steps

1. Refactor tất cả admin routes
2. Refactor tất cả booking routes
3. Refactor tất cả wallet routes
4. Refactor tất cả auth routes
5. Refactor tất cả worker routes
6. Refactor tất cả client routes
7. Update message files cho các ngôn ngữ còn lại (ko, zh)
8. Remove unused helper functions (`getAuthenticatedUser`, duplicate `verifyAdmin`, etc.)

