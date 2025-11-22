# 🎨 SEO Settings Guide

Hướng dẫn sử dụng tính năng cài đặt SEO & Website trong Admin Panel.

## 🎯 Tổng quan

Hệ thống SEO Settings cho phép quản trị viên:

- ✅ Cấu hình SEO metadata (title, description, keywords, OG image)
- ✅ Quản lý Header settings (logo, tagline, contact info)
- ✅ Quản lý Footer settings (company info, social media links)
- ✅ Upload ảnh trực tiếp với Image Upload component
- ✅ Hỗ trợ đa ngôn ngữ (Vietnamese/English)
- ✅ Lưu trữ an toàn trong database

## 📦 Cấu trúc Files

```
pr1as/
├── app/
│   ├── admin/seo/
│   │   └── page.tsx                          # SEO Settings UI
│   └── api/admin/settings/seo/
│       └── route.ts                          # SEO API endpoints
├── components/common/
│   └── ImageUpload.tsx                       # Image upload component (with i18n)
├── lib/utils/
│   └── image-upload.ts                       # Upload utility functions
├── messages/
│   ├── vi.json                               # Vietnamese translations
│   └── en.json                               # English translations
└── docs/
    ├── SEO_SETTINGS_GUIDE.md                 # This file
    └── IMAGE_UPLOAD_GUIDE.md                 # Image upload documentation
```

## 🚀 Cách sử dụng

### 1. Truy cập Admin Panel

1. Đăng nhập với tài khoản admin
2. Truy cập `/admin/seo`
3. Bạn sẽ thấy 3 tabs: General SEO, Header Settings, Footer Settings

### 2. Cấu hình General SEO

**Các trường:**

- **Site Name**: Tên website (VD: PR1AS)
- **Site Title**: Tiêu đề trang (hiển thị trên browser tab)
- **Site Description**: Mô tả website cho SEO
- **Keywords**: Từ khóa phân cách bằng dấu phẩy
- **OG Image**: Hình ảnh Open Graph (dùng khi share link)

**Upload OG Image:**

```tsx
// Tự động upload qua ImageUpload component
// Chỉ cần click "Chọn ảnh" và chọn file
// Hỗ trợ: JPEG, PNG, WebP, GIF (max 5MB)
```

### 3. Cấu hình Header Settings

**Các trường:**

- **Logo URL**: Logo website (có thể upload trực tiếp)
- **Tagline**: Khẩu hiệu (VD: "Connect. Work. Succeed.")
- **Contact Phone**: Số điện thoại liên hệ
- **Contact Email**: Email liên hệ

**Upload Logo:**

```tsx
// Click "Chọn ảnh" trong trường Logo URL
// Chọn file logo (PNG với nền trong recommended)
// Logo tự động upload và URL được điền vào form
```

### 4. Cấu hình Footer Settings

**Các trường:**

- **Company Name**: Tên công ty
- **Address**: Địa chỉ công ty
- **Phone**: Số điện thoại
- **Email**: Email
- **About Text**: Giới thiệu ngắn về công ty
- **Copyright Text**: Text bản quyền

**Social Media Links:**

- Facebook URL
- Twitter URL
- Instagram URL
- LinkedIn URL

### 5. Lưu Settings

1. Điền đầy đủ thông tin vào form
2. Click nút **"Lưu tất cả cài đặt"**
3. Đợi thông báo thành công
4. Settings được lưu vào database và áp dụng ngay

## 🔧 API Endpoints

### GET `/api/admin/settings/seo`

Lấy SEO settings (public endpoint).

**Request:**

```bash
GET /api/admin/settings/seo
```

**Response:**

```json
{
  "data": {
    "siteName": "PR1AS",
    "siteTitle": "PR1AS - Platform",
    "siteDescription": "Description...",
    "siteKeywords": "keyword1, keyword2",
    "ogImage": "https://xxx.supabase.co/storage/v1/object/public/image/seo/...",
    "headerLogo": "https://xxx.supabase.co/storage/v1/object/public/image/logo/...",
    "headerTagline": "Connect. Work. Succeed.",
    "headerContactPhone": "+84...",
    "headerContactEmail": "contact@pr1as.com",
    "footerCompanyName": "PR1AS Ltd.",
    "footerAddress": "123 Street...",
    "footerPhone": "+84...",
    "footerEmail": "info@pr1as.com",
    "footerCopyright": "© 2025 PR1AS",
    "footerAbout": "About text...",
    "facebookUrl": "https://facebook.com/...",
    "twitterUrl": "https://twitter.com/...",
    "instagramUrl": "https://instagram.com/...",
    "linkedinUrl": "https://linkedin.com/..."
  }
}
```

### POST `/api/admin/settings/seo`

Cập nhật SEO settings (admin only).

**Request:**

```bash
POST /api/admin/settings/seo
Headers:
  Content-Type: application/json
Body:
{
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
  "success": true,
  "message": "SEO settings updated successfully"
}
```

**Error Response:**

```json
{
  "error": "Admin access required"
}
```

## 📁 Database Schema

Settings được lưu trong bảng `site_settings`:

```sql
CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,           -- 'seo_settings'
  value JSONB NOT NULL,                -- JSON object chứa settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Cấu trúc JSONB value:**

```json
{
  "siteName": "string",
  "siteTitle": "string",
  "siteDescription": "string",
  "siteKeywords": "string",
  "ogImage": "string (URL)",
  "headerLogo": "string (URL)",
  "headerTagline": "string",
  "headerContactPhone": "string",
  "headerContactEmail": "string",
  "footerCompanyName": "string",
  "footerAddress": "string",
  "footerPhone": "string",
  "footerEmail": "string",
  "footerCopyright": "string",
  "footerAbout": "string",
  "facebookUrl": "string",
  "twitterUrl": "string",
  "instagramUrl": "string",
  "linkedinUrl": "string"
}
```

## 🌐 Internationalization

### Translations Keys

**Vietnamese (vi.json):**

```json
{
  "admin": {
    "seo": {
      "title": "Cài đặt SEO & Website",
      "subtitle": "Cấu hình SEO metadata, header và footer cho website của bạn",
      "saveButton": "Lưu tất cả cài đặt",
      "saveSuccess": "Lưu cài đặt SEO thành công!",
      "saveFailed": "Không thể lưu cài đặt",
      "tabs": {
        "general": "SEO Chung",
        "header": "Cài đặt Header",
        "footer": "Cài đặt Footer"
      },
      "fields": {
        // ... field labels
      }
    }
  }
}
```

**English (en.json):**

```json
{
  "admin": {
    "seo": {
      "title": "SEO & Site Settings",
      "subtitle": "Configure SEO metadata, header, and footer settings for your website"
      // ... similar structure
    }
  }
}
```

## 🖼️ Image Upload Integration

SEO Settings page tích hợp `ImageUpload` component cho:

### 1. OG Image Upload

```tsx
<Form.Item label={t("admin.seo.fields.ogImage")} name="ogImage">
  <ImageUpload
    type="image"
    folder="seo"
    imageWidth="100%"
    imageHeight={200}
    buttonText={t("upload.image.button.choose")}
  />
</Form.Item>
```

**Features:**

- Hiển thị preview ảnh đã upload
- Nút "Chọn ảnh" để upload mới
- Nút "Xóa" để xóa ảnh hiện tại
- Validation: JPEG, PNG, WebP, GIF (max 5MB)
- Auto save URL vào form field

### 2. Header Logo Upload

```tsx
<Form.Item label={t("admin.seo.fields.headerLogo")} name="headerLogo">
  <ImageUpload
    type="image"
    folder="logo"
    imageWidth={300}
    imageHeight={100}
    buttonText={t("upload.image.button.choose")}
  />
</Form.Item>
```

**Recommended specs:**

- Format: PNG with transparent background
- Size: 300x100px hoặc tỷ lệ 3:1
- Max file size: 5MB

## 🔒 Security & Permissions

### Authentication

API endpoints yêu cầu:

1. **GET /api/admin/settings/seo**: Public (no auth required)
2. **POST /api/admin/settings/seo**: Admin only

### Authorization Check

```typescript
// Check if user is admin
const { data: userData } = await supabase
  .from("users")
  .select("role")
  .eq("id", user.id)
  .single();

if (userData?.role !== "admin") {
  return NextResponse.json({ error: "Admin access required" }, { status: 403 });
}
```

### File Upload Security

- Validation file type trước khi upload
- Giới hạn file size (5MB)
- Unique filename với userId và timestamp
- Lưu trữ trong Supabase Storage với RLS policies

## 📊 Usage Example

### Frontend Integration

```tsx
// Fetch SEO settings trong component
import { useEffect, useState } from "react";

function MyComponent() {
  const [seoSettings, setSeoSettings] = useState(null);

  useEffect(() => {
    async function fetchSettings() {
      const response = await fetch("/api/admin/settings/seo");
      const result = await response.json();
      setSeoSettings(result.data);
    }
    fetchSettings();
  }, []);

  return (
    <head>
      <title>{seoSettings?.siteTitle}</title>
      <meta name="description" content={seoSettings?.siteDescription} />
      <meta property="og:image" content={seoSettings?.ogImage} />
    </head>
  );
}
```

### Next.js Metadata Integration

```tsx
// app/layout.tsx
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/settings/seo`,
    {
      cache: "no-store",
    }
  );
  const { data } = await response.json();

  return {
    title: data.siteTitle,
    description: data.siteDescription,
    keywords: data.siteKeywords,
    openGraph: {
      images: [data.ogImage],
    },
  };
}
```

## 🐛 Troubleshooting

### Lỗi "Admin access required"

**Giải pháp:**

- Kiểm tra user đã login chưa
- Verify role = 'admin' trong database
- Check JWT token còn valid không

### Upload ảnh thất bại

**Giải pháp:**

1. Kiểm tra file size < 5MB
2. Verify file type (JPEG, PNG, WebP, GIF)
3. Check Supabase storage bucket "image" đã tạo chưa
4. Verify RLS policies cho storage

### Settings không lưu

**Giải pháp:**

1. Check console logs để xem error message
2. Verify database table `site_settings` đã tồn tại
3. Check permissions trên Supabase
4. Xem network tab để debug API request/response

### Ảnh không hiển thị

**Giải pháp:**

1. Verify bucket "image" có public = true
2. Check URL ảnh có đúng format không
3. Kiểm tra CORS settings trên Supabase
4. Try hard refresh (Ctrl+Shift+R)

## 📚 Related Documentation

- [Image Upload Guide](./IMAGE_UPLOAD_GUIDE.md) - Chi tiết về hệ thống upload ảnh
- [Admin API Documentation](./ADMIN_API.md) - Tất cả admin API endpoints
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage) - Supabase storage docs

## 🎉 Features Completed

- ✅ Full CRUD API cho SEO settings
- ✅ Admin UI với 3 tabs (General, Header, Footer)
- ✅ Image Upload integration (OG image, Logo)
- ✅ i18n support (Vietnamese/English)
- ✅ Form validation
- ✅ Loading states & error handling
- ✅ Database integration với JSONB
- ✅ Authentication & authorization
- ✅ Responsive design
- ✅ Success/error notifications

## 🚀 Next Steps

Có thể mở rộng thêm:

1. **Advanced SEO:**

   - Structured data (JSON-LD)
   - Robots.txt configuration
   - Sitemap settings

2. **Additional Images:**

   - Favicon upload
   - Multiple OG images for different pages
   - Logo variations (light/dark mode)

3. **Analytics Integration:**
   - Google Analytics ID
   - Facebook Pixel
   - Other tracking codes

Happy configuring! 🎨
