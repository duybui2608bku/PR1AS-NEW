-- =============================================================================
-- SCRIPT: Nhân bản nhiều worker profile từ một ID mẫu
-- =============================================================================
-- 
-- Script này sẽ nhân bản worker profile từ một profile ID mẫu sang nhiều
-- user_id khác nhau.
--
-- LƯU Ý QUAN TRỌNG:
-- 1. Bạn cần tạo user với role worker TRƯỚC khi chạy script này
-- 2. Có thể tạo user qua Supabase Dashboard > Authentication > Users
--    hoặc qua Auth Admin API
-- 3. Sau khi tạo user, lấy user_id và thêm vào danh sách dưới đây
--
-- CÁCH SỬ DỤNG:
-- 1. Tạo các user với role worker (xem phần "Tạo user mẫu" bên dưới)
-- 2. Thay đổi source_profile_id và danh sách target_user_ids
-- 3. Chạy script này trong Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- BƯỚC 1: Tạo user mẫu (chạy từng câu lệnh một)
-- =============================================================================
-- Lưu ý: Bạn cần tạo user qua Supabase Dashboard hoặc Auth Admin API
-- vì không thể tạo user trong auth.users trực tiếp qua SQL thông thường
--
-- Cách 1: Qua Supabase Dashboard
--   1. Vào Authentication > Users > Add User
--   2. Nhập email và password
--   3. Set "Auto Confirm User" = true
--   4. Click "Create User"
--   5. Copy User ID
--
-- Cách 2: Qua Auth Admin API (TypeScript/Node.js)
--   const { data } = await supabase.auth.admin.createUser({
--     email: 'worker1@example.com',
--     password: 'Worker@123456',
--     email_confirm: true
--   });
--   const userId = data.user.id;
--
-- Sau khi có user_id, chạy SQL sau để tạo user_profiles:
-- =============================================================================

-- Ví dụ: Tạo user_profiles cho user đã có trong auth.users
-- Thay 'user-id-from-auth-users' bằng user_id thực tế
/*
INSERT INTO user_profiles (id, email, role, status, full_name)
SELECT 
  id,
  email,
  'worker'::text,
  'active'::text,
  'Worker Name'::text
FROM auth.users
WHERE id = 'user-id-from-auth-users'::uuid
ON CONFLICT (id) DO UPDATE SET
  role = 'worker',
  status = 'active';
*/

-- =============================================================================
-- BƯỚC 2: Cấu hình script nhân bản
-- =============================================================================

-- Thay đổi các giá trị này:
DO $$
DECLARE
  -- ID của worker profile mẫu cần nhân bản
  source_profile_id UUID := 'YOUR-SOURCE-PROFILE-ID-HERE'::uuid;
  
  -- Danh sách user_id đích (đã tạo user với role worker trước)
  -- Thay đổi các UUID này thành user_id thực tế của bạn
  target_user_ids UUID[] := ARRAY[
    'user-id-1'::uuid,
    'user-id-2'::uuid,
    'user-id-3'::uuid
    -- Thêm nhiều user_id khác nếu cần
  ];
  
  -- Tiền tố cho tên (tùy chọn)
  name_prefix TEXT := 'Copy';
  
  -- Biến tạm
  target_user_id UUID;
  new_profile_id UUID;
  counter INTEGER := 1;
BEGIN
  -- Kiểm tra source profile có tồn tại không
  IF NOT EXISTS (
    SELECT 1 FROM worker_profiles WHERE id = source_profile_id
  ) THEN
    RAISE EXCEPTION 'Source worker profile % not found', source_profile_id;
  END IF;

  -- Duyệt qua từng user_id và nhân bản profile
  FOREACH target_user_id IN ARRAY target_user_ids
  LOOP
    BEGIN
      -- Gọi function nhân bản
      SELECT duplicate_worker_profile(
        source_profile_id,
        target_user_id,
        name_prefix || ' ' || counter::text
      ) INTO new_profile_id;
      
      RAISE NOTICE '✓ Created profile % for user %', new_profile_id, target_user_id;
      counter := counter + 1;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '✗ Failed to create profile for user %: %', target_user_id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Completed! Created % profiles', counter - 1;
END $$;

-- =============================================================================
-- BƯỚC 3: Kiểm tra kết quả
-- =============================================================================

-- Xem các profile đã tạo
/*
SELECT 
  wp.id as profile_id,
  wp.user_id,
  up.email,
  wp.full_name,
  wp.profile_status,
  wp.profile_completed_steps,
  (SELECT COUNT(*) FROM worker_tags WHERE worker_profile_id = wp.id) as tag_count,
  (SELECT COUNT(*) FROM worker_availabilities WHERE worker_profile_id = wp.id) as availability_count,
  (SELECT COUNT(*) FROM worker_images WHERE worker_profile_id = wp.id) as image_count,
  (SELECT COUNT(*) FROM worker_services WHERE worker_profile_id = wp.id) as service_count
FROM worker_profiles wp
JOIN user_profiles up ON wp.user_id = up.id
WHERE wp.user_id IN (
  -- Danh sách user_id bạn đã dùng ở trên
  'user-id-1'::uuid,
  'user-id-2'::uuid,
  'user-id-3'::uuid
)
ORDER BY wp.created_at DESC;
*/

-- =============================================================================
-- VÍ DỤ SỬ DỤNG ĐƠN GIẢN (cho 1 profile)
-- =============================================================================

-- Nhân bản 1 profile sang 1 user
/*
SELECT duplicate_worker_profile(
  'source-profile-id'::uuid,
  'target-user-id'::uuid,
  'Copy 1'
);
*/

-- =============================================================================
-- HƯỚNG DẪN TẠO NHIỀU USER NHANH (nếu bạn có quyền truy cập Auth Admin API)
-- =============================================================================

-- Tạo script TypeScript để tạo nhiều user:
/*
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createWorkers(count: number) {
  const userIds: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    const email = `worker${i}@example.com`;
    const password = 'Worker@123456';
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (error) {
      console.error(`Failed to create user ${i}:`, error);
      continue;
    }
    
    const userId = data.user.id;
    
    // Tạo user_profiles
    await supabase.from('user_profiles').insert({
      id: userId,
      email,
      role: 'worker',
      status: 'active',
      full_name: `Worker ${i}`,
    });
    
    userIds.push(userId);
    console.log(`Created user ${i}: ${userId}`);
  }
  
  return userIds;
}

// Sử dụng
createWorkers(5).then(userIds => {
  console.log('User IDs:', userIds);
  // Copy các user_id này vào script SQL ở trên
});
*/

