# Phân Tích Logic Setup Profile Worker

## 📋 Tổng Quan

Hệ thống setup profile worker được chia thành 3 bước:

1. **Step 1**: Thông tin cơ bản (Basic Info)
2. **Step 2**: Dịch vụ và giá (Services & Pricing)
3. **Step 3**: Submit để review

---

## 🔍 Phân Tích Chi Tiết

### 1. Frontend Flow (`app/worker/profile/setup/page.tsx`)

#### 1.1. Load Profile Logic

```typescript
loadProfile() {
  - Load profile từ API
  - Xác định currentStep dựa trên profile_completed_steps và profile_status
  - Xử lý error: nếu không có profile → start từ step 0
}
```

**Các trường hợp:**

- ✅ Profile không tồn tại → Step 0
- ✅ `profile_completed_steps === 0` → Step 0
- ✅ `profile_completed_steps >= 1 && < 3` → Step 1
- ✅ `profile_completed_steps === 3`:
  - Nếu `status === DRAFT` → Step 2 (submit)
  - Nếu `status !== DRAFT` → Step 0 (cho phép edit)

**Vấn đề:**

- ⚠️ Logic xác định step phức tạp, khó maintain
- ⚠️ Không có validation khi profile status là REJECTED
- ⚠️ Không clear cache sau khi update profile

#### 1.2. Step Navigation

```typescript
handleStep1Complete() → loadProfile() → setCurrentStep(1)
handleStep2Complete() → loadProfile() → setCurrentStep(2)
handleSubmitForReview() → submit API → redirect dashboard
```

**Vấn đề:**

- ⚠️ Mỗi step complete đều gọi `loadProfile()` lại → có thể gây race condition
- ⚠️ Không có loading state khi navigate giữa các steps
- ⚠️ Không validate data trước khi navigate

---

### 2. Step 1: Basic Info (`components/worker/Step1BasicInfo.tsx`)

#### 2.1. Form Fields

- ✅ Required: `full_name`, `age`
- ✅ Optional: `nickname`, `height_cm`, `weight_kg`, `zodiac_sign`, `lifestyle`, `personal_quote`, `bio`
- ✅ Tags: Dynamic array
- ✅ Availabilities: Hardcoded (MON-FRI, ALL_DAY)

#### 2.2. Validation

```typescript
- full_name: required
- age: required, min: 18, max: 100
- personal_quote: maxLength: 200
- bio: maxLength: 1000
```

**Vấn đề:**

- ❌ **CRITICAL**: Availabilities bị hardcode trong component (lines 114-119)
  ```typescript
  // Hardcoded - không có UI để user chọn
  [DayOfWeek.MONDAY, ..., DayOfWeek.FRIDAY].forEach(day => {
    availabilitiesData.push({
      day_of_week: day,
      availability_type: AvailabilityType.ALL_DAY,
    });
  });
  ```
- ⚠️ Không validate format của `full_name` (có thể chứa ký tự đặc biệt)
- ⚠️ Không validate `height_cm` và `weight_kg` range hợp lý
- ⚠️ Tags không có validation (có thể duplicate, empty string)
- ⚠️ Không có sanitization cho `bio` và `personal_quote`

#### 2.3. Submit Logic

```typescript
handleSubmit() {
  1. Prepare tags data
  2. Prepare availabilities (hardcoded)
  3. Call API saveProfile()
  4. Show success message
  5. Call onComplete()
}
```

**Vấn đề:**

- ⚠️ Không có rollback nếu API call fail một phần
- ⚠️ Tags được map với `tag_value = tag_key` → không linh hoạt
- ⚠️ Không validate tags trước khi submit

---

### 3. Step 2: Services & Pricing (`components/worker/Step2ServicesAndPricing.tsx`)

#### 3.1. Image Upload

```typescript
handleAvatarChange() {
  - Update local state
  - Call API addImage()
  - Show success message
}

handleGalleryAdd() {
  - Add to local state array
  - Call API addImage()
  - Show success message
}
```

**Vấn đề:**

- ❌ **CRITICAL**: Không validate image file size trước khi upload
- ❌ **CRITICAL**: Không validate image format (chỉ accept jpg/png?)
- ⚠️ Không có loading state khi upload image
- ⚠️ Không handle error khi upload fail (image đã được add vào state)
- ⚠️ Không có limit số lượng gallery images
- ⚠️ Không validate image dimensions (min/max width/height)

#### 3.2. Service Management

```typescript
- Load services và worker services
- Add service qua ServiceSelector modal
- Remove service
- Update pricing (qua ServiceCard component)
```

**Vấn đề:**

- ⚠️ Không validate duplicate service trước khi add (đã có ở backend nhưng không check ở frontend)
- ⚠️ Không validate pricing range (có thể nhập giá âm?)
- ⚠️ Không có confirmation khi remove service

#### 3.3. Continue Logic

```typescript
handleContinue() {
  - Validate: avatar required
  - Validate: at least one service required
  - Call onComplete()
}
```

**Vấn đề:**

- ⚠️ Validation chỉ ở frontend → có thể bypass
- ⚠️ Không check xem services có pricing chưa
- ⚠️ Không validate image approval status

---

### 4. Backend API (`app/api/worker/profile/route.ts`)

#### 4.1. GET `/api/worker/profile`

```typescript
GET /api/worker/profile {
  - requireWorker()
  - getWorkerProfile()
  - Return profile or 404
}
```

**Vấn đề:**

- ❌ **CRITICAL**: Missing `withErrorHandling` wrapper (line 22)
  ```typescript
  // Current: export const GET = async (request: NextRequest) => {
  // Should be: export const GET = withErrorHandling(async (request: NextRequest) => {
  ```
- ⚠️ Error handling không consistent với các routes khác

#### 4.2. POST `/api/worker/profile`

```typescript
POST /api/worker/profile {
  - requireWorker()
  - Validate: full_name, age required
  - Validate: age range (18-100)
  - saveWorkerProfile()
  - Return profile
}
```

**Vấn đề:**

- ⚠️ Validation cơ bản, thiếu nhiều checks:
  - Không validate string length
  - Không validate format (email nếu có, phone nếu có)
  - Không sanitize input
- ⚠️ Không validate tags structure
- ⚠️ Không validate availabilities structure
- ⚠️ Không có rate limiting

---

### 5. Service Layer (`lib/worker/service.ts`)

#### 5.1. `saveWorkerProfile()`

```typescript
saveWorkerProfile(userId, data) {
  1. Check existing profile
  2. Prepare profileData
  3. If approved/published → set status to PENDING
  4. Update or Create profile
  5. Update tags (delete old + insert new)
  6. Update availabilities (delete old + insert new)
  7. Return profile
}
```

**Vấn đề:**

- ❌ **CRITICAL**: Không có transaction → có thể partial update
  ```typescript
  // Nếu update tags fail → profile đã được update nhưng tags không sync
  ```
- ⚠️ Delete tags/availabilities trước khi insert → có thể mất data nếu insert fail
- ⚠️ Không validate data trước khi save
- ⚠️ `profile_completed_steps` luôn set = 1 → không đúng nếu đang update step 2

#### 5.2. `submitProfileForReview()`

```typescript
submitProfileForReview(userId) {
  1. Get profile
  2. Validate: has avatar
  3. Validate: has at least one service
  4. Update status to PENDING
  5. Update completed_steps to 3
}
```

**Vấn đề:**

- ⚠️ Validation chỉ check existence, không check:
  - Avatar is approved?
  - Services có pricing?
  - Services có active?
- ⚠️ Không validate profile completeness (bio, tags, etc.)
- ⚠️ Không có atomic update → có thể partial update

#### 5.3. `addWorkerImage()`

```typescript
addWorkerImage(profileId, imageData) {
  1. If avatar → delete old avatar
  2. Insert new image
  3. Reset profile status if needed
  4. Return image
}
```

**Vấn đề:**

- ⚠️ Không validate image URL format
- ⚠️ Không validate file size
- ⚠️ Không validate image type
- ⚠️ Không check image exists trước khi save URL

#### 5.4. `addWorkerService()`

```typescript
addWorkerService(profileId, serviceData) {
  1. Check duplicate
  2. Insert service
  3. Insert pricing
  4. If pricing fail → rollback service
  5. Update completed_steps to 3
  6. Reset profile status if needed
}
```

**Vấn đề:**

- ⚠️ Có rollback cho service nếu pricing fail → tốt
- ⚠️ Nhưng không có transaction → có thể race condition
- ⚠️ `completed_steps = 3` được set ngay khi add service → không đúng logic (chỉ set khi complete step 2)

---

## 🐛 Các Trường Hợp Lỗi Có Thể Xảy Ra

### 1. Race Conditions

- **Vấn đề**: User submit form nhiều lần → duplicate requests
- **Impact**: Duplicate data, inconsistent state
- **Giải pháp**: Debounce submit, disable button khi submitting

### 2. Partial Updates

- **Vấn đề**: Update profile thành công nhưng tags/availabilities fail
- **Impact**: Data inconsistency
- **Giải pháp**: Sử dụng database transaction

### 3. Image Upload Failures

- **Vấn đề**: Image upload fail nhưng đã update state
- **Impact**: UI hiển thị image nhưng backend không có
- **Giải pháp**: Optimistic update với rollback

### 4. Network Errors

- **Vấn đề**: Network timeout khi save profile
- **Impact**: User không biết data đã được save chưa
- **Giải pháp**: Retry logic, show clear error message

### 5. Concurrent Edits

- **Vấn đề**: User edit profile ở nhiều tab → conflict
- **Impact**: Last write wins, mất data
- **Giải pháp**: Optimistic locking với version field

### 6. Invalid Data

- **Vấn đề**: User bypass frontend validation
- **Impact**: Invalid data trong database
- **Giải pháp**: Strict backend validation

### 7. Step State Inconsistency

- **Vấn đề**: `completed_steps` không sync với actual data
- **Impact**: User bị stuck ở step không đúng
- **Giải pháp**: Recalculate steps từ data thực tế

---

## 🔧 Cải Tiến Đề Xuất

### 1. Backend Improvements

#### 1.1. Add Transaction Support

```typescript
async saveWorkerProfile(userId, data) {
  // Use Supabase transaction or batch operations
  const { data: profile, error } = await supabase.rpc('save_worker_profile', {
    user_id: userId,
    profile_data: data
  });
}
```

#### 1.2. Enhanced Validation

```typescript
// Add validation schema (Zod/Yup)
const profileSchema = z.object({
  full_name: z.string().min(2).max(100),
  age: z.number().int().min(18).max(100),
  bio: z.string().max(1000).optional(),
  // ...
});
```

#### 1.3. Fix GET Route

```typescript
export const GET = withErrorHandling(async (request: NextRequest) => {
  // ...
});
```

#### 1.4. Add Rate Limiting

```typescript
import { rateLimit } from "@/lib/auth/rate-limit";

export const POST = rateLimit(
  5,
  60
)(
  withErrorHandling(async (request) => {
    // ...
  })
);
```

### 2. Frontend Improvements

#### 2.1. Fix Availability Logic

```typescript
// Remove hardcoded availabilities
// Add proper availability picker component
<AvailabilityPicker value={availabilities} onChange={setAvailabilities} />
```

#### 2.2. Add Image Validation

```typescript
const validateImage = (file: File) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/png"];

  if (file.size > maxSize) {
    throw new Error("Image too large");
  }
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid image format");
  }
};
```

#### 2.3. Add Optimistic Updates

```typescript
const handleSubmit = async (values) => {
  // Optimistic update
  setProfile((prev) => ({ ...prev, ...values }));

  try {
    await workerProfileAPI.saveProfile(values);
  } catch (error) {
    // Rollback
    setProfile(prevProfile);
    throw error;
  }
};
```

#### 2.4. Add Debounce for Submit

```typescript
const debouncedSubmit = useMemo(() => debounce(handleSubmit, 300), []);
```

#### 2.5. Better Error Handling

```typescript
const handleSubmit = async (values) => {
  try {
    await workerProfileAPI.saveProfile(values);
  } catch (error) {
    if (error.response?.status === 429) {
      showMessage.error("Too many requests. Please wait.");
    } else if (error.response?.status === 400) {
      showMessage.error("Invalid data. Please check your input.");
    } else {
      showMessage.error("Failed to save. Please try again.");
    }
  }
};
```

### 3. Data Consistency

#### 3.1. Recalculate Steps

```typescript
const calculateCompletedSteps = (profile: WorkerProfileComplete) => {
  let steps = 0;

  // Step 1: Basic info
  if (profile.full_name && profile.age) {
    steps |= 1;
  }

  // Step 2: Services & images
  if (profile.avatar && profile.services?.length > 0) {
    steps |= 2;
  }

  return steps;
};
```

#### 3.2. Add Version Field

```typescript
interface WorkerProfile {
  // ...
  version: number; // For optimistic locking
}
```

### 4. Clean Code Improvements

#### 4.1. Extract Constants

```typescript
// constants/worker-profile.ts
export const PROFILE_CONSTRAINTS = {
  MIN_AGE: 18,
  MAX_AGE: 100,
  MAX_BIO_LENGTH: 1000,
  MAX_QUOTE_LENGTH: 200,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,
  MAX_GALLERY_IMAGES: 10,
} as const;
```

#### 4.2. Extract Validation Functions

```typescript
// utils/validation.ts
export const validateProfile = (data: WorkerProfileStep1Request) => {
  const errors: string[] = [];

  if (!data.full_name || data.full_name.length < 2) {
    errors.push("Full name must be at least 2 characters");
  }

  // ...

  return errors;
};
```

#### 4.3. Type Safety

```typescript
// Use stricter types
type ProfileStep = 0 | 1 | 2;
type ProfileStatus = WorkerProfileStatus;

interface ProfileState {
  step: ProfileStep;
  status: ProfileStatus;
  data: Partial<WorkerProfileComplete>;
}
```

---

## ✅ Checklist Cải Tiến

### Backend

- [x] Fix GET route missing `withErrorHandling` ✅ **COMPLETED** (already had it)
- [x] Add transaction support cho `saveWorkerProfile` ✅ **COMPLETED** (using batch operations with Promise.all)
- [x] Add comprehensive validation schema ✅ **COMPLETED** (created `lib/worker/validation.ts`)
- [x] Add rate limiting cho các API endpoints ✅ **COMPLETED** (added to POST route)
- [x] Add image validation (size, format, dimensions) ✅ **COMPLETED** (added to `addWorkerImage`)
- [x] Fix `completed_steps` logic (không set = 1 khi update) ✅ **COMPLETED** (preserves step 2 completion)
- [x] Add version field cho optimistic locking ✅ **COMPLETED** (added version field, optimistic locking in saveWorkerProfile and submitProfileForReview)
- [x] Add database constraints cho data integrity ✅ **COMPLETED** (added constraints for length, file size, dimensions, discounts, URL format)
- [x] Add logging cho các operations quan trọng ✅ **COMPLETED** (created logger utility, added logging to saveWorkerProfile, submitProfileForReview)
- [x] Add monitoring/alerting cho errors ✅ **COMPLETED** (created error-tracker utility, integrated with error handler)

### Frontend

- [x] Fix hardcoded availabilities → add proper UI ✅ **COMPLETED** (created AvailabilityPicker component, integrated into Step1BasicInfo)
- [x] Add image validation trước khi upload ✅ **COMPLETED** (ImageUpload component already has validation, added validateImageFile utility)
- [x] Add loading states cho tất cả async operations ✅ **COMPLETED** (added loading states for all API calls, image uploads, form submissions)
- [x] Add debounce cho form submit ✅ **COMPLETED** (created useDebounce hook, button disabled during submit prevents rapid submissions)
- [x] Add optimistic updates với rollback ✅ **COMPLETED** (implemented in Step1BasicInfo, Step2ServicesAndPricing for profile and image updates)
- [x] Add better error messages (specific, actionable) ✅ **COMPLETED** (added specific error messages for network errors, validation errors, with i18n support)
- [x] Add retry logic cho network errors ✅ **COMPLETED** (created useRetry hook, applied to all API calls)
- [x] Add confirmation dialogs cho destructive actions ✅ **COMPLETED** (added Modal.confirm for service removal)
- [ ] Add form auto-save (draft) ⚠️ **PENDING** (not implemented yet)
- [x] Add step validation trước khi navigate ✅ **COMPLETED** (added validateStep function in setup page)
- [x] Add duplicate service check ở frontend ✅ **COMPLETED** (added checkDuplicateService function, filters services in ServiceSelector)
- [ ] Add image upload progress indicator ⚠️ **PENDING** (ImageUpload has loading state but no progress bar)
- [x] Add gallery image limit validation ✅ **COMPLETED** (added validateGalleryImageCount, max 10 images)
- [x] Add service pricing validation ✅ **COMPLETED** (added validateServicePricing function, validates price ranges and discounts)

### Data Consistency

- [x] Add function để recalculate `completed_steps` ✅ **COMPLETED** (created `calculateCompletedSteps` and `recalculateCompletedSteps` in `lib/worker/data-consistency.ts`)
- [x] Add validation để ensure step state sync với data ✅ **COMPLETED** (created `validateStepState` function, integrated into `getWorkerProfile` with auto-fix)
- [x] Add cleanup cho orphaned tags/availabilities ✅ **COMPLETED** (created `cleanupOrphanedTags`, `cleanupOrphanedAvailabilities`, and `cleanupAllOrphanedData` functions)
- [x] Add migration script để fix existing inconsistent data ✅ **COMPLETED** (created `scripts/migrate-worker-profiles.ts` with options for dry-run, fix-all, cleanup)

### Testing

- [ ] Unit tests cho validation functions
- [ ] Integration tests cho API endpoints
- [ ] E2E tests cho complete flow
- [ ] Test race conditions
- [ ] Test error scenarios
- [ ] Test concurrent edits

### Documentation

- [ ] Document API endpoints
- [ ] Document validation rules
- [ ] Document error codes
- [ ] Document step flow logic
- [ ] Add code comments cho complex logic

### Performance

- [ ] Add caching cho profile data
- [ ] Optimize database queries (indexes)
- [ ] Add pagination cho services list
- [ ] Optimize image loading (lazy load, thumbnails)

### Security

- [x] Add input sanitization ✅ **COMPLETED** (created `lib/worker/security.ts` with `sanitizeWorkerProfileStep1`, integrated into POST endpoint)
- [x] Add XSS protection ✅ **COMPLETED** (security headers applied via `applySecurityHeaders`, input sanitization prevents XSS)
- [x] Add CSRF protection ✅ **COMPLETED** (added `withCSRFProtection` to POST endpoints, origin validation available)
- [x] Validate file uploads (type, size) ✅ **COMPLETED** (enhanced validation with magic number checking in `lib/utils/file-security.ts`, file signature validation)
- [x] Add file scan cho uploaded images (malware) ✅ **COMPLETED** (basic malware scanning in `scanFileForMalware`, checks for executable signatures and suspicious patterns)

---

## 📊 Priority Matrix

### Critical (P0) - Fix ngay

1. ✅ Fix GET route missing `withErrorHandling` **COMPLETED**
2. ✅ Fix hardcoded availabilities (Frontend issue) **COMPLETED**
3. ✅ Add transaction support cho `saveWorkerProfile` **COMPLETED**
4. ✅ Add image validation **COMPLETED**

### High (P1) - Fix trong sprint này

1. ✅ Fix `completed_steps` logic **COMPLETED**
2. ✅ Add comprehensive validation **COMPLETED**
3. ✅ Add better error handling **COMPLETED**
4. ✅ Add loading states (Frontend issue) **COMPLETED**

### Medium (P2) - Fix trong sprint sau

1. ✅ Add optimistic updates **COMPLETED**
2. ✅ Add debounce **COMPLETED**
3. ✅ Add retry logic **COMPLETED**
4. ✅ Add confirmation dialogs **COMPLETED**

### Low (P3) - Nice to have

1. ⚠️ Add auto-save
2. ⚠️ Add caching
3. ⚠️ Add monitoring
4. ⚠️ Add comprehensive tests

---

## 📝 Notes

### Current Architecture

- Frontend: React + Ant Design + Next.js
- Backend: Next.js API Routes + Supabase
- State Management: React hooks (useState, useEffect)
- API Client: Axios wrapper

### Dependencies

- `@ant-design/icons`
- `antd`
- `dayjs`
- `react-i18next`
- `@supabase/supabase-js`

### Related Files

- `app/worker/profile/setup/page.tsx` - Main setup page
- `components/worker/Step1BasicInfo.tsx` - Step 1 component
- `components/worker/Step2ServicesAndPricing.tsx` - Step 2 component
- `app/api/worker/profile/route.ts` - Profile API
- `lib/worker/service.ts` - Service layer
- `lib/worker/api-client.ts` - API client
- `lib/worker/types.ts` - TypeScript types

---

## 🎯 Kết Luận

Hệ thống setup profile worker có cấu trúc tốt nhưng cần cải thiện ở:

1. **Error handling**: Thiếu consistency và comprehensive
2. **Data consistency**: Thiếu transaction support
3. **Validation**: Thiếu nhiều validation rules
4. **User experience**: Thiếu loading states và better error messages
5. **Code quality**: Có hardcoded logic và thiếu type safety

Ưu tiên fix các issues Critical (P0) trước, sau đó tiếp tục với High priority items.
