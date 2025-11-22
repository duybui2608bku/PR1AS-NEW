# 🎨 Design System - PR1AS

## Typography

### Font Family

```css
font-family: "JetBrains Mono", monospace;
```

- **Primary Font**: JetBrains Mono
- **Fallback**: monospace
- **Weights Available**: 100-800 (thin to extra bold)
- **Supports**: Regular & Italic
- **Character**: Modern, clean, technical look

### Font Variables

```css
--font-primary: "JetBrains Mono", monospace;
--font-mono: "JetBrains Mono", monospace;
```

### Font Import

```css
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap");
```

---

## Màu Sắc Chủ Đạo

### Primary Color (Màu Chính)

```css
--color-primary: #690f0f;
```

- **Hex**: `#690F0F`
- **RGB**: `rgb(105, 15, 15)`
- **Sử dụng**: Buttons, CTA, Links, Accents, Gradients

### Primary Hover

```css
--color-primary-hover: #4a0a0a;
```

- **Hex**: `#4a0a0a`
- **RGB**: `rgb(74, 10, 10)`
- **Sử dụng**: Hover states cho primary elements

### Primary Light (Background)

```css
--color-primary-light: #fef2f2;
```

- **Hex**: `#fef2f2`
- **RGB**: `rgb(254, 242, 242)`
- **Sử dụng**: Light backgrounds, highlights, icon containers

### Primary Text

```css
--color-primary-text: #ffffff;
```

- **Hex**: `#FFFFFF`
- **RGB**: `rgb(255, 255, 255)`
- **Sử dụng**: Text trên primary background (buttons, hero sections)

---

## Màu Phụ (Secondary)

### Secondary Color

```css
--color-secondary: #ffffff;
```

- **Hex**: `#FFFFFF`
- **RGB**: `rgb(255, 255, 255)`
- **Sử dụng**: Secondary buttons, cards, backgrounds

### Secondary Text

```css
--color-secondary-text: #690f0f;
```

- **Hex**: `#690F0F`
- **RGB**: `rgb(105, 15, 15)`
- **Sử dụng**: Text trên secondary/white backgrounds

---

## Gradients

### Primary Gradient

```css
--gradient-primary: linear-gradient(90deg, #690f0f 0%, #4a0a0a 100%);
```

- **Sử dụng**: Horizontal gradients, buttons, bars

### Hero Gradient

```css
--gradient-hero: linear-gradient(135deg, #690f0f 0%, #8b1818 100%);
```

- **Sử dụng**: Hero sections, featured backgrounds

---

## Cách Sử Dụng

### 1. Primary Buttons (Màu đỏ, text trắng)

```tsx
<Button
  type="primary"
  className="!bg-[#690F0F] !text-white hover:!bg-[#4a0a0a]"
>
  Primary Action
</Button>
```

### 2. Secondary Buttons (Màu trắng, text đỏ)

```tsx
<Button className="!bg-white !text-[#690F0F] !border-[#690F0F] hover:!bg-gray-50">
  Secondary Action
</Button>
```

### 3. Gradient Backgrounds

```tsx
<section className="bg-gradient-to-br from-[#690F0F] via-[#8B1818] to-[#690F0F]">
  {/* Content */}
</section>
```

### 4. Icons & Accents

```tsx
<Icon className="text-[#690F0F]" />
```

### 5. Light Backgrounds

```tsx
<div className="bg-[#fef2f2] p-6">
  {/* Content with light red background */}
</div>
```

---

## Color Palette

| Color              | Hex       | Preview | Usage             |
| ------------------ | --------- | ------- | ----------------- |
| **Primary**        | `#690F0F` | 🟥      | Main brand color  |
| **Primary Hover**  | `#4a0a0a` | ⬛      | Hover states      |
| **Primary Light**  | `#fef2f2` | 🔲      | Backgrounds       |
| **Primary Text**   | `#FFFFFF` | ⬜      | Text on primary   |
| **Secondary**      | `#FFFFFF` | ⬜      | White backgrounds |
| **Secondary Text** | `#690F0F` | 🟥      | Text on white     |
| **Gradient Start** | `#690F0F` | 🟥      | Gradient left     |
| **Gradient End**   | `#8B1818` | 🔴      | Gradient right    |

---

## Contrast Ratios (WCAG Compliance)

| Combination            | Ratio  | Status |
| ---------------------- | ------ | ------ |
| `#690F0F` on `#FFFFFF` | 10.8:1 | ✅ AAA |
| `#FFFFFF` on `#690F0F` | 10.8:1 | ✅ AAA |
| `#690F0F` on `#fef2f2` | 9.2:1  | ✅ AAA |

All color combinations meet WCAG AAA standards for accessibility.

---

## Examples

### Hero Section

```tsx
<section className="bg-gradient-to-br from-[#690F0F] via-[#8B1818] to-[#690F0F] text-white">
  <h1>Welcome to PR1AS</h1>
  <Button className="!bg-white !text-[#690F0F]">Get Started</Button>
</section>
```

### Card with Accent

```tsx
<Card className="!border-2 hover:!border-[#690F0F]">
  <Icon className="text-[#690F0F] text-4xl" />
  <h3>Feature Title</h3>
</Card>
```

### Statistics

```tsx
<Statistic
  title="Active Users"
  value={12500}
  valueStyle={{ color: "#690F0F", fontWeight: "bold" }}
/>
```

---

## Brand Guidelines

### DO ✅

- Sử dụng `#690F0F` cho tất cả CTAs chính
- Sử dụng white `#FFFFFF` cho text trên background đỏ
- Sử dụng `#690F0F` cho text trên background trắng
- Sử dụng gradients cho hero sections và featured areas
- Maintain high contrast ratios

### DON'T ❌

- Không dùng màu đỏ nhạt cho primary buttons
- Không dùng text đỏ trên background đỏ
- Không mix với purple/pink colors cũ
- Không giảm opacity của primary color dưới 80%

---

## Migration from Old Colors

### Old → New Mapping

| Old Color              | New Color | Context           |
| ---------------------- | --------- | ----------------- |
| `purple-600` (#9333ea) | `#690F0F` | Primary           |
| `pink-500` (#ec4899)   | `#8B1818` | Gradients         |
| `red-500` (#ef4444)    | `#690F0F` | Accents           |
| `purple-100`           | `#fef2f2` | Light backgrounds |

### Components Updated

- ✅ HeroSection
- ✅ StatisticsSection
- ✅ FeaturesSection
- ✅ CategoriesSection
- ✅ HowItWorksSection
- ✅ TestimonialsSection
- ✅ TrustBadgesSection
- ✅ CTASection

---

**Updated**: November 17, 2025  
**Version**: 2.0.0  
**Status**: ✅ Active
