## Thiết kế chức năng nhắn tin Client – Worker (hỗ trợ ảnh & icon)

### 1. Mục tiêu & phạm vi

- **Mục tiêu**: Cung cấp kênh nhắn tin giữa **Client** và **Worker** trên nền tảng PR1AS, cho phép:
  - Gửi/nhận **tin nhắn văn bản** (text).
  - Gửi/nhận **emoji/icon**.
  - Gửi/nhận **ảnh** (image attachments).
- **Phạm vi**:
  - Chat **1–1** giữa Client và Worker.
  - Hỗ trợ **nhắn tin trước khi tạo booking** (pre‑booking chat) để hỏi/trao đổi yêu cầu.
  - Hỗ trợ **nhắn tin sau khi đã có booking** (chat theo booking cụ thể).
  - Chat gắn booking sẽ có `booking_id`, chat trước booking sẽ có `booking_id = NULL` (free chat nhưng vẫn ràng buộc theo cặp client–worker).
  - Tập trung vào **thiết kế nghiệp vụ + API + dữ liệu**; triển khai UI cụ thể sẽ được mô tả ở tài liệu front-end nếu cần.

---

### 2. Luồng nghiệp vụ chính

- **Khởi tạo cuộc trò chuyện (trước booking)**

  - Entry points gợi ý:
    - Từ **trang hồ sơ worker / listing worker** (nút “Nhắn tin” / “Chat với worker”).
    - Từ **trang chi tiết dịch vụ** của worker.
  - Khi Client bấm **Nhắn tin**:
    - FE gọi API tạo/lấy `conversation` với `workerId`, **không truyền** `bookingId` (hoặc `bookingId = null`).
    - BE kiểm tra đã có `conversation` với `(clientId, workerId, booking_id IS NULL)` chưa:
      - Nếu **chưa có** → tạo mới `conversation` pre‑booking.
      - Nếu **đã có** → dùng lại cuộc chat cũ.
    - Tải danh sách tin nhắn gần nhất (phân trang).
    - Client/Worker join **room** real-time theo `conversationId`.

- **Khởi tạo cuộc trò chuyện (sau khi có booking)**

  - Khi Client mở màn hình chi tiết Booking → tab **Chat**:
    - Hệ thống kiểm tra đã có `conversation` giữa `clientId`, `workerId`, `bookingId` chưa.
    - Nếu **chưa có**: tạo mới `conversation` gắn `bookingId`.
    - Nếu **đã có**: sử dụng lại `conversation` hiện có.
  - Tải danh sách tin nhắn gần nhất (phân trang).
  - Client/Worker join **room** real-time tương ứng với `conversationId`.

- **Gửi tin nhắn**

  - Người dùng nhập nội dung:
    - Text (có thể kèm emoji).
    - Chọn emoji từ emoji picker (map thành unicode).
    - Tuỳ chọn **đính kèm 1 hoặc nhiều ảnh**.
  - Nhấn **Gửi**:
    - FE gửi request qua REST API hoặc WebSocket:
      - Truyền `content` (text).
      - Truyền danh sách `attachments` (url ảnh đã upload).
  - Server:
    - Xác thực người dùng.
    - Kiểm tra quyền truy cập (user phải là `clientId` hoặc `workerId` của conversation).
    - Lưu tin nhắn vào DB với `status = 'sent'`.
    - Emit event real-time `message:new` tới người còn lại trong room.

- **Nhận tin nhắn**
  - FE lắng nghe event `message:new` theo `conversationId`.
  - Khi có event mới:
    - Thêm message vào danh sách hiển thị.
    - Auto scroll xuống cuối (nếu người dùng đang ở cuối danh sách).

---

### 3. Thiết kế dữ liệu

#### 3.1. Bảng `conversations`

- **Mục đích**: Đại diện cho một cuộc trò chuyện 1–1 giữa Client và Worker.

Trường gợi ý:

- `id` (PK, UUID).
- `client_id` (FK → users.id, NOT NULL).
- `worker_id` (FK → users.id, NOT NULL).
- `booking_id` (FK → bookings.id, NULLABLE):
  - Với chat gắn booking thì bắt buộc.
  - Cho phép mở rộng thêm chat tự do (booking_id = NULL).
- `created_at` (timestamp with time zone, default now()).
- `updated_at` (timestamp with time zone).
- `last_message_id` (FK → messages.id, NULLABLE).
- `last_message_at` (timestamp with time zone, dùng cho sort danh sách).

**Index đề xuất**:

- `(client_id, worker_id, booking_id)` UNIQUE – đảm bảo 1 conversation/booking.
- `(client_id, last_message_at DESC)` – cho danh sách hội thoại phía client.
- `(worker_id, last_message_at DESC)` – cho danh sách hội thoại phía worker.

#### 3.2. Bảng `messages`

- **Mục đích**: Lưu từng tin nhắn trong một conversation.

Trường gợi ý:

- `id` (PK, UUID).
- `conversation_id` (FK → conversations.id, NOT NULL).
- `sender_id` (FK → users.id, NOT NULL).
- `content` (TEXT, có thể rỗng nếu chỉ có ảnh).
- `content_type` (ENUM: `'text' | 'image' | 'mixed'`, default `'text'`).
- `attachments` (JSONB, NULLABLE):
  - Mảng object:
    - `{ url: string, type: 'image', width?: number, height?: number, size?: number, mime_type?: string }`.
- `status` (ENUM: `'sent' | 'delivered' | 'read'`, default `'sent'`).
- `created_at` (timestamp with time zone, default now()).
- `updated_at` (timestamp with time zone).

**Index đề xuất**:

- `(conversation_id, created_at DESC)` – để phân trang lịch sử chat.

#### 3.3. Lưu trữ ảnh

- Ảnh được lưu ở Supabase Storage (hoặc một service tương đương).
- Quy ước:
  - Bucket: ví dụ `chat-images`.
  - Cấu trúc path: `conversationId/yyyy/mm/dd/messageId/randomName.ext`.
- API upload trả về:
  - `url` (public/signed).
  - `width`, `height`, `size`, `mime_type` (nếu có).

---

### 4. Thiết kế API

> Ghi chú: Các route dưới đây dùng kiểu Next.js App Router (`app/api/*`). Tên cụ thể có thể tinh chỉnh cho phù hợp conventions hiện tại.

#### 4.1. Conversation APIs

- **`POST /api/chat/conversations`**

  - **Mục đích**: Tạo hoặc lấy conversation giữa Client – Worker – Booking.
  - **Body**:
    - `workerId: string` (bắt buộc).
    - `bookingId?: string` (khuyến nghị bắt buộc nếu chat gắn booking).
  - **Logic**:
    - Lấy `currentUserId` từ auth (có role client/worker).
    - Nếu current user là Client:
      - `clientId = currentUserId`.
      - `workerId = body.workerId`.
    - Tìm conversation tồn tại với `(clientId, workerId, bookingId)`.
      - Nếu tồn tại → trả về.
      - Nếu không → tạo mới.
  - **Response**:
    - Object `conversation` với `id`, `clientId`, `workerId`, `bookingId`, `lastMessageAt`, v.v.

- **`GET /api/chat/conversations`**
  - **Mục đích**: Lấy danh sách hội thoại của current user.
  - **Query**:
    - `page?: number`, `limit?: number` (phân trang).
  - **Logic**:
    - Nếu user là Client → lọc `client_id = currentUserId`.
    - Nếu user là Worker → lọc `worker_id = currentUserId`.
  - **Response**:
    - Danh sách conversation + thông tin `lastMessage` (join từ bảng messages).

#### 4.2. Message APIs

- **`GET /api/chat/conversations/[conversationId]/messages`**

  - **Mục đích**: Lấy lịch sử tin nhắn.
  - **Query**:
    - `cursor?: string` (messageId) hoặc `before?: string` (timestamp).
    - `limit?: number` (ví dụ mặc định 30).
  - **Logic**:
    - Kiểm tra user thuộc conversation (client hoặc worker).
    - Lọc `messages` theo `conversation_id`, sort `created_at DESC`, áp dụng phân trang.
  - **Response**:
    - Mảng messages (có thể trả `hasMore`, `nextCursor`).

- **`POST /api/chat/conversations/[conversationId]/messages`**
  - **Mục đích**: Gửi tin nhắn (text + emoji + ảnh) qua REST.
  - **Body (JSON)**:
    - `content?: string` – text, có thể bao gồm emoji (unicode).
    - `attachments?: Attachment[]` – danh sách ảnh đã upload:
      - `[{ url, type: 'image', width?, height?, size?, mime_type? }]`.
  - **Logic**:
    - Lấy `currentUserId`.
    - Kiểm tra user thuộc conversation (`conversationId`).
    - Tính `content_type`:
      - `text` nếu chỉ có `content`.
      - `image` nếu chỉ có `attachments`.
      - `mixed` nếu có cả hai.
    - Tạo bản ghi `messages`.
    - Cập nhật `conversations.last_message_id`, `last_message_at`.
    - Emit event real-time `message:new`.
  - **Response**:
    - Message vừa tạo.

#### 4.3. Upload ảnh

- **`POST /api/chat/uploads/image`**
  - **Mục đích**: Upload ảnh chat, trả về metadata.
  - **Request**:
    - `multipart/form-data` với trường `file`.
  - **Logic**:
    - Kiểm tra kích thước file (ví dụ ≤ 5MB).
    - Kiểm tra mime type (image/jpeg, image/png, image/webp).
    - Upload lên Supabase Storage.
    - Trả về thông tin file.
  - **Response**:
    - `{ url, width?, height?, size?, mime_type? }`.

---

### 5. Thiết kế Real-time (WebSocket / Supabase Realtime / Socket.io)

- **Kênh kết nối**

  - Dùng một trong các giải pháp:
    - Supabase Realtime (listen trên bảng `messages` theo `conversation_id`).
    - WebSocket/Socket.io riêng (Node server hoặc edge function).
  - Trường hợp chuẩn: dùng Socket.io gateway (hoặc tương đương).

- **Xác thực**

  - Khi kết nối socket, FE gửi access token (JWT) hiện tại.
  - Server:
    - Xác thực token → lấy `userId`.
    - Lưu `userId` trong context của socket.

- **Join room**

  - Event: `chat:join`.
    - Payload: `{ conversationId }`.
  - Server:
    - Kiểm tra user có thuộc conversation không.
    - Nếu có → `socket.join(conversationId)`.

- **Gửi tin nhắn qua socket (tuỳ chọn, nếu không dùng REST)**

  - Event: `chat:sendMessage`.
    - Payload giống body của REST `POST /messages`.
  - Server:
    - Thực hiện validate + lưu DB như API REST.
    - Emit `chat:message:new` tới room `conversationId`.

- **Nhận tin nhắn**
  - Event: `chat:message:new`.
    - Payload: đối tượng `message` đầy đủ.
  - FE:
    - Lắng nghe theo `conversationId`.
    - Append message vào UI.

---

### 6. Thiết kế UI/UX (tóm tắt)

- **Danh sách hội thoại (client & worker)**

  - Hiển thị:
    - Avatar & tên đối phương.
    - `lastMessage` (nếu là ảnh → hiển thị text tóm tắt kiểu: "📷 Ảnh").
    - `lastMessageAt`.

- **Màn hình chat chi tiết**
  - Header:
    - Tên & avatar đối phương.
    - (Tuỳ chọn) trạng thái online/offline.
  - Khung message:
    - Bubble trái/phải dựa trên `senderId`.
    - Text:
      - Hiển thị emoji như text unicode.
    - Ảnh:
      - Hiển thị thumbnail (nếu nhiều ảnh → layout lưới nhỏ).
      - Click mở full-screen viewer.
    - Timestamp dưới mỗi bubble.
  - Thanh nhập:
    - Text area auto-grow.
    - Nút emoji picker.
    - Nút chọn ảnh (icon image/camera).
    - Nút gửi.
    - Khi người dùng lựa chọn ảnh:
      - Hiển thị preview ảnh nhỏ trước khi gửi.

---

### 7. Yêu cầu phi chức năng & bảo mật

- **Bảo mật & RLS**

  - Bảng `conversations` và `messages` phải có **RLS policies**:
    - Chỉ cho phép `client_id` hoặc `worker_id` tương ứng đọc/gửi.
  - Ảnh chat:
    - Nên dùng bucket riêng (ví dụ `chat-images`).
    - Tuỳ độ nhạy cảm, có thể dùng signed URL thay vì public.

- **Giới hạn & kiểm soát**

  - Giới hạn dung lượng mỗi ảnh (vd 5MB).
  - Giới hạn số ảnh/tin (vd tối đa 5).
  - Rate limiting gửi tin nhắn để tránh spam.

- **Hiệu năng**
  - Phân trang messages (infinite scroll).
  - Index phù hợp cho truy vấn conversation/messages.

---

### 8. Hướng phát triển tương lai

- **Read receipts**:
  - Lưu/truy xuất trạng thái `delivered` / `read`, hiển thị tick đơn/đôi.
- **Typing indicator**:
  - Event `typing:start` / `typing:stop` qua socket.
- **Notification**:
  - Push notification/email khi có tin nhắn mới mà user offline.
- **Block/Report**:
  - Cho phép report hoặc chặn user, integrate vào admin panel.
