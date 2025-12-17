-- =============================================================================
-- SCRIPT ĐƠN GIẢN: Nhân bản worker profile
-- =============================================================================
-- 
-- CÁCH SỬ DỤNG:
-- 1. Thay đổi source_profile_id (dòng 15)
-- 2. Thay đổi danh sách user_id đích (dòng 18-22)
-- 3. Chạy script trong Supabase SQL Editor
--
-- LƯU Ý: Bạn cần tạo user với role worker TRƯỚC khi chạy script này
-- Xem hướng dẫn tạo user ở cuối file
-- =============================================================================

-- Bước 1: Chạy migration để tạo function (chỉ cần chạy 1 lần)
-- File: lib/supabase/migrations/duplicate_worker_profile.sql

-- Bước 2: Cấu hình và chạy script nhân bản
DO $$
DECLARE
  -- ⚠️ THAY ĐỔI: ID của worker profile mẫu
  source_profile_id UUID := 'PASTE-SOURCE-PROFILE-ID-HERE'::uuid;
  
  -- ⚠️ THAY ĐỔI: Danh sách user_id đích (đã tạo user với role worker)
  target_user_ids UUID[] := ARRAY[
    'PASTE-USER-ID-1-HERE'::uuid,
    'PASTE-USER-ID-2-HERE'::uuid,
    'PASTE-USER-ID-3-HERE'::uuid
    -- Thêm nhiều user_id khác nếu cần
  ];
  
  target_user_id UUID;
  new_profile_id UUID;
  counter INTEGER := 1;
BEGIN
  -- Kiểm tra source profile
  IF NOT EXISTS (
    SELECT 1 FROM worker_profiles WHERE id = source_profile_id
  ) THEN
    RAISE EXCEPTION 'Source worker profile % not found. Please check source_profile_id.', source_profile_id;
  END IF;

  -- Nhân bản cho từng user
  FOREACH target_user_id IN ARRAY target_user_ids
  LOOP
    BEGIN
      -- Gọi function nhân bản
      SELECT duplicate_worker_profile(
        source_profile_id,
        target_user_id,
        'Copy ' || counter::text
      ) INTO new_profile_id;
      
      RAISE NOTICE '[%/%] ✓ Created profile % for user %', 
        counter, 
        array_length(target_user_ids, 1),
        new_profile_id, 
        target_user_id;
      counter := counter + 1;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[%/%] ✗ Failed for user %: %', 
        counter,
        array_length(target_user_ids, 1),
        target_user_id, 
        SQLERRM;
      counter := counter + 1;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Completed! Created % profiles', counter - 1;
  RAISE NOTICE '========================================';
END $$;

-- =============================================================================
-- KIỂM TRA KẾT QUẢ
-- =============================================================================

-- Xem các profile đã tạo
SELECT 
  wp.id as profile_id,
  wp.user_id,
  up.email,
  wp.full_name,
  wp.profile_status,
  wp.profile_completed_steps,
  (SELECT COUNT(*) FROM worker_tags WHERE worker_profile_id = wp.id) as tags,
  (SELECT COUNT(*) FROM worker_availabilities WHERE worker_profile_id = wp.id) as availabilities,
  (SELECT COUNT(*) FROM worker_images WHERE worker_profile_id = wp.id) as images,
  (SELECT COUNT(*) FROM worker_services WHERE worker_profile_id = wp.id) as services,
  wp.created_at
FROM worker_profiles wp
JOIN user_profiles up ON wp.user_id = up.id
WHERE wp.user_id = ANY(ARRAY[
  -- Danh sách user_id bạn đã dùng ở trên
  'PASTE-USER-ID-1-HERE'::uuid,
  'PASTE-USER-ID-2-HERE'::uuid,
  'PASTE-USER-ID-3-HERE'::uuid
])
ORDER BY wp.created_at DESC;

-- =============================================================================
-- HƯỚNG DẪN TẠO USER VỚI ROLE WORKER
-- =============================================================================

-- CÁCH 1: Qua Supabase Dashboard (Khuyến nghị)
-- 1. Vào Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" hoặc "Create User"
-- 3. Nhập:
--    - Email: worker1@example.com
--    - Password: Worker@123456
--    - Auto Confirm User: ✓ (bật)
-- 4. Click "Create User"
-- 5. Copy User ID (UUID)
-- 6. Chạy SQL sau để tạo user_profiles:

/*
INSERT INTO user_profiles (id, email, role, status, full_name)
VALUES (
  'PASTE-USER-ID-HERE'::uuid,
  'worker1@example.com',
  'worker',
  'active',
  'Worker 1'
);
*/

-- CÁCH 2: Qua SQL (nếu user đã tồn tại trong auth.users)
-- Ví dụ: User đã đăng ký nhưng chưa có role worker

/*
-- Tìm user trong auth.users
SELECT id, email FROM auth.users WHERE email = 'worker1@example.com';

-- Tạo user_profiles với role worker
INSERT INTO user_profiles (id, email, role, status, full_name)
SELECT 
  id,
  email,
  'worker',
  'active',
  'Worker 1'
FROM auth.users
WHERE email = 'worker1@example.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'worker',
  status = 'active';
*/

-- CÁCH 3: Qua Auth Admin API (TypeScript/Node.js)
-- Chạy script TypeScript sau để tạo nhiều user nhanh:

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
    
    // Tạo auth user
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
    console.log(`✓ Created user ${i}: ${userId} (${email})`);
  }
  
  console.log('\nAll User IDs:');
  userIds.forEach((id, i) => {
    console.log(`  ${i + 1}. ${id}`);
  });
  
  return userIds;
}

// Sử dụng: tạo 5 workers
createWorkers(5).then(userIds => {
  console.log('\nCopy các user_id trên vào script SQL!');
});
*/

-- =============================================================================
-- VÍ DỤ ĐẦY ĐỦ
-- =============================================================================

-- Ví dụ: Nhân bản profile 'abc-123' sang 3 users
/*
DO $$
DECLARE
  source_profile_id UUID := 'abc-123-def-456-ghi-789'::uuid;
  target_user_ids UUID[] := ARRAY[
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid
  ];
  target_user_id UUID;
  new_profile_id UUID;
  counter INTEGER := 1;
BEGIN
  FOREACH target_user_id IN ARRAY target_user_ids
  LOOP
    SELECT duplicate_worker_profile(
      source_profile_id,
      target_user_id,
      'Copy ' || counter::text
    ) INTO new_profile_id;
    
    RAISE NOTICE 'Created profile %', new_profile_id;
    counter := counter + 1;
  END LOOP;
END $$;
*/




