## System Patterns

- **Architecture**:
  - **Pattern**: Modular monolith trên **Next.js App Router**.
  - **API Layer**: `app/api/*` đóng vai trò controller (auth, wallet, worker, admin, services, cron).
  - **Service Layer**: Logic nghiệp vụ tập trung trong `lib/*` (ví dụ `lib/wallet/service.ts`, `lib/worker/service.ts`).
  - **Database Access**: Truy cập trực tiếp Supabase PostgreSQL qua Supabase SDK; bảo mật bằng **Row Level Security (RLS)**.
  - **Frontend**: `app/*` (pages/layout) + `components/*` (UI dùng lại) + `features/*` (feature module, ví dụ `features/home`).

- **Wallet & Escrow Pattern**:
  - **Đơn vị sự thật (source of truth)**: Bảng `wallets`, `transactions`, `escrow_holds`, `bank_deposits` trong Supabase (mô tả chi tiết trong `MEMORY_BANK.md`).
  - Tất cả thanh toán client → worker đi qua **escrow** với cooling period, complaint flow, và auto‑release (cron).
  - Phí platform/insurance được tính toán trong service layer, lưu chi tiết vào `transactions`/`escrow_holds`.

- **Worker Profile & Services Pattern**:
  - Worker profile tách thành nhiều bảng: `worker_profiles`, `worker_images`, `worker_availabilities`, `worker_services`, `worker_service_prices`, `worker_tags`.
  - Quy trình: worker tạo profile (draft) → submit (pending) → admin duyệt → publish (public, có thể tìm kiếm).
  - Giá dịch vụ được tính theo công thức tier (daily/weekly/monthly) từ hourly rate và discount.

- **Booking / Scheduling (định hướng)**:
  - Hệ thống đã có **availability** + **wallet/escrow**; logic booking cụ thể có thể được thiết kế dựa trên các pattern hiện tại:
    - Lưu job/booking trong bảng riêng, gắn với worker, client, escrow.
    - Chỉ những booking **confirmed/paid** mới được dùng để block lịch hoặc hiển thị cảnh báo trên calendar public.
  - Chi tiết triển khai booking cần được ghi chú thêm trong `docs/` khi feature được build.


