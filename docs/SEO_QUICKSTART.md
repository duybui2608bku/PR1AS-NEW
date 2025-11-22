# 🚀 SEO Settings - Quick Start

**5 phút để setup SEO cho website!**

---

## ✅ Đã hoàn thành

- ✅ API Routes (`GET` và `POST /api/admin/settings/seo`)
- ✅ Admin UI với 3 tabs (General, Header, Footer)
- ✅ Image Upload cho OG Image và Logo
- ✅ i18n support (Vietnamese/English)
- ✅ Validation & Error handling
- ✅ **TESTED & WORKING!** ✨

---

## 🎯 Truy cập ngay

1. **Start dev server:**

   ```bash
   npm run dev
   ```

2. **Open Admin Panel:**

   - URL: http://localhost:3000/admin/seo
   - Login: Admin account required

3. **Configure:**
   - General SEO tab → Điền title, description, keywords
   - Upload OG Image → Click "Chọn ảnh" → Chọn file
   - Header Settings → Upload logo → Điền tagline, contact info
   - Footer Settings → Điền company info, social links
   - Click **"Lưu tất cả cài đặt"** → ✅ Done!

---

## 📸 Image Upload Features

### OG Image (Open Graph)

- **Vị trí:** General SEO tab
- **Folder:** `seo/`
- **Khuyến nghị:** 1200x630px, PNG/JPEG
- **Dùng cho:** Facebook, Twitter share preview

### Header Logo

- **Vị trí:** Header Settings tab
- **Folder:** `logo/`
- **Khuyến nghị:** 300x100px, PNG transparent
- **Dùng cho:** Website header/navbar

**Upload process:**

1. Click "Chọn ảnh"
2. Chọn file (max 5MB, JPEG/PNG/WebP/GIF)
3. Xem preview
4. URL tự động điền vào form
5. Click "Lưu tất cả cài đặt"

---

## 🔗 API Testing

### GET Settings (Public)

```bash
curl http://localhost:3000/api/admin/settings/seo
```

**Response:**

```json
{
  "data": {
    "siteName": "PR1AS",
    "siteTitle": "PR1AS - Platform",
    "ogImage": "https://...",
    "headerLogo": "https://...",
    ...
  }
}
```

### POST Settings (Admin only)

```bash
curl -X POST http://localhost:3000/api/admin/settings/seo \
  -H "Content-Type: application/json" \
  -d '{"settings": {...}}'
```

---

## 📝 Fields Reference

### General SEO

- `siteName` - Tên website (PR1AS)
- `siteTitle` - Title tag
- `siteDescription` - Meta description
- `siteKeywords` - Meta keywords
- `ogImage` - OG image URL (uploadable)

### Header

- `headerLogo` - Logo URL (uploadable)
- `headerTagline` - Tagline/slogan
- `headerContactPhone` - Số điện thoại
- `headerContactEmail` - Email

### Footer

- `footerCompanyName` - Tên công ty
- `footerAddress` - Địa chỉ
- `footerPhone` - Phone
- `footerEmail` - Email
- `footerAbout` - Giới thiệu
- `footerCopyright` - Copyright text
- `facebookUrl`, `twitterUrl`, `instagramUrl`, `linkedinUrl`

---

## 🌍 Multi-language

Component tự động detect ngôn ngữ:

**Vietnamese:**

- Button: "Tải ảnh lên" / "Thay đổi ảnh"
- Messages: "Tải ảnh lên thành công!"

**English:**

- Button: "Upload Image" / "Change Image"
- Messages: "Image uploaded successfully!"

---

## 📚 Full Documentation

- **[SEO Settings Guide](./SEO_SETTINGS_GUIDE.md)** - Hướng dẫn chi tiết
- **[Image Upload Guide](./IMAGE_UPLOAD_GUIDE.md)** - Chi tiết upload system
- **[Completion Summary](./SEO_COMPLETION_SUMMARY.md)** - Tóm tắt hoàn thành

---

## 🎉 That's it!

**Status:** ✅ Production Ready

**Next:** Integrate vào layout.tsx để apply SEO cho toàn site!

```tsx
// app/layout.tsx example
export async function generateMetadata() {
  const res = await fetch(`${siteUrl}/api/admin/settings/seo`);
  const { data } = await res.json();

  return {
    title: data.siteTitle,
    description: data.siteDescription,
    openGraph: { images: [data.ogImage] },
  };
}
```

Happy building! 🚀
