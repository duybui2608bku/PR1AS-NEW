🔒 AUTHENTICATION SYSTEM SPEC – VERSION 1.0

Nền tảng kết nối Client – Worker

1. MỤC TIÊU

Xây dựng hệ thống tài khoản an toàn, rõ ràng và đủ chức năng cho nền tảng kết nối Client – Worker, bao gồm:

Đăng ký bằng Google OAuth và email/password (tùy chọn).

Quản lý 3 vai trò: client, worker, admin.

Bảo đảm 1 email chỉ thuộc 1 role (trừ admin).

Tài khoản bị banned không thể đăng nhập.

Quản lý phiên đăng nhập, điều hướng và phân quyền theo role.

Chuẩn bị nền tảng để mở rộng thành profile Client/Worker sau này.

2. PHẠM VI TÍNH NĂNG

Hệ thống bao gồm các tính năng:

Đăng ký tài khoản (Sign Up)

Đăng nhập (Login)

Đăng xuất (Logout)

Quản lý role (Client – Worker – Admin)

Kiểm tra & chặn tài khoản banned

Phân quyền & điều hướng theo role

Trang banned

Middleware / Route Guards

Quy tắc bảo mật liên quan

3. VAI TRÒ NGƯỜI DÙNG (USER ROLES)
   3.1. Client

Người đi thuê dịch vụ.

Truy cập dashboard client, đặt dịch vụ, xem worker.

3.2. Worker

Người cung cấp dịch vụ.

Được phép đăng dịch vụ, chỉnh giá, quản lý booking.

3.3. Admin

Quản trị hệ thống.

Quản lý users, dịch vụ, phê duyệt, ban/unban.

Không được tạo bằng giao diện đăng ký.

Chỉ được set thủ công từ backend/DB.

4. QUY TẮC CHÍNH (CORE RULES)

Một email chỉ được giữ một role duy nhất (client hoặc worker).

Email đã đăng ký role A → không được đăng ký role B.

admin là role đặc biệt, không chịu quy tắc trên.

Tài khoản banned → không thể truy cập bất kỳ phần nào của hệ thống, kể cả đã đăng nhập.

Người dùng đã đăng nhập → không được xem /login hay /signup.

5. DATA MODEL (MÔ TẢ KHÁI NIỆM – KHÔNG CODE)
   5.1. Bảng Supabase Auth (mặc định)

Lưu email + mật khẩu (nếu dùng) + thông tin Google OAuth.

Tự động tạo user_id dạng UUID.

5.2. Bảng user_profiles (tùy chỉnh)

Thông tin chính: Nhập thông tin cơ bản (Migrate sau)
6.1. Bước 1 – Chọn role

Trước khi bấm đăng ký Google, hệ thống yêu cầu user chọn:

Tôi là Client

Tôi là Worker

Role được save trong state hoặc query params.

6.2. Bước 2 – Đăng ký bằng Google OAuth

Người dùng click nút “Đăng ký với Google”.

Hệ thống:

Redirect qua Google.

Sau khi xác thực → trả về Supabase → tạo session.

6.3. Bước 3 – Xử lý callback & tạo profile
Trường hợp A – Email chưa tồn tại trong hệ thống

→ Tạo bản ghi trong user_profiles:

id = auth.user.id

email = user.email

role = role đã chọn

status = active

→ Tự động redirect đến dashboard theo role.

Trường hợp B – Email đã có nhưng khác role

Ví dụ:

Email A đã là worker

User chọn đăng ký client

→ Hiển thị lỗi:

Email này đã được đăng ký với vai trò WORKER.
Bạn không thể tạo tài khoản CLIENT với email này.

→ Đề xuất:

Tiếp tục đăng nhập với vai trò cũ
hoặc

Dùng email Google khác

Trường hợp C – Email đã có nhưng bị banned

→ Hệ thống:

Tự động xóa session Supabase

Redirect đến /banned

7. LUỒNG ĐĂNG NHẬP (LOGIN FLOW)
   7.1. Đăng nhập Google

Người dùng click “Đăng nhập với Google”.

Supabase trả session.

Hệ thống kiểm tra user_profiles:

A. Nếu không có profile

UX hỏi: “Email này chưa có tài khoản. Bạn muốn đăng ký Client hay Worker?”

Cho phép tạo profile mới.

B. Nếu status = banned

Tự động logout

Redirect /banned

C. Nếu hợp lệ

Redirect đúng dashboard theo role

8. LUỒNG ĐĂNG XUẤT (LOGOUT FLOW)

Người dùng click “Logout”.

Hệ thống gọi Supabase de-auth.

Xóa state user frontend.

Redirect về /login hoặc /.

9. PHÂN QUYỀN ROUTE (ROUTE GUARDS)
   9.1. Rule phân quyền
   Đường dẫn Role được phép
   /client/** client
   /worker/** worker
   /admin/\*\* admin
   9.2. Hành vi khi truy cập sai quyền

Ví dụ worker truy cập /client/dashboard → redirect về /worker/dashboard.

10. CHẶN NGƯỜI DÙNG BANNED
    Logic bắt buộc:

Ở mọi request/API → backend kiểm tra status.

Nếu banned:

Trả error "ACCOUNT_BANNED"

Frontend khi nhận error phải:

Gọi logout

Redirect /banned

11. TRANG /banned

Nội dung gồm:

Thông báo tài khoản bị khóa

Lý do (nếu có)

Liên hệ hỗ trợ

Hệ thống không cho phép người bị banned truy cập bất kỳ trang nào khác.

12. QUẢN TRỊ VIÊN (ADMIN FEATURES – PHASE 2)

Admin có thể:

Xem danh sách user

Ban / unban user

Chỉnh role (trừ client ↔ worker)

Gán role admin cho user khác

13. TÌNH HUỐNG ĐẶC BIỆT (EDGE CASES)
1. User đóng trình duyệt khi đang đăng ký

→ Khi quay lại, hệ thống sẽ detect session và tự redirect.

2. Người dùng đổi email trong Google

→ Supabase xem như tài khoản mới.

3. User login nhưng chưa tạo profile

→ Bắt buộc yêu cầu chọn role.

4. Client cố "nâng" lên Worker

→ Không được (quy tắc 1 email = 1 role).
→ Bắt dùng email khác.

5. Session còn hạn nhưng user bị ban trong lúc đang dùng

→ API trả lỗi → frontend logout + chuyển /banned.

14. YÊU CẦU BẢO MẬT

Tất cả API phải xác thực bằng Supabase JWT.

Không lưu token trong localStorage dạng plain text.

Middleware bắt buộc kiểm tra:

session hợp lệ

role phù hợp

status = active

Phải hỗ trợ logout trên tất cả thiết bị (sau này).

Có thể bật verify email để tránh fake user.

15. YÊU CẦU UI/UX

Sign Up:

B1: Chọn role

B2: Google signup

B3: Tạo profile / báo lỗi

Login:

Nếu đã có session → tự redirect dashboard

Nếu lỗi → hiển thị rõ lý do

Banned page:

Thông báo lớn

Nút “Liên hệ hỗ trợ”

Admin panel:

Danh sách user

Bộ lọc: role / status

Nút Ban / Unban

16. PHÂN TÍCH LUỒNG TỔNG QUAN (HIGH-LEVEL DIAGRAM — TEXT)
    [User chọn role]
    ↓
    [Google OAuth]
    ↓
    [Supabase tạo session]
    ↓
    Check user_profiles:
    ├─ Không tồn tại → Tạo profile → Dashboard theo role
    ├─ Tồn tại khác role → Show lỗi, không cho tạo
    ├─ Tồn tại nhưng banned → Logout + chuyển /banned
    └─ Hợp lệ → Đăng nhập vào dashboard
