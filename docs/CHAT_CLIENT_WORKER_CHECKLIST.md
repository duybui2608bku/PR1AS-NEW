# Checklist triển khai tính năng Chat Client – Worker

> Tài liệu này liệt kê đầy đủ các task cần thực hiện để triển khai tính năng nhắn tin giữa Client và Worker, bao gồm hỗ trợ text, emoji/icon, và gửi ảnh.
>
> Tham khảo: [CHAT_CLIENT_WORKER_DESIGN.md](./CHAT_CLIENT_WORKER_DESIGN.md)

---

## 📋 Tổng quan

- **Tổng số task**: ~80+ tasks
- **Ưu tiên**: Database → Backend APIs → Real-time → Frontend → Testing → Security

---

## 🗄️ PHẦN 1: Database & Migration

### 1.1. Tạo bảng `conversations`

- [x] Tạo migration file cho bảng `conversations`
- [x] Định nghĩa các trường:
  - [x] `id` (UUID, PK)
  - [x] `client_id` (UUID, FK → users.id, NOT NULL)
  - [x] `worker_id` (UUID, FK → users.id, NOT NULL)
  - [x] `booking_id` (UUID, FK → bookings.id, NULLABLE)
  - [x] `created_at` (timestamp with time zone, default now())
  - [x] `updated_at` (timestamp with time zone)
  - [x] `last_message_id` (UUID, FK → messages.id, NULLABLE)
  - [x] `last_message_at` (timestamp with time zone)
- [x] Tạo UNIQUE constraint: `(client_id, worker_id, booking_id)`
- [x] Tạo index: `(client_id, last_message_at DESC)`
- [x] Tạo index: `(worker_id, last_message_at DESC)`
- [x] Thêm foreign key constraints
- [ ] Chạy migration và verify

### 1.2. Tạo bảng `messages`

- [x] Tạo migration file cho bảng `messages`
- [x] Định nghĩa các trường:
  - [x] `id` (UUID, PK)
  - [x] `conversation_id` (UUID, FK → conversations.id, NOT NULL)
  - [x] `sender_id` (UUID, FK → users.id, NOT NULL)
  - [x] `content` (TEXT, có thể rỗng)
  - [x] `content_type` (ENUM: 'text' | 'image' | 'mixed', default 'text')
  - [x] `attachments` (JSONB, NULLABLE)
  - [x] `status` (ENUM: 'sent' | 'delivered' | 'read', default 'sent')
  - [x] `created_at` (timestamp with time zone, default now())
  - [x] `updated_at` (timestamp with time zone)
- [x] Tạo index: `(conversation_id, created_at DESC)`
- [x] Thêm foreign key constraints
- [ ] Chạy migration và verify

### 1.3. Tạo ENUM types

- [x] Tạo ENUM `message_content_type` ('text', 'image', 'mixed')
- [x] Tạo ENUM `message_status` ('sent', 'delivered', 'read')
- [x] Verify ENUM types được sử dụng đúng trong migrations

### 1.4. Row Level Security (RLS)

- [x] Tạo RLS policy cho `conversations`:
  - [x] Policy SELECT: chỉ `client_id` hoặc `worker_id` được đọc
  - [x] Policy INSERT: chỉ `client_id` hoặc `worker_id` được tạo
  - [x] Policy UPDATE: chỉ `client_id` hoặc `worker_id` được cập nhật
- [x] Tạo RLS policy cho `messages`:
  - [x] Policy SELECT: chỉ user thuộc conversation được đọc
  - [x] Policy INSERT: chỉ `sender_id` = current user được tạo
  - [x] Policy UPDATE: chỉ `sender_id` = current user được cập nhật
- [ ] Test RLS policies với các user khác nhau
- [x] Verify admin có thể bypass RLS nếu cần

### 1.5. Supabase Storage setup

- [x] Tạo bucket `chat-images` trong Supabase Storage
- [x] Cấu hình bucket policy (public hoặc signed URL)
- [x] Tạo RLS policy cho bucket (nếu dùng signed URL)
- [ ] Verify upload/download permissions

---

## 🔧 PHẦN 2: Backend APIs

### 2.1. Service Layer - Conversation Service

- [x] Tạo file `lib/chat/conversation.service.ts`
- [x] Implement `findOrCreateConversation(clientId, workerId, bookingId?)`:
  - [x] Logic tìm conversation tồn tại
  - [x] Logic tạo mới nếu chưa có
  - [x] Return conversation object
- [x] Implement `getConversationsByUserId(userId, role, page?, limit?)`:
  - [x] Filter theo `client_id` hoặc `worker_id` dựa trên role
  - [x] Sort theo `last_message_at DESC`
  - [x] Join với `messages` để lấy `lastMessage`
  - [x] Phân trang
- [x] Implement `getConversationById(conversationId, userId)`:
  - [x] Kiểm tra user thuộc conversation
  - [x] Return conversation + metadata
- [x] Implement `updateLastMessage(conversationId, messageId, timestamp)`:
  - [x] Cập nhật `last_message_id` và `last_message_at`
- [x] Add error handling và validation
- [x] Add TypeScript types/interfaces

### 2.2. Service Layer - Message Service

- [x] Tạo file `lib/chat/message.service.ts`
- [x] Implement `createMessage(conversationId, senderId, content?, attachments?)`:
  - [x] Validate `content` hoặc `attachments` phải có ít nhất một
  - [x] Tính `content_type` (text/image/mixed)
  - [x] Insert vào DB
  - [x] Update conversation `last_message`
  - [x] Return message object
- [x] Implement `getMessages(conversationId, userId, cursor?, limit?)`:
  - [x] Kiểm tra user thuộc conversation
  - [x] Query với cursor-based pagination
  - [x] Sort `created_at DESC`
  - [x] Return messages + `hasMore` + `nextCursor`
- [x] Implement `updateMessageStatus(messageId, status)`:
  - [x] Update `status` (delivered/read)
- [x] Implement `markAsRead(conversationId, userId)`:
  - [x] Mark tất cả messages của đối phương là 'read'
- [x] Add error handling và validation
- [x] Add TypeScript types/interfaces

### 2.3. Service Layer - Image Upload Service

- [x] Tạo file `lib/chat/image-upload.service.ts`
- [x] Implement `uploadChatImage(file, conversationId)`:
  - [x] Validate file size (≤ 5MB)
  - [x] Validate mime type (image/jpeg, image/png, image/webp)
  - [x] Generate unique filename với path: `conversationId/yyyy/mm/dd/messageId/randomName.ext`
  - [x] Upload lên Supabase Storage
  - [x] Extract metadata (width, height, size, mime_type) nếu có
  - [x] Return attachment object
- [x] Implement `deleteChatImage(url)` (optional, cho cleanup)
- [x] Add error handling
- [x] Add TypeScript types/interfaces

### 2.4. API Route - POST /api/chat/conversations

- [x] Tạo file `app/api/chat/conversations/route.ts`
- [x] Implement POST handler:
  - [x] Lấy `currentUserId` từ auth session
  - [x] Validate body: `workerId` (required), `bookingId?` (optional)
  - [x] Xác định `clientId` và `workerId` dựa trên role của current user
  - [x] Gọi `findOrCreateConversation`
  - [x] Return conversation object
- [x] Add error handling (400, 401, 403, 500)
- [x] Add request validation (Zod schema hoặc tương đương)
- [x] Add API documentation comments

### 2.5. API Route - GET /api/chat/conversations

- [x] Implement GET handler trong `app/api/chat/conversations/route.ts`
- [x] Lấy `currentUserId` và role từ auth
- [x] Parse query params: `page?`, `limit?`
- [x] Gọi `getConversationsByUserId`
- [x] Return danh sách conversations với `lastMessage`
- [x] Add error handling
- [x] Add pagination metadata trong response

### 2.6. API Route - GET /api/chat/conversations/[conversationId]/messages

- [x] Tạo file `app/api/chat/conversations/[conversationId]/messages/route.ts`
- [x] Implement GET handler:
  - [x] Lấy `conversationId` từ params
  - [x] Lấy `currentUserId` từ auth
  - [x] Parse query params: `cursor?`, `limit?` (default 30)
  - [x] Gọi `getMessages`
  - [x] Return messages array + pagination info
- [x] Add error handling (404 nếu conversation không tồn tại hoặc không có quyền)
- [x] Add request validation

### 2.7. API Route - POST /api/chat/conversations/[conversationId]/messages

- [x] Tạo file `app/api/chat/conversations/[conversationId]/messages/route.ts`
- [x] Implement POST handler:
  - [x] Lấy `conversationId` từ params
  - [x] Lấy `currentUserId` từ auth
  - [x] Validate body: `content?`, `attachments?` (ít nhất một phải có)
  - [x] Kiểm tra user thuộc conversation
  - [x] Gọi `createMessage`
  - [ ] Emit real-time event (nếu dùng WebSocket/Socket.io)
  - [x] Return message object
- [x] Add error handling
- [x] Add request validation (Zod schema)
- [ ] Add rate limiting (tránh spam)

### 2.8. API Route - POST /api/chat/uploads/image

- [x] Tạo file `app/api/chat/uploads/image/route.ts`
- [x] Implement POST handler:
  - [x] Lấy `currentUserId` từ auth
  - [x] Parse `multipart/form-data` với field `file`
  - [x] Lấy `conversationId` từ query hoặc body (cần để tạo path)
  - [x] Validate file size và mime type
  - [x] Gọi `uploadChatImage`
  - [x] Return attachment object với metadata
- [x] Add error handling (400 nếu file invalid, 413 nếu quá lớn)
- [x] Add file validation
- [ ] Limit số lượng file upload đồng thời

### 2.9. API Route - PATCH /api/chat/messages/[messageId]/read (Optional)

- [x] Tạo file `app/api/chat/messages/[messageId]/read/route.ts`
- [x] Implement PATCH handler để mark message as read
- [x] Add error handling

### 2.10. API Route - GET /api/chat/conversations/[conversationId] (Optional)

- [x] Tạo file `app/api/chat/conversations/[conversationId]/route.ts`
- [x] Implement GET handler để lấy chi tiết conversation
- [x] Add error handling

---

## 🔌 PHẦN 3: Real-time / WebSocket

### 3.1. Setup WebSocket Server (nếu dùng Socket.io)

- [x] Quyết định giải pháp: **Supabase Realtime** (không dùng Socket.io ở phase đầu)
- [ ] Nếu dùng Socket.io (OPTIONAL – chỉ làm nếu sau này chuyển sang Socket.io):
  - [ ] Install dependencies (`socket.io`, `socket.io-client`)
  - [ ] Setup Socket.io server (có thể trong Next.js API route hoặc separate server)
  - [ ] Configure CORS và authentication middleware
- [x] Nếu dùng Supabase Realtime:
  - [x] Enable Realtime cho bảng `messages` trong Supabase
  - [x] Định nghĩa chiến lược subscription: filter theo `conversation_id`, listen sự kiện INSERT để nhận `message:new`

### 3.2. Socket Authentication

- [ ] Implement socket authentication middleware:
  - [ ] Extract JWT token từ handshake
  - [ ] Verify token và lấy `userId`
  - [ ] Lưu `userId` trong socket context
  - [ ] Reject connection nếu không có token hoặc invalid
- [ ] Test authentication flow

### 3.3. Socket Events - Join Room

- [ ] Implement event handler `chat:join`:
  - [ ] Nhận `conversationId` từ payload
  - [ ] Kiểm tra user thuộc conversation
  - [ ] Join socket vào room `conversationId`
  - [ ] Emit confirmation nếu cần
- [ ] Implement event handler `chat:leave` (optional)
- [ ] Add error handling

### 3.4. Socket Events - Send Message (Optional, nếu không dùng REST)

- [ ] Implement event handler `chat:sendMessage`:
  - [ ] Validate payload (giống REST POST body)
  - [ ] Gọi `createMessage` service
  - [ ] Emit `chat:message:new` tới room `conversationId`
  - [ ] Return message object
- [ ] Add error handling

### 3.5. Socket Events - Typing Indicator (Future)

- [ ] Implement event handler `chat:typing:start`
- [ ] Implement event handler `chat:typing:stop`
- [ ] Broadcast typing status tới đối phương trong room

### 3.6. Supabase Realtime Setup (nếu dùng)

- [x] Enable Realtime cho bảng `messages`
- [x] Create subscription filter theo `conversation_id`
- [x] Handle INSERT events để emit `message:new` (sử dụng payload INSERT từ Supabase Realtime)
- [ ] Test Realtime subscription end-to-end (sẽ thực hiện cùng frontend hooks ở PHẦN 4)

---

## 🎨 PHẦN 4: Frontend Components & Hooks

### 4.1. TypeScript Types & Interfaces

- [ ] Tạo file `types/chat.ts`:
  - [ ] `Conversation` interface
  - [ ] `Message` interface
  - [ ] `Attachment` interface
  - [ ] `MessageContentType` type
  - [ ] `MessageStatus` type
  - [ ] API request/response types
- [ ] Export types để sử dụng trong components

### 4.2. API Client Functions

- [ ] Tạo file `lib/chat/api.ts`:
  - [ ] `createOrGetConversation(workerId, bookingId?)`
  - [ ] `getConversations(page?, limit?)`
  - [ ] `getConversationMessages(conversationId, cursor?, limit?)`
  - [ ] `sendMessage(conversationId, content?, attachments?)`
  - [ ] `uploadChatImage(file, conversationId)`
  - [ ] `markConversationAsRead(conversationId)` (optional)
- [ ] Add error handling và TypeScript types
- [ ] Add request/response interceptors nếu cần

### 4.3. React Hooks - useConversations

- [ ] Tạo file `hooks/chat/useConversations.ts`
- [ ] Implement hook:
  - [ ] Fetch danh sách conversations
  - [ ] Pagination support
  - [ ] Loading và error states
  - [ ] Refetch function
- [ ] Return: `{ conversations, loading, error, refetch, loadMore }`

### 4.4. React Hooks - useConversation

- [ ] Tạo file `hooks/chat/useConversation.ts`
- [ ] Implement hook:
  - [ ] Fetch conversation by ID
  - [ ] Loading và error states
  - [ ] Refetch function
- [ ] Return: `{ conversation, loading, error, refetch }`

### 4.5. React Hooks - useMessages

- [ ] Tạo file `hooks/chat/useMessages.ts`
- [ ] Implement hook:
  - [ ] Fetch messages với cursor-based pagination
  - [ ] Infinite scroll support
  - [ ] Loading và error states
  - [ ] Load more function
- [ ] Return: `{ messages, loading, error, hasMore, loadMore }`

### 4.6. React Hooks - useSendMessage

- [ ] Tạo file `hooks/chat/useSendMessage.ts`
- [ ] Implement hook:
  - [ ] Send message mutation
  - [ ] Optimistic update
  - [ ] Error handling
  - [ ] Success callback
- [ ] Return: `{ sendMessage, loading, error }`

### 4.7. React Hooks - useChatSocket (nếu dùng Socket.io)

- [ ] Tạo file `hooks/chat/useChatSocket.ts`
- [ ] Implement hook:
  - [ ] Connect/disconnect socket
  - [ ] Join conversation room
  - [ ] Listen `chat:message:new` event
  - [ ] Handle new messages
  - [ ] Cleanup on unmount
- [ ] Return: `{ socket, isConnected, joinRoom, leaveRoom }`

### 4.8. React Hooks - useSupabaseRealtime (nếu dùng Supabase Realtime)

- [ ] Tạo file `hooks/chat/useSupabaseRealtime.ts`
- [ ] Implement hook:
  - [ ] Subscribe to messages table changes
  - [ ] Filter by `conversation_id`
  - [ ] Handle INSERT events
  - [ ] Cleanup subscription
- [ ] Return: `{ subscribe, unsubscribe }`

### 4.9. Component - ConversationList

- [ ] Tạo file `components/chat/ConversationList.tsx`
- [ ] Implement component:
  - [ ] Hiển thị danh sách conversations
  - [ ] Avatar và tên đối phương
  - [ ] Last message preview (text hoặc "📷 Ảnh")
  - [ ] Timestamp formatting
  - [ ] Click để mở conversation
  - [ ] Loading skeleton
  - [ ] Empty state
- [ ] Add responsive design
- [ ] Add i18n support

### 4.10. Component - MessageBubble

- [ ] Tạo file `components/chat/MessageBubble.tsx`
- [ ] Implement component:
  - [ ] Hiển thị bubble trái/phải dựa trên `senderId`
  - [ ] Render text content (support emoji unicode)
  - [ ] Render image attachments (thumbnail grid)
  - [ ] Timestamp hiển thị
  - [ ] Status indicator (sent/delivered/read) nếu có
- [ ] Add styling (Ant Design hoặc Tailwind)
- [ ] Add click handler để mở image viewer

### 4.11. Component - MessageList

- [ ] Tạo file `components/chat/MessageList.tsx`
- [ ] Implement component:
  - [ ] Render danh sách messages
  - [ ] Infinite scroll (load more khi scroll lên)
  - [ ] Auto scroll xuống cuối khi có message mới
  - [ ] Group messages theo ngày (optional)
  - [ ] Loading state
- [ ] Use `useMessages` hook
- [ ] Add scroll behavior logic

### 4.12. Component - ChatInput

- [ ] Tạo file `components/chat/ChatInput.tsx`
- [ ] Implement component:
  - [ ] Textarea auto-grow
  - [ ] Emoji picker button và modal
  - [ ] Image picker button (file input)
  - [ ] Image preview (hiển thị ảnh đã chọn trước khi gửi)
  - [ ] Send button
  - [ ] Disable send khi không có content và attachments
- [ ] Handle emoji selection
- [ ] Handle image selection và preview
- [ ] Handle send message

### 4.13. Component - EmojiPicker

- [ ] Tạo file `components/chat/EmojiPicker.tsx`
- [ ] Implement component:
  - [ ] Emoji picker UI (có thể dùng library như `emoji-picker-react`)
  - [ ] Insert emoji vào textarea
  - [ ] Close modal khi chọn
- [ ] Add i18n cho emoji categories nếu cần

### 4.14. Component - ImageViewer

- [ ] Tạo file `components/chat/ImageViewer.tsx`
- [ ] Implement component:
  - [ ] Full-screen image viewer modal
  - [ ] Support multiple images (swipe/arrow navigation)
  - [ ] Zoom in/out
  - [ ] Close button
- [ ] Use Ant Design Modal hoặc custom modal

### 4.15. Component - ChatHeader

- [ ] Tạo file `components/chat/ChatHeader.tsx`
- [ ] Implement component:
  - [ ] Avatar và tên đối phương
  - [ ] Online/offline status (nếu có)
  - [ ] Back button (mobile)
  - [ ] Menu/actions (optional)
- [ ] Add responsive design

### 4.16. Component - ChatPage (Main Container)

- [ ] Tạo file `app/client/chat/page.tsx` hoặc `app/worker/chat/page.tsx`
- [ ] Implement page:
  - [ ] Layout với ConversationList và ChatDetail
  - [ ] Routing để mở conversation cụ thể
  - [ ] Handle pre-booking chat flow
  - [ ] Handle booking chat flow
- [ ] Add loading states
- [ ] Add error boundaries

### 4.17. Component - ChatDetail

- [ ] Tạo file `components/chat/ChatDetail.tsx`
- [ ] Implement component:
  - [ ] ChatHeader
  - [ ] MessageList
  - [ ] ChatInput
  - [ ] Real-time message updates
  - [ ] Join conversation room khi mount
- [ ] Use hooks: `useMessages`, `useSendMessage`, `useChatSocket`/`useSupabaseRealtime`

---

## 🎯 PHẦN 5: UI/UX Implementation

### 5.1. Entry Points - Pre-booking Chat

- [ ] Thêm nút "Nhắn tin" vào worker profile page
- [ ] Thêm nút "Nhắn tin" vào worker listing card
- [ ] Thêm nút "Nhắn tin" vào service detail page
- [ ] Handle click: gọi API `createOrGetConversation` với `bookingId = null`
- [ ] Navigate đến chat page với `conversationId`

### 5.2. Entry Points - Booking Chat

- [ ] Thêm tab "Chat" vào booking detail page
- [ ] Handle tab click: gọi API `createOrGetConversation` với `bookingId`
- [ ] Hiển thị ChatDetail component trong tab

### 5.3. Styling & Theming

- [ ] Style conversation list với Ant Design/Tailwind
- [ ] Style message bubbles (left/right alignment, colors)
- [ ] Style chat input area
- [ ] Add dark mode support (nếu có)
- [ ] Add responsive design (mobile/tablet/desktop)
- [ ] Add animations (message appear, typing indicator)

### 5.4. Image Handling

- [ ] Implement image upload flow:
  - [ ] Select file(s) từ file input
  - [ ] Show preview thumbnails
  - [ ] Upload to API trước khi gửi message
  - [ ] Show upload progress (optional)
  - [ ] Handle upload errors
- [ ] Implement image display:
  - [ ] Thumbnail grid cho multiple images
  - [ ] Click để mở ImageViewer
  - [ ] Lazy loading cho images
  - [ ] Error fallback nếu image load fail

### 5.5. Emoji Support

- [ ] Integrate emoji picker library
- [ ] Support emoji trong text input (unicode)
- [ ] Render emoji trong message bubbles
- [ ] Test với các emoji phổ biến

### 5.6. Timestamp Formatting

- [ ] Format timestamp hiển thị:
  - [ ] "Hôm nay HH:mm" cho messages hôm nay
  - [ ] "Hôm qua HH:mm" cho messages hôm qua
  - [ ] "DD/MM/YYYY HH:mm" cho messages cũ hơn
- [ ] Add i18n cho date formatting
- [ ] Use `dayjs` hoặc `date-fns`

### 5.7. Empty States

- [ ] Empty state cho conversation list (chưa có chat nào)
- [ ] Empty state cho message list (chưa có message nào)
- [ ] Empty state cho search (nếu có)

### 5.8. Loading States

- [ ] Skeleton loading cho conversation list
- [ ] Skeleton loading cho message list
- [ ] Loading indicator khi gửi message
- [ ] Loading indicator khi upload image

---

## 🧪 PHẦN 6: Testing

### 6.1. Backend API Tests

- [ ] Test `POST /api/chat/conversations`:
  - [ ] Tạo conversation mới
  - [ ] Lấy conversation tồn tại
  - [ ] Error cases (unauthorized, invalid workerId)
- [ ] Test `GET /api/chat/conversations`:
  - [ ] Lấy danh sách conversations của client
  - [ ] Lấy danh sách conversations của worker
  - [ ] Pagination
- [ ] Test `GET /api/chat/conversations/[id]/messages`:
  - [ ] Lấy messages với pagination
  - [ ] Error cases (conversation không tồn tại, không có quyền)
- [ ] Test `POST /api/chat/conversations/[id]/messages`:
  - [ ] Gửi text message
  - [ ] Gửi image message
  - [ ] Gửi mixed message
  - [ ] Error cases (invalid content, không có quyền)
- [ ] Test `POST /api/chat/uploads/image`:
  - [ ] Upload image thành công
  - [ ] Error cases (file quá lớn, invalid mime type)

### 6.2. Service Layer Tests

- [ ] Test `conversation.service.ts`:
  - [ ] `findOrCreateConversation`
  - [ ] `getConversationsByUserId`
  - [ ] `getConversationById`
- [ ] Test `message.service.ts`:
  - [ ] `createMessage`
  - [ ] `getMessages`
  - [ ] `updateMessageStatus`
- [ ] Test `image-upload.service.ts`:
  - [ ] `uploadChatImage`
  - [ ] File validation

### 6.3. Frontend Component Tests

- [ ] Test ConversationList component
- [ ] Test MessageBubble component
- [ ] Test MessageList component
- [ ] Test ChatInput component
- [ ] Test hooks (useConversations, useMessages, useSendMessage)

### 6.4. Integration Tests

- [ ] Test flow: Client tạo conversation → gửi message → Worker nhận message
- [ ] Test flow: Pre-booking chat → tạo booking → chuyển sang booking chat
- [ ] Test real-time: gửi message → đối phương nhận ngay lập tức
- [ ] Test image upload flow end-to-end

### 6.5. E2E Tests (Optional)

- [ ] E2E test với Playwright:
  - [ ] Client mở chat với worker
  - [ ] Gửi text message
  - [ ] Gửi image message
  - [ ] Worker nhận và reply

---

## 🔒 PHẦN 7: Security & Performance

### 7.1. Security

- [ ] Verify RLS policies hoạt động đúng
- [ ] Test: user không thể đọc conversation của người khác
- [ ] Test: user không thể gửi message vào conversation không thuộc về mình
- [ ] Add rate limiting cho send message API
- [ ] Validate và sanitize user input (XSS prevention)
- [ ] Verify image upload validation (size, mime type)
- [ ] Add CSRF protection nếu cần

### 7.2. Performance

- [ ] Optimize database queries (verify indexes được sử dụng)
- [ ] Implement message pagination (cursor-based)
- [ ] Implement conversation list pagination
- [ ] Lazy load images trong message list
- [ ] Debounce real-time updates nếu cần
- [ ] Optimize re-renders (React.memo, useMemo, useCallback)
- [ ] Add loading states để improve perceived performance

### 7.3. Error Handling

- [ ] Add error boundaries cho chat components
- [ ] Handle network errors gracefully
- [ ] Show user-friendly error messages
- [ ] Log errors để debug
- [ ] Retry logic cho failed requests (optional)

---

## 🚀 PHẦN 8: Deployment & Documentation

### 8.1. Database Migration

- [ ] Review migration files
- [ ] Test migrations trên staging
- [ ] Backup database trước khi chạy migration production
- [ ] Run migrations trên production
- [ ] Verify tables và indexes được tạo đúng

### 8.2. Environment Configuration

- [ ] Add environment variables:
  - [ ] Supabase Storage bucket name
  - [ ] Socket.io server URL (nếu dùng)
  - [ ] Rate limiting config
- [ ] Update `.env.example`
- [ ] Update deployment config (Vercel, etc.)

### 8.3. Monitoring & Logging

- [ ] Add logging cho chat operations
- [ ] Monitor API response times
- [ ] Monitor WebSocket connections
- [ ] Set up alerts cho errors
- [ ] Track metrics (messages sent, conversations created)

### 8.4. Documentation

- [ ] Update API documentation
- [ ] Add JSDoc comments cho functions
- [ ] Update README với hướng dẫn setup chat feature
- [ ] Document environment variables
- [ ] Create user guide (nếu cần)

### 8.5. Code Review Checklist

- [ ] Code follows project conventions
- [ ] TypeScript types đầy đủ
- [ ] Error handling đầy đủ
- [ ] No console.logs trong production code
- [ ] Comments cho complex logic
- [ ] Tests pass
- [ ] No linter errors

---

## 📝 Notes

- **Priority order**: Database → Backend → Real-time → Frontend → Testing → Security
- **Estimated timeline**: Tùy vào team size và complexity, có thể mất 2-4 tuần
- **Dependencies**: Cần có auth system, booking system (cho booking chat), Supabase setup

---

## ✅ Completion Tracking

- **Total tasks**: ~150+
- **Completed**: 0
- **In Progress**: 0
- **Pending**: ~150+

---

_Last updated: [Date]_
