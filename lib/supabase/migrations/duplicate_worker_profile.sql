-- =============================================================================
-- FUNCTION: duplicate_worker_profile
-- =============================================================================
-- Nhân bản worker profile từ một profile ID mẫu sang một user_id mới
-- 
-- Lưu ý: User phải đã được tạo trước trong auth.users và user_profiles
-- với role = 'worker'
--
-- Usage:
--   SELECT duplicate_worker_profile(
--     'source-worker-profile-id'::uuid,
--     'target-user-id'::uuid,
--     'Copy Name Suffix'  -- Optional suffix for full_name
--   );
-- =============================================================================

CREATE OR REPLACE FUNCTION duplicate_worker_profile(
  source_profile_id UUID,
  target_user_id UUID,
  name_suffix TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_profile_id UUID;
  source_profile RECORD;
  tag_record RECORD;
  avail_record RECORD;
  image_record RECORD;
  service_record RECORD;
  pricing_record RECORD;
  new_worker_service_id UUID;
  new_full_name TEXT;
BEGIN
  -- 1. Kiểm tra user_id có tồn tại và có role worker không
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = target_user_id AND role = 'worker'
  ) THEN
    RAISE EXCEPTION 'User % does not exist or is not a worker', target_user_id;
  END IF;

  -- 2. Kiểm tra user_id đã có worker profile chưa
  IF EXISTS (
    SELECT 1 FROM worker_profiles WHERE user_id = target_user_id
  ) THEN
    RAISE EXCEPTION 'User % already has a worker profile', target_user_id;
  END IF;

  -- 3. Lấy dữ liệu worker profile gốc
  SELECT * INTO source_profile
  FROM worker_profiles
  WHERE id = source_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source worker profile % not found', source_profile_id;
  END IF;

  -- 4. Tạo full_name mới
  IF name_suffix IS NOT NULL THEN
    new_full_name := source_profile.full_name || ' (' || name_suffix || ')';
  ELSE
    new_full_name := source_profile.full_name || ' (Copy)';
  END IF;

  -- 5. Tạo worker profile mới
  INSERT INTO worker_profiles (
    user_id,
    full_name,
    nickname,
    age,
    height_cm,
    weight_kg,
    zodiac_sign,
    lifestyle,
    personal_quote,
    bio,
    profile_status,
    profile_completed_steps,
    metadata
  ) VALUES (
    target_user_id,
    new_full_name,
    source_profile.nickname,
    source_profile.age,
    source_profile.height_cm,
    source_profile.weight_kg,
    source_profile.zodiac_sign,
    source_profile.lifestyle,
    source_profile.personal_quote,
    source_profile.bio,
    'draft', -- Đặt về draft để worker có thể chỉnh sửa
    source_profile.profile_completed_steps,
    COALESCE(source_profile.metadata, '{}'::jsonb)
  )
  RETURNING id INTO new_profile_id;

  -- 6. Copy tags
  FOR tag_record IN
    SELECT * FROM worker_tags
    WHERE worker_profile_id = source_profile_id
  LOOP
    INSERT INTO worker_tags (
      worker_profile_id,
      tag_key,
      tag_value,
      tag_type
    ) VALUES (
      new_profile_id,
      tag_record.tag_key,
      tag_record.tag_value,
      tag_record.tag_type
    );
  END LOOP;

  -- 7. Copy availabilities
  FOR avail_record IN
    SELECT * FROM worker_availabilities
    WHERE worker_profile_id = source_profile_id
  LOOP
    INSERT INTO worker_availabilities (
      worker_profile_id,
      day_of_week,
      availability_type,
      start_time,
      end_time,
      notes
    ) VALUES (
      new_profile_id,
      avail_record.day_of_week,
      avail_record.availability_type,
      avail_record.start_time,
      avail_record.end_time,
      avail_record.notes
    );
  END LOOP;

  -- 8. Copy images (chỉ copy URL, không copy file thực tế)
  FOR image_record IN
    SELECT * FROM worker_images
    WHERE worker_profile_id = source_profile_id
  LOOP
    INSERT INTO worker_images (
      worker_profile_id,
      image_url,
      image_type,
      display_order,
      file_name,
      file_size_bytes,
      mime_type,
      width_px,
      height_px,
      is_approved -- Đặt về false để admin review lại
    ) VALUES (
      new_profile_id,
      image_record.image_url,
      image_record.image_type,
      image_record.display_order,
      image_record.file_name,
      image_record.file_size_bytes,
      image_record.mime_type,
      image_record.width_px,
      image_record.height_px,
      false
    );
  END LOOP;

  -- 9. Copy services và prices
  FOR service_record IN
    SELECT * FROM worker_services
    WHERE worker_profile_id = source_profile_id
  LOOP
    -- Tạo worker_service mới
    INSERT INTO worker_services (
      worker_profile_id,
      service_id,
      service_option_id,
      is_active,
      is_featured
    ) VALUES (
      new_profile_id,
      service_record.service_id,
      service_record.service_option_id,
      service_record.is_active,
      service_record.is_featured
    )
    RETURNING id INTO new_worker_service_id;

    -- Copy pricing nếu có
    SELECT * INTO pricing_record
    FROM worker_service_prices
    WHERE worker_service_id = service_record.id
    LIMIT 1;

    IF FOUND THEN
      INSERT INTO worker_service_prices (
        worker_service_id,
        price_usd,
        price_vnd,
        price_jpy,
        price_krw,
        price_cny,
        primary_currency,
        daily_discount_percent,
        weekly_discount_percent,
        monthly_discount_percent,
        is_active,
        notes,
        metadata
      ) VALUES (
        new_worker_service_id,
        pricing_record.price_usd,
        pricing_record.price_vnd,
        pricing_record.price_jpy,
        pricing_record.price_krw,
        pricing_record.price_cny,
        pricing_record.primary_currency,
        pricing_record.daily_discount_percent,
        pricing_record.weekly_discount_percent,
        pricing_record.monthly_discount_percent,
        pricing_record.is_active,
        pricing_record.notes,
        COALESCE(pricing_record.metadata, '{}'::jsonb)
      );
    END IF;
  END LOOP;

  RETURN new_profile_id;
END;
$$;

-- Comment
COMMENT ON FUNCTION duplicate_worker_profile IS 'Nhân bản worker profile từ một profile ID mẫu sang một user_id mới. User phải đã được tạo trước với role worker.';




