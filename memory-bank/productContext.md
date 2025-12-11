## Product Context

- **Users**:
  - **Clients**: Tìm và xem hồ sơ worker, xem dịch vụ & giá, nạp tiền vào ví, thanh toán qua **escrow**, đặt booking dịch vụ, chat với worker, lưu worker vào favorites, theo dõi giao dịch và notifications.
  - **Workers**: Tạo & quản lý hồ sơ, cấu hình dịch vụ và bảng giá, nhận tiền qua ví, quản lý bookings (confirm/decline/complete), chat với clients, theo dõi lịch làm việc và lịch sử job.
  - **Admins**: Quản lý người dùng (ban/role với duration options), phê duyệt hồ sơ worker, giám sát ví/escrow, cấu hình platform settings với versioning, xử lý khiếu nại, xem site settings history.

- **Product Pillars**:
  - **Niềm tin & an toàn**: Ví nội bộ + escrow, cooling period, khiếu nại, phí platform/insurance, rate limiting chống brute force, password validation, token refresh (xem chi tiết trong `MEMORY_BANK.md` và `refactor/auth.md`).
  - **Trải nghiệm đặt dịch vụ rõ ràng**: Hồ sơ worker giàu thông tin (ảnh, tag, dịch vụ, giá), flow booking với status workflow rõ ràng, flow thanh toán và escrow minh bạch, real-time chat giữa client và worker.
  - **Quốc tế hóa**: Hỗ trợ đa ngôn ngữ (vi, en, zh, ko) với hệ thống i18n thống nhất.

- **New Features**:
  - **Chat System**: Real-time messaging giữa client và worker, hỗ trợ text/image/mixed content, có thể gắn với booking, Supabase Realtime integration.
  - **Booking System**: Service bookings với workflow status (pending → confirmed → in_progress → completed), tích hợp với escrow, notifications tự động.
  - **Worker Favorites**: Clients có thể bookmark workers yêu thích, dễ dàng tìm lại sau.
  - **Site Settings History**: Versioning cho SEO settings, track changes và admin who made changes.

- **UX Goals (ví dụ yêu cầu cụ thể)**:
  - Trang public worker giúp khách nhanh chóng hiểu **dịch vụ, giá, độ tin cậy** và trạng thái hoạt động của worker.
  - Lịch/availability của worker cần trực quan (calendar/grid), hiển thị ngày **đã có booking được xác nhận** nhằm tránh đặt trùng.
  - Dashboard cho client/worker/admin rõ ràng, dễ dùng trên desktop & mobile.
  - Chat interface responsive, real-time updates, hỗ trợ image upload.

