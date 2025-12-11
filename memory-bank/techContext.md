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
    - `components/*`: UI dùng lại (wallet, worker profile steps, layout, common components, chat, booking).
    - `features/home/*`: Các section trang chủ.
    - `hooks/chat/*`, `hooks/booking/*`: Custom hooks cho chat và booking.
  - **Backend/Services**:
    - `app/api/wallet/*`: Ví, giao dịch, escrow, webhook, cron.
    - `app/api/worker/*`: Quản lý profile, services, images.
    - `app/api/booking/*`: Booking management endpoints.
    - `app/api/chat/*`: Chat endpoints (conversations, messages).
    - `lib/supabase/*`: Supabase client server/client, admin client, Realtime setup.
    - `lib/wallet/*`, `lib/worker/*`, `lib/auth/*`, `lib/booking/*`, `lib/chat/*`, `lib/favorites/*`: Service layer & API client.
    - `lib/auth/rate-limit.ts`: Rate limiting cho login/signup.
    - `lib/auth/password-validation.ts`: Password strength validation.
    - `lib/auth/token-refresh.ts`: Token refresh mechanism.

- **Real-time Features**:
  - **Supabase Realtime**: Được sử dụng cho chat messages và notifications.
  - **Setup**: Realtime subscriptions trong `lib/supabase/` và hooks trong `hooks/chat/`.

- **Where to Look for New Work**:
  - **Kiến trúc & DB**: `MEMORY_BANK.md` (sections 3–4).
  - **API chi tiết**: `MEMORY_BANK.md` (section 7) + các file trong `docs/` (`AUTH_API.md`, `ADMIN_API.md`, `CHAT_CLIENT_WORKER_DESIGN.md`, v.v.).
  - **Hướng dẫn feature**: `progess/*.md` và các guide chuyên biệt trong `docs/` (wallet, image upload, SEO, i18n, chat, booking...).
  - **Security & Refactor**: `refactor/admin.md`, `refactor/auth.md`, `refactor/worker-profile.md`.


