## Product Context

- **Users**:
  - **Clients**: Tìm và xem hồ sơ worker, xem dịch vụ & giá, nạp tiền vào ví, thanh toán qua **escrow**, theo dõi giao dịch.
  - **Workers**: Tạo & quản lý hồ sơ, cấu hình dịch vụ và bảng giá, nhận tiền qua ví, theo dõi lịch làm việc và lịch sử job.
  - **Admins**: Quản lý người dùng (ban/role), phê duyệt hồ sơ worker, giám sát ví/escrow, cấu hình platform settings, xử lý khiếu nại.

- **Product Pillars**:
  - **Niềm tin & an toàn**: Ví nội bộ + escrow, cooling period, khiếu nại, phí platform/insurance (xem chi tiết trong `MEMORY_BANK.md`).
  - **Trải nghiệm đặt dịch vụ rõ ràng**: Hồ sơ worker giàu thông tin (ảnh, tag, dịch vụ, giá), flow thanh toán và escrow minh bạch.
  - **Quốc tế hóa**: Hỗ trợ đa ngôn ngữ (vi, en, zh, ko) với hệ thống i18n thống nhất.

- **UX Goals (ví dụ yêu cầu cụ thể)**:
  - Trang public worker giúp khách nhanh chóng hiểu **dịch vụ, giá, độ tin cậy** và trạng thái hoạt động của worker.
  - Lịch/availability của worker cần trực quan (calendar/grid), có thể mở rộng để hiển thị ngày **đã có booking được xác nhận** nhằm tránh đặt trùng.
  - Dashboard cho client/worker/admin rõ ràng, dễ dùng trên desktop & mobile.

