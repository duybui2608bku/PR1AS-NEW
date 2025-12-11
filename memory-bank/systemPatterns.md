## System Patterns

- **Architecture**:
  - **Pattern**: Modular monolith trên **Next.js App Router**.
  - **API Layer**: `app/api/*` đóng vai trò controller (auth, wallet, worker, admin, services, booking, chat, cron).
  - **Service Layer**: Logic nghiệp vụ tập trung trong `lib/*` (ví dụ `lib/wallet/service.ts`, `lib/worker/service.ts`, `lib/booking/`, `lib/chat/`).
  - **Database Access**: Truy cập trực tiếp Supabase PostgreSQL qua Supabase SDK; bảo mật bằng **Row Level Security (RLS)**.
  - **Frontend**: `app/*` (pages/layout) + `components/*` (UI dùng lại) + `features/*` (feature module, ví dụ `features/home`).
  - **Real-time**: Supabase Realtime cho chat messages và notifications.

- **Wallet & Escrow Pattern**:
  - **Đơn vị sự thật (source of truth)**: Bảng `wallets`, `transactions`, `escrow_holds`, `bank_deposits` trong Supabase (mô tả chi tiết trong `MEMORY_BANK.md`).
  - Tất cả thanh toán client → worker đi qua **escrow** với cooling period, complaint flow, và auto‑release (cron).
  - Phí platform/insurance được tính toán trong service layer, lưu chi tiết vào `transactions`/`escrow_holds`.
  - Bookings tích hợp với escrow: khi booking được confirm, payment được hold trong escrow.

- **Worker Profile & Services Pattern**:
  - Worker profile tách thành nhiều bảng: `worker_profiles`, `worker_images`, `worker_availabilities`, `worker_services`, `worker_service_prices`, `worker_tags`.
  - Quy trình: worker tạo profile (draft) → submit (pending) → admin duyệt → publish (public, có thể tìm kiếm).
  - Giá dịch vụ được tính theo công thức tier (daily/weekly/monthly) từ hourly rate và discount.

- **Booking System Pattern**:
  - **Tables**: `bookings`, `notifications` (in-app notifications).
  - **Workflow**: `pending_worker_confirmation` → `worker_confirmed` (payment deducted) → `in_progress` → `worker_completed` → `client_completed` (payment released) hoặc `cancelled`/`disputed`.
  - **Integration**: Bookings gắn với `escrow_holds` và `transactions` để track payment.
  - **Notifications**: Tự động tạo notifications cho các events (booking_request, booking_confirmed, booking_completed, v.v.).
  - **Service Layer**: `lib/booking/` chứa logic quản lý bookings, status transitions, và validation.

- **Chat System Pattern**:
  - **Tables**: `conversations` (1-1 chat giữa client và worker, có thể gắn với booking), `messages` (text/image/mixed content với status tracking).
  - **Real-time**: Supabase Realtime subscriptions cho messages, tự động update UI khi có message mới.
  - **RLS**: Chỉ participants trong conversation mới có thể đọc/write messages.
  - **Service Layer**: `lib/chat/` chứa logic tạo conversation, send message, fetch messages, mark as read.
  - **Components**: `components/chat/` chứa UI components cho chat interface.

- **Favorites Pattern**:
  - **Table**: `worker_favorites` (user_id, worker_profile_id) với unique constraint.
  - **RLS**: Users chỉ có thể read/insert/delete favorites của chính mình.
  - **Service Layer**: `lib/favorites/` chứa logic add/remove favorites, check favorite status.

- **Site Settings History Pattern**:
  - **Table**: `site_settings_history` với versioning (version_number, changed_by, change_reason).
  - **Function**: `get_next_version_number()` để tự động tăng version.
  - **Use Case**: Track changes cho SEO settings, có thể rollback nếu cần.


