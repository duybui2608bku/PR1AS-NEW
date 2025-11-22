# Hướng Dẫn Trang Nạp Tiền - Ví Điện Tử

## 📋 Tổng Quan

Hệ thống ví điện tử hoàn chỉnh đã được triển khai cho cả khách hàng (client) và người làm việc (worker), cung cấp giao diện quản lý tài chính toàn diện với các tính năng nạp tiền, rút tiền và theo dõi giao dịch.

## ✅ Những Gì Đã Được Tạo

### 1. Trang Ví Khách Hàng

**Đường dẫn**: `/client/wallet`
**File**: `app/client/wallet/page.tsx`

Trang ví đầy đủ tính năng cho khách hàng bao gồm:

- Hiển thị số dư ví với cập nhật thời gian thực
- Chức năng nạp tiền (Chuyển khoản ngân hàng & PayPal)
- Chức năng rút tiền (Chuyển khoản ngân hàng & PayPal)
- Lịch sử giao dịch đầy đủ với bộ lọc
- Thiết kế responsive cho mọi thiết bị
- Thẻ thông tin gradient đẹp mắt với hướng dẫn nhanh

### 2. Trang Ví Worker

**Đường dẫn**: `/worker/wallet`
**File**: `app/worker/wallet/page.tsx`

Trang ví tương tự được tùy chỉnh cho worker với:

- Tập trung vào theo dõi thu nhập
- Cùng chức năng nạp/rút tiền
- Lịch sử giao dịch
- Giao diện và thông điệp dành riêng cho worker

### 3. Component Modal Rút Tiền

**File**: `components/wallet/WithdrawModal.tsx`

Component modal mới xử lý rút tiền:

- Hai tab: Chuyển khoản ngân hàng và PayPal
- **Tab Chuyển khoản**:
  - Nhập số tiền với xác thực
  - Tên ngân hàng
  - Số tài khoản (chỉ số)
  - Tên chủ tài khoản
  - Tối thiểu: $50 USD
- **Tab PayPal**:
  - Nhập số tiền với xác thực
  - Email PayPal với xác thực email
  - Tối thiểu: $50 USD

## 🎯 Tính Năng

### Nạp Tiền

- ✅ Chuyển khoản ngân hàng với mã QR
- ✅ Tích hợp PayPal
- ✅ Xác thực số tiền (tối thiểu $10)
- ✅ Cập nhật số dư thời gian thực
- ✅ Theo dõi giao dịch

### Rút Tiền

- ✅ Chuyển khoản đến tài khoản ngân hàng Việt Nam
- ✅ Rút qua PayPal
- ✅ Xác thực số tiền (tối thiểu $50)
- ✅ Xác thực form
- ✅ Thông báo thành công

### Số Dư Ví

- ✅ Hiển thị số dư khả dụng
- ✅ Theo dõi số dư đang chờ xử lý
- ✅ Thống kê tổng thu/chi
- ✅ Số lượng escrow đang hoạt động
- ✅ Nút làm mới
- ✅ Nút thao tác nhanh

### Lịch Sử Giao Dịch

- ✅ Bảng phân trang
- ✅ Lọc theo loại giao dịch
- ✅ Lọc theo trạng thái
- ✅ Lọc theo khoảng thời gian
- ✅ Cột có thể sắp xếp
- ✅ Thiết kế responsive
- ✅ Cập nhật thời gian thực

## 🚀 Cách Sử Dụng

### Dành Cho Khách Hàng (Client)

1. Đăng nhập với tài khoản client
2. Chọn "My Wallet" (Ví Của Tôi) trong menu bên trái
3. Xem số dư và thống kê
4. Nhấn "Deposit" để nạp tiền
5. Nhấn "Withdraw" để yêu cầu rút tiền
6. Xem tất cả giao dịch trong bảng lịch sử

### Dành Cho Worker

1. Đăng nhập với tài khoản worker
2. Chọn "My Wallet" (Ví Của Tôi) trong menu bên trái
3. Xem thu nhập và số dư
4. Nhấn "Withdraw" để chuyển thu nhập
5. Theo dõi tất cả giao dịch

## 💰 Quy Trình Nạp Tiền

### 1. Nạp Qua Chuyển Khoản Ngân Hàng

1. Nhấn nút "Deposit" trên trang ví
2. Chọn tab "Bank Transfer"
3. Nhập số tiền muốn nạp (USD)
4. Hệ thống tạo mã QR tự động
5. Quét mã QR bằng app ngân hàng của bạn
6. Chuyển khoản với nội dung được cung cấp
7. Hệ thống tự động xác nhận trong 1-5 phút
8. Số dư được cập nhật tự động

**Lưu ý quan trọng**:

- Nhập đúng nội dung chuyển khoản
- Chuyển đúng số tiền
- Không thêm nội dung khác

### 2. Nạp Qua PayPal

1. Nhấn nút "Deposit" trên trang ví
2. Chọn tab "PayPal"
3. Nhập số tiền muốn nạp (USD)
4. Nhấn "Pay with PayPal"
5. Chuyển hướng đến trang PayPal
6. Hoàn thành thanh toán trên PayPal
7. Tự động quay lại platform
8. Số dư được cập nhật ngay lập tức

## 💸 Quy Trình Rút Tiền

### 1. Rút Về Ngân Hàng

1. Nhấn nút "Withdraw" trên trang ví
2. Chọn tab "Bank Transfer"
3. Nhập số tiền muốn rút (USD)
4. Nhập tên ngân hàng (VD: Vietcombank, BIDV)
5. Nhập số tài khoản
6. Nhập tên chủ tài khoản (đúng như trên sổ)
7. Nhấn "Submit Withdrawal Request"
8. Xử lý trong 1-3 ngày làm việc

**Lưu ý**:

- Số dư tối thiểu: $50
- Kiểm tra kỹ thông tin tài khoản
- Tên phải khớp với tên trên tài khoản ngân hàng

### 2. Rút Qua PayPal

1. Nhấn nút "Withdraw" trên trang ví
2. Chọn tab "PayPal"
3. Nhập số tiền muốn rút (USD)
4. Nhập email PayPal
5. Nhấn "Submit Withdrawal Request"
6. Xử lý trong 1-2 ngày làm việc

**Lưu ý**:

- Email phải là email PayPal đã xác thực
- Kiểm tra email trước khi gửi

## 📱 Thiết Kế Responsive

Hoạt động hoàn hảo trên mọi thiết bị:

- **Điện thoại** (< 576px): Bố cục 1 cột
- **Máy tính bảng** (576px - 992px): Bố cục 2 cột
- **Máy tính** (> 992px): Bố cục rộng tối ưu

## 🔒 Bảo Mật

Tất cả thao tác ví được bảo vệ:

- Yêu cầu xác thực
- Kiểm tra ủy quyền
- Xác thực đầu vào
- Bảo vệ SQL injection
- Bảo vệ XSS
- Bảo vệ CSRF
- Escrow protection cho thanh toán

## 📊 Thống Kê Ví

Trên trang ví, bạn có thể xem:

- **Số dư khả dụng**: Số tiền có thể sử dụng ngay
- **Số dư đang chờ**: Số tiền đang được xử lý
- **Tổng thu nhập**: Tổng số tiền đã kiếm được
- **Tổng chi tiêu**: Tổng số tiền đã sử dụng
- **Escrow hoạt động**: Số lượng giao dịch đang giữ escrow
- **Trạng thái ví**: Active, Frozen, hoặc Suspended

## 🎨 Giao Diện

### Đặc Điểm Thiết Kế

1. **Thẻ Gradient Đẹp Mắt**:

   - Client: Gradient tím (#667eea → #764ba2)
   - Worker: Gradient hồng (#f093fb → #f5576c)

2. **Biểu Tượng Trực Quan**:

   - Icons rõ ràng cho mỗi chức năng
   - Màu sắc phân biệt các loại giao dịch

3. **Thông Báo Thời Gian Thực**:
   - Loading states
   - Success messages
   - Error notifications

## ❓ Xử Lý Sự Cố

### Tiền nạp không hiển thị

- Đợi 1-5 phút cho chuyển khoản ngân hàng
- Kiểm tra lịch sử giao dịch xem trạng thái pending
- Xác nhận nội dung chuyển khoản đúng
- Liên hệ support nếu vấn đề tiếp tục

### Rút tiền bị chậm

- Thời gian xử lý là 1-3 ngày làm việc
- Kiểm tra trạng thái giao dịch trong lịch sử
- Xác nhận thông tin ngân hàng/PayPal đúng
- Liên hệ support nếu chậm quá 3 ngày

### Số dư không cập nhật

- Nhấn nút "Refresh" trên thẻ số dư
- Kiểm tra console trình duyệt xem có lỗi
- Xác nhận xác thực hợp lệ
- Thử đăng xuất và đăng nhập lại

## 📞 Hỗ Trợ

Nếu gặp vấn đề hoặc có câu hỏi:

- Email: support@pr1as.com
- Trung tâm trợ giúp: https://help.pr1as.com
- Chat trực tuyến: Có sẵn trên trang ví

## 🎉 Tóm Tắt

Hệ thống ví điện tử hoàn chỉnh đã sẵn sàng sử dụng với:

✅ **Trang ví dành cho Client** - `/client/wallet`  
✅ **Trang ví dành cho Worker** - `/worker/wallet`  
✅ **Nạp tiền qua Chuyển khoản & PayPal**  
✅ **Rút tiền qua Chuyển khoản & PayPal**  
✅ **Lịch sử giao dịch chi tiết**  
✅ **Thiết kế responsive cho mobile**  
✅ **Bảo mật cao**  
✅ **Cập nhật thời gian thực**

---

**Ngày triển khai**: 17 Tháng 11, 2025  
**Phiên bản**: 1.0.0  
**Trạng thái**: ✅ Hoàn thành & Sẵn sàng sử dụng
