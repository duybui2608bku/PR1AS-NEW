# 📸 Image Upload System Guide

Hướng dẫn sử dụng hệ thống upload ảnh lên Supabase Storage.

## 🎯 Tổng quan

Hệ thống upload ảnh được xây dựng hoàn chỉnh với:

- ✅ API route để xử lý upload/delete ảnh
- ✅ Component React để tương tác với người dùng
- ✅ Validation file (type, size)
- ✅ Hỗ trợ nhiều loại display (avatar, image)
- ✅ Tích hợp i18n (Tiếng Việt/English)
- ✅ Loading states và error handling

## 📦 Cấu trúc Files

```
pr1as/
├── app/api/upload/image/
│   └── route.ts                              # API endpoint
├── components/common/
│   ├── ImageUpload.tsx                       # Component chính
│   └── ImageUpload.example.tsx              # Examples
├── lib/utils/
│   └── image-upload.ts                      # Utility functions
└── docs/
    └── IMAGE_UPLOAD_GUIDE.md                # Tài liệu này
```

## 🚀 Cài đặt Supabase Storage

### 1. Tạo Bucket trên Supabase

1. Truy cập Supabase Dashboard: https://app.supabase.com
2. Chọn project của bạn
3. Vào **Storage** > **Create a new bucket**
4. Đặt tên: `image`
5. **Public bucket**: Chọn `true` (để có thể truy cập public URLs)
6. Click **Create bucket**

### 2. Cấu hình Storage Policies

Để người dùng có thể upload và delete ảnh của chính họ, bạn cần thêm RLS policies:

```sql
-- Policy: Anyone can view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'image');

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'image');

-- Policy: Users can update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'image' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'image' AND auth.uid()::text = (storage.foldername(name))[1]);
```

Hoặc đơn giản hơn, bạn có thể disable RLS tạm thời (chỉ dùng cho development):

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

⚠️ **Lưu ý**: Trong production, bạn NÊN sử dụng RLS policies để bảo mật.

## 📝 Cách sử dụng

### 1. Upload Avatar

```tsx
import ImageUpload from "@/components/common/ImageUpload";
import { useState } from "react";

export default function ProfilePage() {
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [avatarPath, setAvatarPath] = useState<string>();

  return (
    <ImageUpload
      type="avatar"
      folder="avatar"
      value={avatarUrl}
      onChange={(url, path) => {
        setAvatarUrl(url);
        setAvatarPath(path);
        // Lưu vào database nếu cần
        // updateUserProfile({ avatar: url });
      }}
      avatarSize={120}
      showDelete={true}
    />
  );
}
```

### 2. Upload General Image

```tsx
import ImageUpload from "@/components/common/ImageUpload";
import { useState } from "react";

export default function PostForm() {
  const [imageUrl, setImageUrl] = useState<string>();

  return (
    <ImageUpload
      type="image"
      folder="posts"
      value={imageUrl}
      onChange={(url) => {
        setImageUrl(url);
      }}
      imageWidth={400}
      imageHeight={300}
      buttonText="Chọn ảnh bài viết"
    />
  );
}
```

### 3. Upload Product Images

```tsx
import ImageUpload from "@/components/common/ImageUpload";
import { Form } from "antd";

export default function ProductForm() {
  return (
    <Form>
      <Form.Item label="Ảnh sản phẩm" name="image">
        <ImageUpload
          type="image"
          folder="products"
          imageWidth="100%"
          buttonText="Tải ảnh sản phẩm"
        />
      </Form.Item>
    </Form>
  );
}
```

### 4. Multiple Images Upload

```tsx
import ImageUpload from "@/components/common/ImageUpload";
import { useState } from "react";

export default function GalleryForm() {
  const [images, setImages] = useState<Array<{ url: string; path: string }>>(
    []
  );

  const handleAddImage = (url: string | undefined, path?: string) => {
    if (url && path) {
      setImages([...images, { url, path }]);
    }
  };

  return (
    <div>
      {images.map((img, index) => (
        <ImageUpload
          key={index}
          type="image"
          folder="gallery"
          value={img.url}
          onChange={(url, path) => {
            if (!url) {
              // Remove image
              setImages(images.filter((_, i) => i !== index));
            }
          }}
        />
      ))}

      <ImageUpload
        type="image"
        folder="gallery"
        onChange={handleAddImage}
        buttonText="Thêm ảnh"
        showDelete={false}
      />
    </div>
  );
}
```

## 🎨 Component Props

### ImageUpload Props

| Prop          | Type                                    | Default     | Description                               |
| ------------- | --------------------------------------- | ----------- | ----------------------------------------- |
| `value`       | `string`                                | `undefined` | URL của ảnh hiện tại                      |
| `onChange`    | `(url?: string, path?: string) => void` | `undefined` | Callback khi ảnh thay đổi                 |
| `folder`      | `string`                                | `"general"` | Thư mục lưu trữ (avatar, products, etc.)  |
| `type`        | `"avatar" \| "image"`                   | `"image"`   | Loại hiển thị                             |
| `avatarSize`  | `number`                                | `100`       | Kích thước avatar (chỉ cho type="avatar") |
| `imageWidth`  | `number \| string`                      | `"100%"`    | Chiều rộng ảnh                            |
| `imageHeight` | `number \| string`                      | `"auto"`    | Chiều cao ảnh                             |
| `showDelete`  | `boolean`                               | `true`      | Hiển thị nút xóa                          |
| `buttonText`  | `string`                                | auto        | Text tùy chỉnh cho button                 |
| `accept`      | `string`                                | `"image/*"` | Loại file chấp nhận                       |

## 🔧 API Endpoints

### POST /api/upload/image

Upload ảnh lên Supabase Storage.

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: File object (required)
  - `folder`: Folder name (optional, default: "general")

**Response:**

```json
{
  "success": true,
  "data": {
    "path": "avatar/user123_1234567890_abc123.jpg",
    "publicUrl": "https://xxx.supabase.co/storage/v1/object/public/image/avatar/...",
    "fileName": "avatar/user123_1234567890_abc123.jpg"
  }
}
```

**Validation:**

- File types: JPEG, JPG, PNG, WebP, GIF
- Max size: 5MB
- Authentication: Required

### DELETE /api/upload/image

Xóa ảnh từ Supabase Storage.

**Request:**

- Method: `DELETE`
- Query params:
  - `path`: File path trong storage (required)

**Response:**

```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## 🛠️ Utility Functions

### `uploadImage(file, folder)`

Upload ảnh lên server.

```ts
import { uploadImage } from "@/lib/utils/image-upload";

const result = await uploadImage(file, "avatar");
if (result.success) {
  console.log("URL:", result.data?.publicUrl);
}
```

### `deleteImage(filePath)`

Xóa ảnh từ server.

```ts
import { deleteImage } from "@/lib/utils/image-upload";

const result = await deleteImage("avatar/user123_xxx.jpg");
if (result.success) {
  console.log("Deleted!");
}
```

### `validateImage(file)`

Validate file trước khi upload.

```ts
import { validateImage } from "@/lib/utils/image-upload";

const validation = validateImage(file);
if (!validation.valid) {
  alert(validation.error);
}
```

## 📁 Cấu trúc Folder

Ảnh được tổ chức theo folders trong bucket "image":

```
image/
├── avatar/              # Ảnh đại diện người dùng
│   ├── userId_timestamp_random.jpg
│   └── ...
├── products/            # Ảnh sản phẩm/dịch vụ
│   ├── userId_timestamp_random.jpg
│   └── ...
├── posts/               # Ảnh bài viết
│   └── ...
├── gallery/             # Ảnh gallery
│   └── ...
└── general/             # Ảnh chung
    └── ...
```

File naming pattern: `{userId}_{timestamp}_{randomString}.{extension}`

## 🌐 Internationalization (i18n)

Hệ thống hỗ trợ đa ngôn ngữ thông qua i18n - **Component tự động sử dụng i18n!**

### ✅ Auto i18n Support

Component `ImageUpload` tự động sử dụng translation keys:

```tsx
// Component tự động detect ngôn ngữ và hiển thị đúng message
<ImageUpload
  type="image"
  folder="products"
  // Không cần truyền buttonText, tự động dùng i18n
/>
```

### Translation Keys

**Vietnamese (messages/vi.json):**

```json
{
  "upload": {
    "image": {
      "button": {
        "upload": "Tải ảnh lên",
        "change": "Thay đổi ảnh",
        "delete": "Xóa",
        "choose": "Chọn ảnh"
      },
      "messages": {
        "uploadSuccess": "Tải ảnh lên thành công!",
        "uploadFailed": "Tải ảnh lên thất bại",
        "deleteSuccess": "Xóa ảnh thành công!",
        "deleteFailed": "Xóa ảnh thất bại",
        "invalidType": "Chỉ hỗ trợ định dạng JPEG, PNG, WebP và GIF.",
        "fileTooLarge": "Kích thước file không được vượt quá 5MB.",
        "uploadError": "Có lỗi xảy ra khi tải ảnh lên",
        "deleteError": "Có lỗi xảy ra khi xóa ảnh"
      }
    }
  }
}
```

**English (messages/en.json):**

```json
{
  "upload": {
    "image": {
      "button": {
        "upload": "Upload Image",
        "change": "Change Image",
        "delete": "Delete",
        "choose": "Choose Image"
      },
      "messages": {
        "uploadSuccess": "Image uploaded successfully!",
        "uploadFailed": "Failed to upload image",
        "deleteSuccess": "Image deleted successfully!",
        "deleteFailed": "Failed to delete image",
        "invalidType": "Only JPEG, PNG, WebP, and GIF formats are supported.",
        "fileTooLarge": "File size must not exceed 5MB.",
        "uploadError": "An error occurred while uploading the image",
        "deleteError": "An error occurred while deleting the image"
      }
    }
  }
}
```

### Custom Button Text

Nếu muốn override text mặc định:

```tsx
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();

  return (
    <ImageUpload
      type="image"
      folder="products"
      buttonText="Upload Product Photo" // Custom text
    />
  );
}
```

### Validation Messages with i18n

Validation errors tự động dùng i18n:

```tsx
// validateImage() function tự động nhận i18n messages từ component
const validation = validateImage(file, {
  invalidType: t("upload.image.messages.invalidType"),
  fileTooLarge: t("upload.image.messages.fileTooLarge"),
});
```

## 🔒 Security Best Practices

1. **Authentication**: API endpoint yêu cầu user phải đăng nhập
2. **File Validation**:
   - Kiểm tra file type
   - Giới hạn file size (5MB)
3. **File Naming**: Tự động tạo tên file unique để tránh conflict
4. **RLS Policies**: Sử dụng Supabase RLS để bảo vệ storage
5. **User Isolation**: File naming bao gồm userId để phân quyền

## 🧪 Testing

Để test hệ thống upload:

1. Start dev server: `npm run dev`
2. Truy cập example page hoặc tạo component test
3. Thử upload các loại file:
   - ✅ Valid: JPEG, PNG, WebP, GIF
   - ❌ Invalid: PDF, TXT, etc.
4. Thử upload file lớn (> 5MB) để kiểm tra validation
5. Kiểm tra delete functionality

## 🐛 Troubleshooting

### Lỗi "Missing Supabase environment variables"

**Giải pháp**: Kiểm tra file `.env.local` có đầy đủ:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Lỗi "Failed to upload image: new row violates row-level security policy"

**Giải pháp**: Kiểm tra RLS policies trên Supabase Storage hoặc disable RLS tạm thời.

### Ảnh upload không hiển thị

**Giải pháp**:

1. Kiểm tra bucket "image" có public không
2. Kiểm tra URL ảnh có đúng không
3. Kiểm tra CORS settings trên Supabase

### Upload thành công nhưng không thấy file trên Supabase

**Giải pháp**:

1. Refresh Storage page trên Supabase Dashboard
2. Kiểm tra bucket name có đúng là "image" không
3. Kiểm tra logs để xem error message

## 📚 Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#formdata)
- [Ant Design Upload](https://ant.design/components/upload)

## 🎉 Kết luận

Hệ thống upload ảnh đã sẵn sàng sử dụng! Bạn có thể:

- ✅ Upload ảnh đại diện (avatar)
- ✅ Upload ảnh sản phẩm
- ✅ Upload bất kỳ loại ảnh nào
- ✅ Xóa ảnh
- ✅ Validation và error handling
- ✅ Hỗ trợ đa ngôn ngữ

Happy coding! 🚀
