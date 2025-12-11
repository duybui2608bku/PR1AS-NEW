## Active Context

- **Current Focus (session)**:
  - Không có feature cụ thể nào đang được triển khai. Chờ user xác định **task mới** (feature, bugfix, refactor, tối ưu, v.v.).

- **Recent Milestones**:
  - ✅ **Chat System**: Real-time messaging giữa client và worker đã được triển khai với Supabase Realtime, hỗ trợ text/image/mixed content.
  - ✅ **Booking System**: Service booking workflow đã hoàn thiện với status management, tích hợp escrow, và notifications.
  - ✅ **Worker Favorites**: Hệ thống bookmark workers đã được thêm vào.
  - ✅ **Site Settings History**: Versioning cho SEO settings với tracking changes.
  - ✅ **Security Enhancements**: Rate limiting, password validation, token refresh, admin authorization improvements (role-based thay vì hardcoded email).
  - ✅ Hoàn thiện tài liệu tổng thể `MEMORY_BANK.md` (v1.0, production‑ready) với kiến trúc, DB, API, workflows chi tiết.
  - ✅ Đồng bộ các file core trong `memory-bank/` với `MEMORY_BANK.md` và refactor docs.

- **How to Resume Work After Reset**:
  - Đọc nhanh `MEMORY_BANK.md` để nắm big picture (sections 1–3).
  - Xem `memory-bank/activeContext.md` + `memory-bank/progress.md` để biết trạng thái hiện tại.
  - Vào `docs/` và `progess/` nếu cần chi tiết theo từng feature (wallet, admin, auth, SEO, i18n, image upload, chat, booking, v.v.).
  - Xem `refactor/` để hiểu các security improvements và logic reviews.

- **Potential Next Work (chưa bắt đầu – gợi ý)**:
  - Nâng UX **public worker page** (ví dụ: calendar hiển thị ngày đã có booking confirmed để tránh trùng lịch).
  - Triển khai các mục trong **Future Enhancements** ở `MEMORY_BANK.md` (rating/review, advanced search, push notifications, multi‑currency wallet, subscription cho worker, analytics, v.v.).
  - Tăng độ phủ test (Jest/Playwright) và bổ sung monitoring/observability theo guidelines trong `MEMORY_BANK.md`.
  - Email verification flow (hiện tại đang auto-confirm trong signup).


