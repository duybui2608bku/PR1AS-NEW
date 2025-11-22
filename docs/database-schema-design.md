# Database Schema Design - Service Platform

## Tổng quan

Thiết kế database schema cho nền tảng dịch vụ kết nối Workers và Clients, hỗ trợ đa dạng các loại dịch vụ và tính năng thiết lập hồ sơ cho workers.

---

## 1. Service System (Hệ thống dịch vụ)

### 1.1. service_categories
**Mục đích**: Lưu các danh mục dịch vụ chính

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name_key | TEXT | Enum key cho i18n (e.g., 'CATEGORY_HOMECARE') |
| slug | TEXT | URL-friendly identifier |
| description | TEXT | Mô tả category |
| icon | TEXT | Icon identifier |
| display_order | INTEGER | Thứ tự hiển thị |
| is_active | BOOLEAN | Trạng thái active |
| created_at | TIMESTAMP | Timestamp tạo |
| updated_at | TIMESTAMP | Timestamp cập nhật |

**Categories mặc định**:
- `CATEGORY_HOMECARE` - Chăm sóc nhà cửa
- `CATEGORY_GROOMING` - Chăm sóc cá nhân
- `CATEGORY_ASSISTANCE` - Hỗ trợ
- `CATEGORY_COMPANIONSHIP` - Đồng hành

### 1.2. services
**Mục đích**: Lưu tất cả các dịch vụ với enum keys cho i18n

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| category_id | UUID | FK → service_categories |
| name_key | TEXT | Enum key cho i18n (e.g., 'SERVICE_HOMECARE_COOKING_VIETNAMESE') |
| slug | TEXT | URL-friendly identifier |
| description | TEXT | Mô tả service |
| icon | TEXT | Icon identifier |
| has_options | BOOLEAN | Service có options không (e.g., cooking có cuisine types) |
| parent_service_id | UUID | FK → services (cho nested services) |
| display_order | INTEGER | Thứ tự hiển thị |
| is_active | BOOLEAN | Trạng thái active |
| requires_certification | BOOLEAN | Yêu cầu chứng chỉ |
| metadata | JSONB | Metadata bổ sung |
| created_at | TIMESTAMP | Timestamp tạo |
| updated_at | TIMESTAMP | Timestamp cập nhật |

**Services theo category**:

#### Homecare
- `SERVICE_HOMECARE_ORGANIZING` - Sắp xếp nhà cửa
- `SERVICE_HOMECARE_COOKING` - Nấu ăn (has_options=true)

#### Grooming
- `SERVICE_GROOMING_NAIL` - Làm móng
- `SERVICE_GROOMING_FACIAL` - Chăm sóc da mặt
- `SERVICE_GROOMING_BODY` - Chăm sóc cơ thể
- `SERVICE_GROOMING_HAIRCARE` - Chăm sóc tóc (has_options=true)

#### Assistance
- `SERVICE_ASSISTANCE_PERSONAL` - Trợ lý cá nhân
- `SERVICE_ASSISTANCE_ONSITE` - Hỗ trợ chuyên nghiệp tại chỗ
- `SERVICE_ASSISTANCE_VIRTUAL` - Trợ lý ảo
- `SERVICE_ASSISTANCE_TOUR_GUIDE` - Hướng dẫn viên du lịch
- `SERVICE_ASSISTANCE_INTERPRETER` - Phiên dịch (has_options=true)

#### Companionship
- `SERVICE_COMPANIONSHIP_LEVEL_1` - Level 1
  - Metadata: `{"level": 1, "physical_contact": false, "intellectual_conversation": false, "attire": "casual"}`
- `SERVICE_COMPANIONSHIP_LEVEL_2` - Level 2
  - Metadata: `{"level": 2, "physical_contact": false, "intellectual_conversation": true, "attire": "semi_formal"}`
- `SERVICE_COMPANIONSHIP_LEVEL_3` - Level 3
  - Metadata: `{"level": 3, "physical_contact": true, "physical_contact_type": "non_intimate", "intellectual_conversation": true, "attire": "formal"}`

### 1.3. service_options
**Mục đích**: Lưu các options cho services (e.g., loại ẩm thực, cặp ngôn ngữ phiên dịch)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| service_id | UUID | FK → services |
| option_key | TEXT | Enum key cho i18n (e.g., 'COOKING_VIETNAMESE') |
| option_type | TEXT | Loại option (e.g., 'cuisine', 'haircare_type', 'language_pair') |
| option_value | TEXT | Giá trị identifier (e.g., 'vietnamese', 'chemical', 'EN_TO_JA') |
| display_order | INTEGER | Thứ tự hiển thị |
| is_active | BOOLEAN | Trạng thái active |
| metadata | JSONB | Metadata bổ sung (cho interpreter: source/target language) |
| created_at | TIMESTAMP | Timestamp tạo |
| updated_at | TIMESTAMP | Timestamp cập nhật |

**Service Options chi tiết**:

#### Cooking Cuisines (option_type = 'cuisine')
- `COOKING_VIETNAMESE` → vietnamese
- `COOKING_KOREAN` → korean
- `COOKING_JAPANESE` → japanese
- `COOKING_CHINESE` → chinese
- `COOKING_WESTERN` → western

#### Haircare Types (option_type = 'haircare_type')
- `HAIRCARE_NON_CHEMICAL` → non_chemical
- `HAIRCARE_CHEMICAL` → chemical

#### Interpreter Language Pairs (option_type = 'language_pair')
Format: `SOURCE_TO_TARGET`

**Danh sách đầy đủ 20 cặp ngôn ngữ**:
- Vietnamese: `VI_TO_EN`, `VI_TO_KO`, `VI_TO_JA`, `VI_TO_ZH`
- English: `EN_TO_VI`, `EN_TO_KO`, `EN_TO_JA`, `EN_TO_ZH`
- Korean: `KO_TO_VI`, `KO_TO_EN`, `KO_TO_JA`, `KO_TO_ZH`
- Japanese: `JA_TO_VI`, `JA_TO_EN`, `JA_TO_KO`, `JA_TO_ZH`
- Chinese: `ZH_TO_VI`, `ZH_TO_EN`, `ZH_TO_KO`, `ZH_TO_JA`

Metadata chứa: `{"source": "EN", "target": "JA", "source_name": "English", "target_name": "Japanese"}`

---

## 2. Worker Profile System (Hệ thống hồ sơ Worker)

### 2.1. worker_profiles
**Mục đích**: Lưu thông tin mở rộng của workers (Step 1 của profile setup)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK → user_profiles (UNIQUE) |
| full_name | TEXT | Họ và Tên * |
| nickname | TEXT | Biệt Danh |
| age | INTEGER | Tuổi * (18-100) |
| height_cm | INTEGER | Chiều cao cm * (100-250) |
| weight_kg | INTEGER | Cân nặng kg * (30-300) |
| zodiac_sign | TEXT | Cung hoàng đạo |
| lifestyle | TEXT | Lối sống (enum key) |
| personal_quote | TEXT | Câu nói cá nhân |
| bio | TEXT | Giới thiệu mô tả |
| profile_status | TEXT | Status: draft/pending/approved/rejected/published |
| profile_completed_steps | INTEGER | Bitmask tracking steps (1=step1, 2=step2) |
| reviewed_by | UUID | FK → auth.users (admin reviewer) |
| reviewed_at | TIMESTAMP | Thời gian review |
| rejection_reason | TEXT | Lý do reject (nếu có) |
| metadata | JSONB | Metadata bổ sung |
| created_at | TIMESTAMP | Timestamp tạo |
| updated_at | TIMESTAMP | Timestamp cập nhật |

**Profile Status Flow**:
1. `draft` → Worker đang chỉnh sửa
2. `pending` → Đã submit, đợi admin review
3. `approved` → Admin đã approve
4. `rejected` → Admin đã reject (cần sửa)
5. `published` → Đã xuất bản, visible cho clients

### 2.2. worker_tags
**Mục đích**: Lưu interests & hobbies của workers

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| worker_profile_id | UUID | FK → worker_profiles |
| tag_key | TEXT | Tag identifier (e.g., 'TAG_SPORTS') |
| tag_value | TEXT | Display value cho custom tags |
| tag_type | TEXT | Loại tag: interest/hobby/skill |
| created_at | TIMESTAMP | Timestamp tạo |

### 2.3. worker_availabilities
**Mục đích**: Lưu lịch rảnh trong tuần của workers

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| worker_profile_id | UUID | FK → worker_profiles |
| day_of_week | INTEGER | Ngày trong tuần (1=Monday, 7=Sunday) |
| availability_type | TEXT | Loại: all_day/time_range/not_available |
| start_time | TIME | Giờ bắt đầu (nếu time_range) |
| end_time | TIME | Giờ kết thúc (nếu time_range) |
| notes | TEXT | Ghi chú |
| created_at | TIMESTAMP | Timestamp tạo |
| updated_at | TIMESTAMP | Timestamp cập nhật |

**Ví dụ availability**:
- Thứ 2: `all_day` (rảnh cả ngày)
- Thứ 4: `time_range` với start_time='18:00:00', end_time='21:00:00'
- Thứ 7: `not_available`

### 2.4. worker_images
**Mục đích**: Lưu avatar và gallery images (Step 2)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| worker_profile_id | UUID | FK → worker_profiles |
| image_url | TEXT | URL từ storage |
| image_type | TEXT | Loại: avatar/gallery |
| display_order | INTEGER | Thứ tự hiển thị (cho gallery) |
| file_name | TEXT | Tên file |
| file_size_bytes | INTEGER | Kích thước file |
| mime_type | TEXT | MIME type |
| width_px | INTEGER | Chiều rộng |
| height_px | INTEGER | Chiều cao |
| is_approved | BOOLEAN | Admin đã approve chưa |
| approved_by | UUID | FK → auth.users |
| approved_at | TIMESTAMP | Thời gian approve |
| created_at | TIMESTAMP | Timestamp tạo |
| updated_at | TIMESTAMP | Timestamp cập nhật |

### 2.5. worker_services
**Mục đích**: Many-to-many relationship giữa workers và services (Step 2)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| worker_profile_id | UUID | FK → worker_profiles |
| service_id | UUID | FK → services |
| service_option_id | UUID | FK → service_options (nullable) |
| is_active | BOOLEAN | Service có active không |
| is_featured | BOOLEAN | Highlight service này |
| created_at | TIMESTAMP | Timestamp tạo |
| updated_at | TIMESTAMP | Timestamp cập nhật |

**Logic**:
- Worker chọn nhiều services từ danh sách có sẵn
- Nếu service có options (e.g., cooking → Vietnamese), phải chọn option
- Mỗi service-option combination là một record

### 2.6. worker_service_prices
**Mục đích**: Lưu giá dịch vụ với đa tiền tệ (Step 2)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| worker_service_id | UUID | FK → worker_services |
| price_usd | DECIMAL(10,2) | Giá theo USD |
| price_vnd | DECIMAL(15,2) | Giá theo VND |
| price_jpy | DECIMAL(10,2) | Giá theo JPY |
| price_krw | DECIMAL(10,2) | Giá theo KRW |
| price_cny | DECIMAL(10,2) | Giá theo CNY |
| primary_currency | TEXT | Tiền tệ chính worker chọn |
| daily_discount_percent | DECIMAL(5,2) | % discount cho booking theo ngày |
| weekly_discount_percent | DECIMAL(5,2) | % discount cho booking theo tuần |
| monthly_discount_percent | DECIMAL(5,2) | % discount cho booking theo tháng |
| is_active | BOOLEAN | Giá có active không |
| notes | TEXT | Ghi chú về pricing |
| metadata | JSONB | Metadata bổ sung |
| created_at | TIMESTAMP | Timestamp tạo |
| updated_at | TIMESTAMP | Timestamp cập nhật |

**Pricing Logic**:
- Worker nhập giá theo **GIỜ** trong primary_currency
- Hệ thống tự tính:
  - **Daily** = hourly × 8
  - **Weekly** = hourly × 56 (8h × 7 days)
  - **Monthly** = hourly × 160 (8h × 20 working days)
- Có thể apply discount cho long-term bookings
- Khi client book nhiều services → tính theo giá cao nhất

---

## 3. Database Relationships

### 3.1. Entity Relationship Diagram (ERD)

```
service_categories (1) ──→ (N) services
services (1) ──→ (N) service_options
services (1) ──→ (N) worker_services
user_profiles (1) ──→ (1) worker_profiles
worker_profiles (1) ──→ (N) worker_tags
worker_profiles (1) ──→ (N) worker_availabilities
worker_profiles (1) ──→ (N) worker_images
worker_profiles (1) ──→ (N) worker_services
worker_services (1) ──→ (1) worker_service_prices
worker_services (N) ──→ (1) service_options [optional]
```

### 3.2. Relationships chi tiết

1. **service_categories → services** (1:N)
   - Một category có nhiều services

2. **services → service_options** (1:N)
   - Một service có nhiều options (nếu has_options=true)

3. **user_profiles → worker_profiles** (1:1)
   - Mỗi worker (user với role='worker') có một worker_profile

4. **worker_profiles → worker_tags** (1:N)
   - Một worker có nhiều tags

5. **worker_profiles → worker_availabilities** (1:N)
   - Một worker có nhiều availability slots trong tuần

6. **worker_profiles → worker_images** (1:N)
   - Một worker có nhiều images (1 avatar + nhiều gallery)

7. **worker_profiles → worker_services** (1:N)
   - Một worker cung cấp nhiều services

8. **services → worker_services** (1:N)
   - Một service được nhiều workers cung cấp

9. **worker_services → worker_service_prices** (1:1)
   - Mỗi worker-service combination có một pricing record

10. **service_options → worker_services** (1:N, optional)
    - Nếu service có options, worker phải chọn option cụ thể

---

## 4. Indexes và Performance

### 4.1. Indexes quan trọng

**service_categories**:
- `idx_service_categories_slug`
- `idx_service_categories_is_active`
- `idx_service_categories_display_order`

**services**:
- `idx_services_category_id`
- `idx_services_slug`
- `idx_services_is_active`
- `idx_services_parent_service_id`
- `idx_services_display_order`

**service_options**:
- `idx_service_options_service_id`
- `idx_service_options_option_type`
- `idx_service_options_is_active`

**worker_profiles**:
- `idx_worker_profiles_user_id`
- `idx_worker_profiles_profile_status`
- `idx_worker_profiles_lifestyle`

**worker_services**:
- `idx_worker_services_worker_profile_id`
- `idx_worker_services_service_id`
- `idx_worker_services_service_option_id`
- `idx_worker_services_is_active`

**worker_service_prices**:
- `idx_worker_service_prices_worker_service_id`
- `idx_worker_service_prices_primary_currency`

### 4.2. Unique Constraints

- `service_categories.name_key` (UNIQUE)
- `service_categories.slug` (UNIQUE)
- `services.name_key` (UNIQUE)
- `services.slug` (UNIQUE)
- `service_options(service_id, option_value)` (UNIQUE)
- `worker_profiles.user_id` (UNIQUE)
- `worker_tags(worker_profile_id, tag_key)` (UNIQUE)
- `worker_availabilities(worker_profile_id, day_of_week, start_time, end_time)` (UNIQUE)
- `worker_services(worker_profile_id, service_id, service_option_id)` (UNIQUE)
- `worker_service_prices.worker_service_id` (UNIQUE)

---

## 5. Row Level Security (RLS) Policies

### 5.1. Service System
- **Public read**: Tất cả users có thể đọc active services/categories/options
- **Admin only**: Chỉ admin có thể create/update/delete services

### 5.2. Worker Profiles
- **Workers**: Có thể view/edit profile của chính mình
- **Clients**: Chỉ xem được profiles với status='published'
- **Admins**: Có thể view/manage tất cả profiles

### 5.3. Worker Images
- **Workers**: Có thể upload/manage images của chính mình
- **Public**: Chỉ xem được approved images của published profiles
- **Admins**: Có thể approve/reject images

### 5.4. Worker Services & Prices
- **Workers**: Có thể manage services/prices của chính mình
- **Public**: Chỉ xem được active services/prices của published profiles
- **Admins**: Full access

---

## 6. Utility Functions

### 6.1. calculate_price_tiers()
Tính toán giá theo các tiers từ giá giờ:
```sql
SELECT * FROM calculate_price_tiers(
  hourly_price := 20.00,
  daily_discount := 5,
  weekly_discount := 10,
  monthly_discount := 15
);
```

**Output**:
- `hourly`: 20.00
- `daily`: 152.00 (20 × 8 × 0.95)
- `weekly`: 1,008.00 (20 × 56 × 0.90)
- `monthly`: 2,720.00 (20 × 160 × 0.85)

### 6.2. get_highest_service_price()
Lấy giá cao nhất khi worker cung cấp nhiều services:
```sql
SELECT get_highest_service_price(
  worker_profile_uuid := 'xxx-xxx-xxx',
  currency := 'USD'
);
```

### 6.3. is_worker_profile_complete()
Kiểm tra worker profile đã hoàn thành chưa:
```sql
SELECT is_worker_profile_complete(worker_profile_uuid := 'xxx-xxx-xxx');
-- Returns: true/false
```

**Điều kiện hoàn thành**:
- ✅ Có đầy đủ thông tin bắt buộc (full_name, age, height, weight)
- ✅ Có avatar đã được approve
- ✅ Có ít nhất 1 active service

---

## 7. Migration Strategy

### 7.1. Migration Order
1. **create_service_system.sql** - Tạo service categories, services, service_options
2. **create_worker_profile_system.sql** - Tạo worker profiles, tags, availabilities, images, services, prices

### 7.2. Dependencies
- Phụ thuộc vào `update_updated_at_column()` function (đã có trong create_user_profiles.sql)
- Phụ thuộc vào `user_profiles` table (đã có)
- Phụ thuộc vào `auth.users` (Supabase built-in)

### 7.3. Rollback Strategy
Nếu cần rollback:
```sql
-- Rollback worker profile system
DROP TABLE IF EXISTS worker_service_prices CASCADE;
DROP TABLE IF EXISTS worker_services CASCADE;
DROP TABLE IF EXISTS worker_images CASCADE;
DROP TABLE IF EXISTS worker_availabilities CASCADE;
DROP TABLE IF EXISTS worker_tags CASCADE;
DROP TABLE IF EXISTS worker_profiles CASCADE;

-- Rollback service system
DROP TABLE IF EXISTS service_options CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;

-- Drop utility functions
DROP FUNCTION IF EXISTS calculate_price_tiers;
DROP FUNCTION IF EXISTS get_highest_service_price;
DROP FUNCTION IF EXISTS is_worker_profile_complete;
```

---

## 8. Sample Data Queries

### 8.1. Lấy tất cả services theo category
```sql
SELECT
  sc.name_key as category,
  s.name_key as service_name,
  s.slug,
  s.has_options
FROM services s
JOIN service_categories sc ON s.category_id = sc.id
WHERE s.is_active = true
ORDER BY sc.display_order, s.display_order;
```

### 8.2. Lấy cooking services với cuisine options
```sql
SELECT
  s.name_key as service,
  so.option_key as cuisine,
  so.option_value
FROM services s
LEFT JOIN service_options so ON s.id = so.service_id
WHERE s.slug = 'homecare-cooking'
  AND s.is_active = true
  AND so.is_active = true
ORDER BY so.display_order;
```

### 8.3. Lấy full worker profile với services và prices
```sql
SELECT
  wp.full_name,
  wp.age,
  wp.bio,
  s.name_key as service,
  so.option_key as service_option,
  wsp.price_usd,
  wsp.primary_currency
FROM worker_profiles wp
JOIN worker_services ws ON wp.id = ws.worker_profile_id
JOIN services s ON ws.service_id = s.id
LEFT JOIN service_options so ON ws.service_option_id = so.id
LEFT JOIN worker_service_prices wsp ON ws.id = wsp.worker_service_id
WHERE wp.profile_status = 'published'
  AND ws.is_active = true
  AND wsp.is_active = true;
```

### 8.4. Lấy worker availability trong tuần
```sql
SELECT
  wp.full_name,
  wa.day_of_week,
  CASE wa.day_of_week
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
    WHEN 6 THEN 'Saturday'
    WHEN 7 THEN 'Sunday'
  END as day_name,
  wa.availability_type,
  wa.start_time,
  wa.end_time
FROM worker_availabilities wa
JOIN worker_profiles wp ON wa.worker_profile_id = wp.id
WHERE wp.user_id = auth.uid()
ORDER BY wa.day_of_week, wa.start_time;
```

---

## 9. API Endpoints Structure (Gợi ý)

### 9.1. Service Endpoints
- `GET /api/services` - Lấy tất cả services
- `GET /api/services/:slug` - Lấy service detail
- `GET /api/services/:slug/options` - Lấy options của service
- `GET /api/service-categories` - Lấy tất cả categories

### 9.2. Worker Profile Endpoints
- `POST /api/worker/profile` - Tạo worker profile (Step 1)
- `PUT /api/worker/profile` - Update worker profile
- `GET /api/worker/profile` - Lấy worker profile của mình
- `POST /api/worker/profile/submit` - Submit profile for review
- `POST /api/worker/profile/publish` - Publish profile (sau khi approved)

### 9.3. Worker Images Endpoints
- `POST /api/worker/images` - Upload image
- `DELETE /api/worker/images/:id` - Delete image
- `PUT /api/worker/images/:id/set-avatar` - Set làm avatar

### 9.4. Worker Services Endpoints
- `POST /api/worker/services` - Thêm service
- `DELETE /api/worker/services/:id` - Xóa service
- `PUT /api/worker/services/:id/price` - Set giá cho service

### 9.5. Worker Availability Endpoints
- `POST /api/worker/availabilities` - Thêm availability
- `PUT /api/worker/availabilities/:id` - Update availability
- `DELETE /api/worker/availabilities/:id` - Xóa availability
- `GET /api/worker/availabilities` - Lấy availability trong tuần

### 9.6. Public Worker Endpoints
- `GET /api/workers` - Lấy danh sách workers (published, với filters)
- `GET /api/workers/:id` - Lấy worker profile detail
- `GET /api/workers/:id/services` - Lấy services của worker
- `GET /api/workers/:id/availabilities` - Lấy availability của worker

---

## 10. Frontend i18n Structure (Gợi ý)

### 10.1. Service Names (en.json)
```json
{
  "services": {
    "categories": {
      "CATEGORY_HOMECARE": "Homecare",
      "CATEGORY_GROOMING": "Grooming",
      "CATEGORY_ASSISTANCE": "Assistance",
      "CATEGORY_COMPANIONSHIP": "Companionship"
    },
    "names": {
      "SERVICE_HOMECARE_ORGANIZING": "Home Organizing",
      "SERVICE_HOMECARE_COOKING": "Cooking",
      "SERVICE_GROOMING_NAIL": "Nail Care",
      "SERVICE_GROOMING_FACIAL": "Facial Care",
      "SERVICE_GROOMING_BODY": "Body Care",
      "SERVICE_GROOMING_HAIRCARE": "Hair Care",
      "SERVICE_ASSISTANCE_PERSONAL": "Personal Assistant",
      "SERVICE_ASSISTANCE_ONSITE": "On-site Assistant",
      "SERVICE_ASSISTANCE_VIRTUAL": "Virtual Assistant",
      "SERVICE_ASSISTANCE_TOUR_GUIDE": "Tour Guide",
      "SERVICE_ASSISTANCE_INTERPRETER": "Interpreter",
      "SERVICE_COMPANIONSHIP_LEVEL_1": "Companionship - Level 1",
      "SERVICE_COMPANIONSHIP_LEVEL_2": "Companionship - Level 2",
      "SERVICE_COMPANIONSHIP_LEVEL_3": "Companionship - Level 3"
    },
    "options": {
      "COOKING_VIETNAMESE": "Vietnamese Cuisine",
      "COOKING_KOREAN": "Korean Cuisine",
      "COOKING_JAPANESE": "Japanese Cuisine",
      "COOKING_CHINESE": "Chinese Cuisine",
      "COOKING_WESTERN": "Western Cuisine",
      "HAIRCARE_NON_CHEMICAL": "Non-chemical Hair Care",
      "HAIRCARE_CHEMICAL": "Chemical Hair Care",
      "INTERPRETER_VI_TO_EN": "Vietnamese → English",
      "INTERPRETER_EN_TO_JA": "English → Japanese"
    }
  }
}
```

### 10.2. Service Names (vi.json)
```json
{
  "services": {
    "categories": {
      "CATEGORY_HOMECARE": "Chăm sóc nhà cửa",
      "CATEGORY_GROOMING": "Chăm sóc cá nhân",
      "CATEGORY_ASSISTANCE": "Hỗ trợ",
      "CATEGORY_COMPANIONSHIP": "Đồng hành"
    },
    "names": {
      "SERVICE_HOMECARE_ORGANIZING": "Sắp xếp nhà cửa",
      "SERVICE_HOMECARE_COOKING": "Nấu ăn",
      "SERVICE_GROOMING_NAIL": "Làm móng",
      "SERVICE_GROOMING_FACIAL": "Chăm sóc da mặt",
      "SERVICE_GROOMING_BODY": "Chăm sóc cơ thể",
      "SERVICE_GROOMING_HAIRCARE": "Chăm sóc tóc",
      "SERVICE_ASSISTANCE_PERSONAL": "Trợ lý cá nhân",
      "SERVICE_ASSISTANCE_ONSITE": "Hỗ trợ chuyên nghiệp tại chỗ",
      "SERVICE_ASSISTANCE_VIRTUAL": "Trợ lý ảo",
      "SERVICE_ASSISTANCE_TOUR_GUIDE": "Hướng dẫn viên du lịch",
      "SERVICE_ASSISTANCE_INTERPRETER": "Phiên dịch",
      "SERVICE_COMPANIONSHIP_LEVEL_1": "Đồng hành - Cấp 1",
      "SERVICE_COMPANIONSHIP_LEVEL_2": "Đồng hành - Cấp 2",
      "SERVICE_COMPANIONSHIP_LEVEL_3": "Đồng hành - Cấp 3"
    },
    "options": {
      "COOKING_VIETNAMESE": "Ẩm thực Việt Nam",
      "COOKING_KOREAN": "Ẩm thực Hàn Quốc",
      "COOKING_JAPANESE": "Ẩm thực Nhật Bản",
      "COOKING_CHINESE": "Ẩm thực Trung Quốc",
      "COOKING_WESTERN": "Ẩm thực Phương Tây",
      "HAIRCARE_NON_CHEMICAL": "Chăm sóc tóc không hóa chất",
      "HAIRCARE_CHEMICAL": "Chăm sóc tóc có hóa chất",
      "INTERPRETER_VI_TO_EN": "Tiếng Việt → Tiếng Anh",
      "INTERPRETER_EN_TO_JA": "Tiếng Anh → Tiếng Nhật"
    }
  }
}
```

---

## 11. Best Practices

### 11.1. Enum Keys
- ✅ Luôn dùng UPPERCASE_SNAKE_CASE
- ✅ Prefix theo loại: `CATEGORY_`, `SERVICE_`, `COOKING_`, etc.
- ✅ Descriptive và dễ hiểu
- ❌ Không hard-code text đa ngôn ngữ trong DB

### 11.2. Slug
- ✅ lowercase-kebab-case
- ✅ URL-friendly
- ✅ Unique và immutable (không nên đổi sau khi deploy)

### 11.3. Pricing
- ✅ Lưu giá theo hourly rate
- ✅ Calculate tiers (daily/weekly/monthly) ở application layer
- ✅ Support discount cho long-term bookings
- ✅ Khi book nhiều services → charge highest price

### 11.4. Images
- ✅ Require admin approval trước khi public
- ✅ Store image metadata (size, dimensions)
- ✅ 1 avatar + nhiều gallery images
- ✅ Use Supabase Storage với proper RLS

### 11.5. Profile Status Flow
- ✅ draft → pending → approved/rejected → published
- ✅ Track completed steps với bitmask
- ✅ Admin có thể reject với reason
- ✅ Worker phải fix issues trước khi re-submit

---

## 12. Next Steps

1. ✅ Run migrations trong Supabase
2. ✅ Test RLS policies
3. ⏳ Implement API endpoints
4. ⏳ Create TypeScript types
5. ⏳ Build frontend UI cho profile setup
6. ⏳ Implement i18n cho service names
7. ⏳ Add admin approval workflow
8. ⏳ Build worker search/filter
9. ⏳ Implement booking system (future)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Author**: Claude AI
