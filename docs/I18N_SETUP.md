# 🌍 i18n Setup Complete

## ✅ Đã cài đặt đa ngôn ngữ (i18n)

Hệ thống hiện hỗ trợ **4 ngôn ngữ**:

- 🇻🇳 **Tiếng Việt** (`vi`) - Mặc định
- 🇬🇧 **English** (`en`)
- 🇨🇳 **中文** (`zh`)
- 🇰🇷 **한국어** (`ko`)

## 📦 Công nghệ sử dụng

- **next-intl** - I18n library cho Next.js App Router
- **Middleware** tự động xử lý locale routing
- **Static generation** cho tất cả các locale

## 🗂️ Cấu trúc

```
app/
├── [locale]/               # Dynamic locale routing
│   ├── layout.tsx         # Layout với NextIntlClientProvider
│   ├── page.tsx           # Homepage
│   ├── auth/              # Auth pages
│   ├── banned/            # Banned page
│   ├── loading.tsx        # Loading state
│   ├── error.tsx          # Error page
│   └── not-found.tsx      # 404 page
├── globals.css            # Global styles
└── favicon.ico

i18n/
└── request.ts             # i18n configuration

messages/
├── vi.json                # Tiếng Việt
├── en.json                # English
├── zh.json                # 中文 (Chinese)
└── ko.json                # 한국어 (Korean)

middleware.ts              # Locale detection & routing
```

## 🔧 Cấu hình

### middleware.ts

- Tự động detect locale từ browser
- Default locale: `vi`
- Redirect `/` → `/vi`

### next.config.ts

- Tích hợp `next-intl` plugin

## 📝 Cách sử dụng

### 1. Trong Server Components

```tsx
import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("home");

  return (
    <div>
      <h1>{t("hero.title")}</h1>
      <p>{t("hero.subtitle")}</p>
    </div>
  );
}
```

### 2. Trong Client Components

```tsx
"use client";
import { useTranslations } from "next-intl";

export default function Button() {
  const t = useTranslations("common");

  return <button>{t("submit")}</button>;
}
```

### 3. Link giữa các trang

```tsx
import Link from 'next/link';

// Tự động giữ locale hiện tại
<Link href="/auth/login">Login</Link>

// Chuyển đổi locale
<Link href="/en/auth/login">Switch to English</Link>
```

## 🌐 URLs

Tất cả routes giờ có prefix locale:

- `http://localhost:3000/` → redirect → `/vi`
- `http://localhost:3000/vi` - Tiếng Việt
- `http://localhost:3000/en` - English
- `http://localhost:3000/zh` - 中文
- `http://localhost:3000/ko` - 한국어

### Examples:

- Homepage: `/vi`, `/en`, `/zh`, `/ko`
- Login: `/vi/auth/login`, `/en/auth/login`, etc.
- Signup: `/vi/auth/signup`, `/en/auth/signup`, etc.

## 📚 Translation Keys

### Common (messages/\*.json)

```json
{
  "common": {
    "loading": "...",
    "error": "...",
    "success": "..."
  },
  "nav": {
    "home": "...",
    "login": "...",
    "signup": "..."
  },
  "auth": {
    "login": { ... },
    "signup": { ... }
  },
  "home": {
    "hero": { ... },
    "features": { ... }
  }
}
```

## ➕ Thêm ngôn ngữ mới

1. **Thêm locale vào config**

```typescript
// i18n/request.ts
export const locales = ["vi", "en", "zh", "ko", "ja"] as const;
```

2. **Tạo file translation**

```bash
messages/ja.json
```

3. **Copy structure từ vi.json**

```json
{
  "common": { ... },
  "nav": { ... },
  ...
}
```

## 🎨 Language Switcher (TODO)

Tạo component để switch ngôn ngữ:

```tsx
"use client";
import { useRouter, usePathname } from "next/navigation";
import { locales } from "@/i18n/request";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <select onChange={(e) => switchLocale(e.target.value)}>
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {locale.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
```

## ✨ Best Practices

1. **Luôn dùng translation keys** thay vì hardcode text
2. **Tổ chức keys theo feature**: `auth.login.title`, `home.hero.title`
3. **Giữ structure nhất quán** giữa các file translation
4. **Test tất cả locales** trước khi deploy

## 🚀 Development

```bash
# Run dev server
npm run dev

# Test các URL
http://localhost:3000/vi
http://localhost:3000/en
http://localhost:3000/zh
http://localhost:3000/ko
```

---

**Hoàn thành!** i18n đã được setup đầy đủ với 4 ngôn ngữ 🎉
