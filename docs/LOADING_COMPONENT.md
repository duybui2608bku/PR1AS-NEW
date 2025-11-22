# Loading Component Guide

## Tổng quan

Component Loading dùng chung cho toàn site, hỗ trợ nhiều variant và có thể tùy chỉnh.

## Cài đặt

Component đã được tích hợp sẵn trong project. Import và sử dụng:

```typescript
import Loading from "@/components/common/Loading";
// hoặc
import { FullPageLoading, InlineLoading, SkeletonLoading } from "@/components/common/Loading";
```

## Các Variant

### 1. Spinner (Mặc định)
Loading spinner đơn giản, dùng cho các trường hợp nhỏ.

```tsx
<Loading />
<Loading size="small" />
<Loading size="large" />
```

### 2. Full Page
Loading toàn màn hình, dùng cho page transitions hoặc initial load.

```tsx
<Loading variant="fullPage" size="large" tip="Đang tải trang..." />
```

**Tự động sử dụng:**
- Next.js tự động dùng `app/loading.tsx` cho route-level loading
- Các route cụ thể: `app/admin/loading.tsx`, `app/client/loading.tsx`, `app/worker/loading.tsx`

### 3. Inline
Loading trong container, dùng cho sections hoặc cards.

```tsx
<Loading variant="inline" size="default" tip="Đang tải dữ liệu..." />
<Loading variant="inline" fullHeight />
```

### 4. Card
Loading trong card container, có padding và min-height.

```tsx
<Loading variant="card" size="large" tip="Đang tải..." />
```

### 5. Skeleton
Skeleton loading, hiển thị placeholder cho content.

```tsx
<Loading variant="skeleton" skeletonRows={5} />
```

## Props

| Prop | Type | Default | Mô tả |
|------|------|---------|-------|
| `variant` | `"spinner" \| "fullPage" \| "inline" \| "skeleton" \| "card"` | `"spinner"` | Loại loading |
| `size` | `"small" \| "default" \| "large"` | `"default"` | Kích thước spinner |
| `tip` | `string` | `t("common.loading")` | Text hiển thị |
| `fullHeight` | `boolean` | `false` | Full height cho inline variant |
| `className` | `string` | `""` | CSS class tùy chỉnh |
| `style` | `CSSProperties` | `undefined` | Inline styles |
| `skeletonRows` | `number` | `3` | Số dòng skeleton (chỉ cho skeleton variant) |

## Ví dụ sử dụng

### Trong Component

```tsx
function MyComponent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Loading variant="card" size="large" tip="Đang tải dữ liệu..." />;
  }

  return <div>{/* Content */}</div>;
}
```

### Với Suspense

```tsx
import { Suspense } from "react";
import Loading from "@/components/common/Loading";

export default function Page() {
  return (
    <Suspense fallback={<Loading variant="fullPage" />}>
      <AsyncComponent />
    </Suspense>
  );
}
```

### Inline Loading

```tsx
function DataTable() {
  const [loading, setLoading] = useState(false);

  return (
    <Card>
      {loading ? (
        <Loading variant="inline" fullHeight />
      ) : (
        <Table dataSource={data} />
      )}
    </Card>
  );
}
```

### Skeleton Loading

```tsx
function ProfileCard() {
  const [loading, setLoading] = useState(true);

  return (
    <Card>
      {loading ? (
        <Loading variant="skeleton" skeletonRows={4} />
      ) : (
        <ProfileContent />
      )}
    </Card>
  );
}
```

## Convenience Components

Để code ngắn gọn hơn, có thể dùng các convenience components:

```tsx
import { FullPageLoading, InlineLoading, SkeletonLoading } from "@/components/common/Loading";

// Thay vì
<Loading variant="fullPage" />

// Có thể dùng
<FullPageLoading tip="Đang tải..." />
```

## Next.js Route Loading

Next.js tự động sử dụng `loading.tsx` trong mỗi route segment:

```
app/
├── loading.tsx          # Root loading
├── admin/
│   └── loading.tsx      # Admin routes loading
├── client/
│   └── loading.tsx     # Client routes loading
└── worker/
    └── loading.tsx     # Worker routes loading
```

## Styling

Component sử dụng CSS variables từ `globals.css`:
- `--color-primary`: Màu spinner
- `--text-secondary`: Màu text tip

Có thể override bằng `style` prop hoặc `className`.

## Best Practices

1. **Full Page Loading**: Dùng cho page transitions và initial loads
2. **Inline Loading**: Dùng cho sections, cards, tables
3. **Skeleton Loading**: Dùng khi muốn hiển thị layout structure
4. **Spinner**: Dùng cho buttons, small actions

## Animation

Component có sẵn fade-in animation. CSS animations được định nghĩa trong `globals.css`:
- `.loading-full-page`: fadeIn 0.3s
- `.loading-inline`, `.loading-card`, `.loading-spinner`: fadeIn 0.2s

