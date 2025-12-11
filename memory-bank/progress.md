## Progress

- **Status**:
  - Core platform (auth, worker profiles, wallet & escrow, admin, i18n) đã được triển khai và mô tả chi tiết trong `MEMORY_BANK.md`, `docs/` và `progess/`.
  - **New features**: Chat system, Booking system, Worker favorites, Site settings history đã được triển khai.
  - **Security improvements**: Rate limiting, password validation, token refresh, admin authorization fixes đã hoàn thành.
  - Hiện đang ở pha **enhancement / maintenance**: chờ định nghĩa task cụ thể cho các lần làm việc tiếp theo.

- **Done**:
  - ✅ **Core Platform**: Auth, worker profiles, wallet & escrow, admin, i18n (documented in `MEMORY_BANK.md`).
  - ✅ **Chat System**: Real-time messaging với Supabase Realtime, hỗ trợ text/image/mixed content, RLS policies, components trong `components/chat/`, service layer trong `lib/chat/`.
  - ✅ **Booking System**: Service booking workflow với status management, tích hợp escrow, notifications tự động, tables `bookings` và `notifications`.
  - ✅ **Worker Favorites**: Bookmark system với table `worker_favorites`, RLS policies, service layer trong `lib/favorites/`.
  - ✅ **Site Settings History**: Versioning cho SEO settings với table `site_settings_history`, tracking changes và admin who made changes.
  - ✅ **Security Enhancements**:
    - Rate limiting cho login/signup (5 attempts per 15 min, account lockout 30 min).
    - Password validation (min 8 chars, require uppercase/lowercase/number/special char).
    - Token refresh mechanism với auto-refresh và refresh endpoint.
    - Admin authorization fixes (role-based thay vì hardcoded email, self-ban/delete prevention, ban duration options).
    - Session timeout warning modal.
  - ✅ Khởi tạo và đồng bộ Memory Bank core: `projectbrief`, `productContext`, `systemPatterns`, `techContext`, `activeContext`, `progress` với `MEMORY_BANK.md` v1.0.
  - ✅ Thiết lập bộ tài liệu chi tiết cho từng mảng (auth, wallet, admin, SEO, i18n, image upload, chat, booking, v.v.) trong `docs/` và `progess/`.
  - ✅ Refactor docs: `refactor/admin.md`, `refactor/auth.md`, `refactor/worker-profile.md` với security reviews và logic improvements.

- **Pending / Backlog (chưa bắt đầu, cần user chọn)**:
  - Email verification flow (hiện tại đang auto-confirm trong signup).
  - Các feature trong **Future Enhancements** (`MEMORY_BANK.md` – section 13): rating/review, advanced search, push notifications, multi‑currency wallet, subscriptions, analytics, v.v.
  - Cải thiện UX cho public worker page (ví dụ: hiển thị lịch/booking trực quan, dùng data từ Supabase).
  - Bổ sung test tự động (Jest/Playwright) và thiết lập monitoring/alerting theo guidelines.

- **Cách ghi lại tiến độ cho lần làm việc tiếp theo**:
  - Mỗi khi bắt đầu task mới: cập nhật `activeContext.md` với **Current Focus** + **Next Steps** cụ thể.
  - Sau khi hoàn thành: thêm bullet vào `progress.md` dưới mục **Done**, nêu rõ feature/bugfix đã triển khai và link tới doc liên quan (nếu có).


