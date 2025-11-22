# 📁 Cấu Trúc Project PR1AS

## 📂 Tổng Quan Folder Structure

```
pr1as/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Trang chủ (chỉ 28 dòng!)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   └── banned/
│
├── features/                     # 🆕 Feature-based modules
│   └── home/                     # Home page feature
│       ├── components/           # Home page components
│       │   ├── index.ts          # Barrel export
│       │   ├── HeroSection.tsx
│       │   ├── StatisticsSection.tsx
│       │   ├── FeaturesSection.tsx
│       │   ├── CategoriesSection.tsx
│       │   ├── HowItWorksSection.tsx
│       │   ├── TestimonialsSection.tsx
│       │   ├── TrustBadgesSection.tsx
│       │   └── CTASection.tsx
│       ├── constants.tsx         # Data constants
│       ├── types.ts              # TypeScript types
│       └── index.ts              # Feature barrel export
│
├── components/                   # Shared/Common components
│   ├── common/
│   │   └── LanguageSwitcher.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MainLayout.tsx
│   └── providers/
│       └── I18nProvider.tsx
│
├── lib/                          # Utilities & configurations
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils/
│       └── toast.ts
│
├── types/                        # 🆕 Global TypeScript types
│
├── i18n/                         # Internationalization
│   └── config.ts
│
├── messages/                     # i18n translation files
│   ├── en.json
│   ├── ko.json
│   ├── vi.json
│   └── zh.json
│
└── public/                       # Static assets
```

## 🎯 Nguyên Tắc Tổ Chức

### 1. **Feature-Based Architecture**

Mỗi feature (trang hoặc module lớn) có folder riêng trong `features/`:

- ✅ Dễ tìm kiếm và maintain
- ✅ Tách biệt logic theo chức năng
- ✅ Có thể tái sử dụng hoặc xóa bỏ dễ dàng

### 2. **Component Organization**

- **`features/[feature]/components/`**: Components chỉ dùng cho feature đó
- **`components/`**: Shared components dùng chung cho nhiều feature

### 3. **Data & Types Separation**

- **`constants.tsx`**: Chứa tất cả data tĩnh (testimonials, categories, steps, etc.)
- **`types.ts`**: TypeScript interfaces và types
- **`types/`** (root): Global types dùng chung toàn project

### 4. **Barrel Exports**

Sử dụng `index.ts` để export components:

```typescript
// Thay vì import từng file
import HeroSection from "@/features/home/components/HeroSection";
import FeaturesSection from "@/features/home/components/FeaturesSection";

// Chỉ cần một import
import { HeroSection, FeaturesSection } from "@/features/home/components";
```

## 📊 Lợi Ích Của Cấu Trúc Mới

### ✅ Trước Refactor

- **app/page.tsx**: 617 dòng ❌
- Khó bảo trì, tìm kiếm
- Logic và UI lẫn lộn
- Không thể tái sử dụng

### ✅ Sau Refactor

- **app/page.tsx**: 28 dòng ✅
- Mỗi section = 1 component riêng biệt
- Data tách riêng trong `constants.tsx`
- Types được định nghĩa rõ ràng
- Dễ test, debug và mở rộng

## 🚀 Cách Thêm Feature Mới

### Ví dụ: Thêm trang "Services"

1. **Tạo folder structure**

```
features/
└── services/
    ├── components/
    │   ├── index.ts
    │   ├── ServicesHero.tsx
    │   ├── ServicesList.tsx
    │   └── ServiceDetails.tsx
    ├── constants.ts
    ├── types.ts
    └── index.ts
```

2. **Tạo page**

```typescript
// app/services/page.tsx
import { ServicesHero, ServicesList } from "@/features/services/components";

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />
      <ServicesList />
    </>
  );
}
```

## 📝 Naming Conventions

- **Components**: PascalCase (e.g., `HeroSection.tsx`)
- **Utils/Helpers**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `TESTIMONIALS`)
- **Types**: PascalCase with descriptive names (e.g., `Testimonial`, `Category`)

## 🔄 Import Patterns

### ✅ Recommended

```typescript
// Sử dụng barrel exports
import { HeroSection, FeaturesSection } from "@/features/home/components";
import { TESTIMONIALS, CATEGORIES } from "@/features/home/constants";
```

### ❌ Tránh

```typescript
// Import trực tiếp từng file
import HeroSection from "@/features/home/components/HeroSection";
import FeaturesSection from "@/features/home/components/FeaturesSection";
```

## 🎨 Component Structure Template

```typescript
// features/[feature]/components/ComponentName.tsx
import { Typography, Row, Col } from "antd";
import { SomeIcon } from "@ant-design/icons";
import { DATA_CONSTANT } from "../constants";
import type { SomeType } from "../types";

const { Title, Paragraph } = Typography;

export default function ComponentName() {
  return <section className="py-20">{/* Component content */}</section>;
}
```

## 📚 Best Practices

1. **Một Component = Một Trách Nhiệm**: Mỗi component chỉ làm một việc
2. **Props > Hardcode**: Ưu tiên dùng props thay vì hardcode giá trị
3. **Types First**: Định nghĩa types trước khi code
4. **Reusable**: Thiết kế component có thể tái sử dụng
5. **Documentation**: Comment cho logic phức tạp

## 🔍 Testing Strategy

```
features/
└── home/
    ├── components/
    │   ├── HeroSection.tsx
    │   └── __tests__/
    │       └── HeroSection.test.tsx
    └── __tests__/
        ├── constants.test.ts
        └── types.test.ts
```

## 📖 Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Ant Design Components](https://ant.design/components/overview/)

---

**Cập nhật lần cuối**: 2025-11-17
**Version**: 2.0.0
