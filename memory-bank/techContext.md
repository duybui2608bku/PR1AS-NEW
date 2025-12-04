## Tech Context

- **Core Stack**:
  - **Frontend**: React 19 + Next.js 16 (App Router) + TypeScript.
  - **Backend**: Next.js API routes trong `app/api/*` (auth, wallet, worker, admin, services, cron).
  - **Database & Backend‑as‑a‑Service**: Supabase (PostgreSQL, Auth, Storage, RLS).
  - **UI**: Ant Design + Tailwind CSS.
  - **i18n**: `i18next` + `react-i18next` với messages trong `messages/*.json`.

- **Important Libraries/Tools**:
  - **Date/Time**: `dayjs` cho xử lý thời gian (booking, escrow, expiry).
  - **Deployment**: Vercel (bao gồm cron jobs cấu hình trong `vercel.json`).
  - **Lint/Build**: ESLint, TypeScript, PostCSS.

- **Codebase Entry Points**:
  - **Frontend**:
    - `app/layout.tsx`: Root layout, provider (I18n, AntD).
    - `app/admin/*`, `app/client/*`, `app/worker/*`: Dashboard từng role.
    - `components/*`: UI dùng lại (wallet, worker profile steps, layout, common components).
    - `features/home/*`: Các section trang chủ.
  - **Backend/Services**:
    - `app/api/wallet/*`: Ví, giao dịch, escrow, webhook, cron.
    - `app/api/worker/*`: Quản lý profile, services, images.
    - `lib/supabase/*`: Supabase client server/client, admin client.
    - `lib/wallet/*`, `lib/worker/*`, `lib/auth/*`: Service layer & API client.

- **Where to Look for New Work**:
  - **Kiến trúc & DB**: `MEMORY_BANK.md` (sections 3–4).
  - **API chi tiết**: `MEMORY_BANK.md` (section 7) + các file trong `docs/` (`AUTH_API.md`, `ADMIN_API.md`, v.v.).
  - **Hướng dẫn feature**: `progess/*.md` và các guide chuyên biệt trong `docs/` (wallet, image upload, SEO, i18n...).


