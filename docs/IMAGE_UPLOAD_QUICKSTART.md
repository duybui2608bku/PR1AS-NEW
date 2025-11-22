# 🚀 Image Upload - Quick Start

## Sử dụng nhanh trong 3 bước

### Bước 1: Import Component

```tsx
import ImageUpload from "@/components/common/ImageUpload";
```

### Bước 2: Sử dụng trong Form

```tsx
// Avatar Upload
<ImageUpload
  type="avatar"
  folder="avatar"
  value={avatarUrl}
  onChange={(url) => setAvatarUrl(url)}
/>

// General Image Upload
<ImageUpload
  type="image"
  folder="products"
  value={imageUrl}
  onChange={(url) => setImageUrl(url)}
/>
```

### Bước 3: Lưu URL vào Database

```tsx
// Sau khi upload, bạn sẽ nhận được URL
// Lưu URL này vào database của bạn
const handleSubmit = async () => {
  await updateProfile({
    avatar: avatarUrl, // Lưu URL này
  });
};
```

## 📦 Supabase Setup (Chỉ làm 1 lần)

1. Tạo bucket "image" trên Supabase Storage
2. Set bucket là **public**
3. Done! ✅

## 🎯 Use Cases

### 1. Avatar trong Profile

```tsx
<ImageUpload type="avatar" folder="avatar" avatarSize={120} />
```

### 2. Ảnh sản phẩm

```tsx
<ImageUpload type="image" folder="products" imageWidth={400} />
```

### 3. Multiple images

```tsx
{
  images.map((img, i) => <ImageUpload key={i} value={img} folder="gallery" />);
}
```

## 🔧 Common Props

| Prop       | Value                          | Description              |
| ---------- | ------------------------------ | ------------------------ |
| `type`     | `"avatar"` hoặc `"image"`      | Kiểu hiển thị            |
| `folder`   | `"avatar"`, `"products"`, etc. | Thư mục lưu trữ          |
| `value`    | URL string                     | Ảnh hiện tại             |
| `onChange` | function                       | Callback khi upload xong |

## ✅ Validation tự động

- ✅ Chỉ chấp nhận JPEG, PNG, WebP, GIF
- ✅ Max 5MB
- ✅ User phải đăng nhập
- ✅ Tự động tạo tên file unique

That's it! 🎉
