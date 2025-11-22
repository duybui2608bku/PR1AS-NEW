# 🎯 Quick Reference - Cấu Trúc Mới

## 📊 So Sánh Trước/Sau

### ❌ TRƯỚC (Cũ)
```
app/page.tsx - 617 dòng code
├── Hero Section (120 dòng)
├── Statistics (45 dòng)
├── Features (80 dòng)
├── Categories (70 dòng)
├── How It Works (90 dòng)
├── Testimonials (100 dòng)
├── Trust Badges (50 dòng)
└── CTA Section (62 dòng)
```
**Vấn đề**: Khó đọc, khó maintain, không tái sử dụng được

### ✅ SAU (Mới)
```
app/page.tsx - 28 dòng (giảm 96%!)

features/home/
├── components/
│   ├── HeroSection.tsx (157 dòng)
│   ├── StatisticsSection.tsx (28 dòng)
│   ├── FeaturesSection.tsx (95 dòng)
│   ├── CategoriesSection.tsx (58 dòng)
│   ├── HowItWorksSection.tsx (51 dòng)
│   ├── TestimonialsSection.tsx (67 dòng)
│   ├── TrustBadgesSection.tsx (42 dòng)
│   ├── CTASection.tsx (57 dòng)
│   └── index.ts (barrel export)
├── constants.tsx (95 dòng - tất cả data)
├── types.ts (21 dòng)
└── index.ts
```
**Lợi ích**: Rõ ràng, dễ maintain, có thể tái sử dụng

## 🚀 Cách Sử Dụng

### Import Components
```typescript
// ✅ Cách mới - Clean & Simple
import {
  HeroSection,
  StatisticsSection,
  FeaturesSection,
} from "@/features/home/components";

// ❌ Cách cũ - Dài dòng
import HeroSection from "@/features/home/components/HeroSection";
import StatisticsSection from "@/features/home/components/StatisticsSection";
```

### Sử Dụng trong Page
```typescript
export default function Home() {
  return (
    <MainLayout>
      <HeroSection />
      <StatisticsSection />
      <FeaturesSection />
      {/* ... */}
    </MainLayout>
  );
}
```

## 📁 Khi Nào Đặt Component Ở Đâu?

### `features/[feature]/components/` - Khi:
- ✅ Component chỉ dùng cho 1 feature cụ thể
- ✅ Có business logic riêng của feature
- ✅ Sử dụng constants/types của feature

**Ví dụ**: `HeroSection` chỉ dùng cho trang Home

### `components/` - Khi:
- ✅ Component dùng chung nhiều page
- ✅ UI thuần túy, không có business logic
- ✅ Có thể tái sử dụng ở nhiều nơi

**Ví dụ**: `Header`, `Footer`, `LanguageSwitcher`

## 🔄 Quy Trình Thêm Section Mới

1. **Tạo file component**
```bash
features/home/components/NewSection.tsx
```

2. **Export trong index.ts**
```typescript
// features/home/components/index.ts
export { default as NewSection } from "./NewSection";
```

3. **Sử dụng trong page**
```typescript
// app/page.tsx
import { NewSection } from "@/features/home/components";

export default function Home() {
  return (
    <MainLayout>
      <NewSection />
    </MainLayout>
  );
}
```

## 💡 Tips & Best Practices

### 1. Component Template
```typescript
import { Typography } from "antd";

const { Title } = Typography;

export default function MySection() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        <Title level={2}>My Section</Title>
        {/* Content */}
      </div>
    </section>
  );
}
```

### 2. Sử Dụng Constants
```typescript
// ❌ Hardcode
const data = ["Item 1", "Item 2"];

// ✅ Dùng constants
import { MY_DATA } from "../constants";
```

### 3. Type Safety
```typescript
// features/home/types.ts
export interface MyItem {
  id: number;
  title: string;
}

// Component
import type { MyItem } from "../types";

function MyComponent({ item }: { item: MyItem }) {
  // ...
}
```

## 📂 Cấu Trúc Folders Hoàn Chỉnh

```
pr1as/
├── app/                     # Pages
├── features/                # ⭐ Features (NEW!)
│   └── home/
│       ├── components/      # UI Components
│       ├── constants.tsx    # Data
│       ├── types.ts         # Types
│       └── index.ts         # Exports
├── components/              # Shared Components
├── lib/                     # Utils
├── types/                   # ⭐ Global Types (NEW!)
└── i18n/                    # Translations
```

## 🎨 Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | `HeroSection.tsx` |
| Constants | UPPER_SNAKE | `TESTIMONIALS` |
| Types | PascalCase | `Testimonial` |
| Utils | camelCase | `formatDate.ts` |

## 🔍 File Sizes - Sau Refactor

| File | Dòng Code | Status |
|------|-----------|--------|
| `app/page.tsx` | 28 | ✅ Excellent |
| `HeroSection.tsx` | 157 | ✅ Good |
| `StatisticsSection.tsx` | 28 | ✅ Excellent |
| `FeaturesSection.tsx` | 95 | ✅ Good |
| `constants.tsx` | 95 | ✅ Good |

**Nguyên tắc**: Mỗi file < 200 dòng = dễ đọc & maintain

## ✨ Tóm Tắt

- ✅ **617 dòng** → **28 dòng** trong `app/page.tsx`
- ✅ Mỗi section = 1 component riêng
- ✅ Data tách riêng vào `constants.tsx`
- ✅ Types được định nghĩa rõ ràng
- ✅ Dễ test, debug, mở rộng
- ✅ Cấu trúc rõ ràng, dễ tìm kiếm

---

📚 **Xem thêm**: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) để biết chi tiết đầy đủ
