/**
 * Script để nhân bản nhiều worker profile từ một ID mẫu
 *
 * Script này sẽ:
 * 1. Tạo user với role worker (trong auth.users và user_profiles)
 * 2. Lấy dữ liệu từ worker profile gốc (bao gồm tags, availabilities, images, services, service prices)
 * 3. Tạo worker profile mới với user_id mới
 * 4. Copy tất cả dữ liệu liên quan (tags, availabilities, images, services, prices)
 *
 * Usage:
 *   npx tsx scripts/duplicate-worker-profiles.ts <source-worker-profile-id> <count> [email-prefix]
 *
 * Ví dụ:
 *   npx tsx scripts/duplicate-worker-profiles.ts abc-123-def-456 5 worker
 *   // Sẽ tạo 5 worker profiles với email: worker1@example.com, worker2@example.com, ...
 */

import { createClient } from "@supabase/supabase-js";
import { UserRole } from "@/lib/utils/enums";

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  console.error(
    "Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DuplicateOptions {
  sourceProfileId: string;
  count: number;
  emailPrefix: string;
  password: string;
}

/**
 * Lấy đầy đủ dữ liệu worker profile bao gồm tất cả các bảng liên quan
 */
async function getFullWorkerProfile(profileId: string) {
  const { data, error } = await supabase
    .from("worker_profiles")
    .select(
      `
      *,
      tags:worker_tags(*),
      availabilities:worker_availabilities(*),
      images:worker_images(*),
      services:worker_services(
        *,
        service:services(*),
        service_option:service_options(*),
        pricing:worker_service_prices(*)
      )
    `
    )
    .eq("id", profileId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch source profile: ${error.message}`);
  }

  return data;
}

/**
 * Tạo user mới với role worker
 */
async function createWorkerUser(
  email: string,
  password: string,
  fullName: string
) {
  // Kiểm tra email đã tồn tại chưa
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id, email")
    .eq("email", email)
    .single();

  if (existingProfile) {
    throw new Error(`Email ${email} already exists`);
  }

  // Tạo auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error("Failed to create auth user: no user returned");
  }

  // Tạo user profile với role worker
  const { error: profileError } = await supabase.from("user_profiles").insert({
    id: authData.user.id,
    email: authData.user.email,
    full_name: fullName,
    role: UserRole.WORKER,
    status: "active",
  });

  if (profileError) {
    // Cleanup: delete auth user if profile creation fails
    await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {
      // Ignore cleanup errors
    });
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  return authData.user.id;
}

/**
 * Nhân bản worker profile từ dữ liệu gốc
 */
async function duplicateWorkerProfile(
  sourceData: any,
  newUserId: string,
  index: number
) {
  // 1. Tạo worker profile mới
  const profileData = {
    user_id: newUserId,
    full_name: `${sourceData.full_name} (Copy ${index})`,
    nickname: sourceData.nickname,
    age: sourceData.age,
    height_cm: sourceData.height_cm,
    weight_kg: sourceData.weight_kg,
    zodiac_sign: sourceData.zodiac_sign,
    lifestyle: sourceData.lifestyle,
    personal_quote: sourceData.personal_quote,
    bio: sourceData.bio,
    profile_status: "draft", // Đặt về draft để worker có thể chỉnh sửa
    profile_completed_steps: sourceData.profile_completed_steps,
    metadata: sourceData.metadata || {},
  };

  const { data: newProfile, error: profileError } = await supabase
    .from("worker_profiles")
    .insert(profileData)
    .select()
    .single();

  if (profileError) {
    throw new Error(`Failed to create worker profile: ${profileError.message}`);
  }

  const newProfileId = newProfile.id;

  // 2. Copy tags
  if (sourceData.tags && sourceData.tags.length > 0) {
    const tagsToInsert = sourceData.tags.map((tag: any) => ({
      worker_profile_id: newProfileId,
      tag_key: tag.tag_key,
      tag_value: tag.tag_value,
      tag_type: tag.tag_type,
    }));

    const { error: tagsError } = await supabase
      .from("worker_tags")
      .insert(tagsToInsert);

    if (tagsError) {
      console.warn(`Warning: Failed to copy tags: ${tagsError.message}`);
    }
  }

  // 3. Copy availabilities
  if (sourceData.availabilities && sourceData.availabilities.length > 0) {
    const availabilitiesToInsert = sourceData.availabilities.map(
      (avail: any) => ({
        worker_profile_id: newProfileId,
        day_of_week: avail.day_of_week,
        availability_type: avail.availability_type,
        start_time: avail.start_time,
        end_time: avail.end_time,
        notes: avail.notes,
      })
    );

    const { error: availError } = await supabase
      .from("worker_availabilities")
      .insert(availabilitiesToInsert);

    if (availError) {
      console.warn(
        `Warning: Failed to copy availabilities: ${availError.message}`
      );
    }
  }

  // 4. Copy images (chỉ copy URL, không copy file thực tế)
  if (sourceData.images && sourceData.images.length > 0) {
    const imagesToInsert = sourceData.images.map((img: any) => ({
      worker_profile_id: newProfileId,
      image_url: img.image_url,
      image_type: img.image_type,
      display_order: img.display_order,
      file_name: img.file_name,
      file_size_bytes: img.file_size_bytes,
      mime_type: img.mime_type,
      width_px: img.width_px,
      height_px: img.height_px,
      is_approved: false, // Đặt về false để admin review lại
    }));

    const { error: imagesError } = await supabase
      .from("worker_images")
      .insert(imagesToInsert);

    if (imagesError) {
      console.warn(`Warning: Failed to copy images: ${imagesError.message}`);
    }
  }

  // 5. Copy services và prices
  if (sourceData.services && sourceData.services.length > 0) {
    for (const service of sourceData.services) {
      // Tạo worker_service
      const { data: newWorkerService, error: serviceError } = await supabase
        .from("worker_services")
        .insert({
          worker_profile_id: newProfileId,
          service_id: service.service_id,
          service_option_id: service.service_option_id,
          is_active: service.is_active,
          is_featured: service.is_featured,
        })
        .select()
        .single();

      if (serviceError) {
        console.warn(
          `Warning: Failed to copy service ${service.service_id}: ${serviceError.message}`
        );
        continue;
      }

      // Copy pricing nếu có
      if (service.pricing && service.pricing.length > 0) {
        const pricing = service.pricing[0]; // Lấy pricing đầu tiên
        const { error: pricingError } = await supabase
          .from("worker_service_prices")
          .insert({
            worker_service_id: newWorkerService.id,
            price_usd: pricing.price_usd,
            price_vnd: pricing.price_vnd,
            price_jpy: pricing.price_jpy,
            price_krw: pricing.price_krw,
            price_cny: pricing.price_cny,
            primary_currency: pricing.primary_currency,
            daily_discount_percent: pricing.daily_discount_percent,
            weekly_discount_percent: pricing.weekly_discount_percent,
            monthly_discount_percent: pricing.monthly_discount_percent,
            is_active: pricing.is_active,
            notes: pricing.notes,
            metadata: pricing.metadata || {},
          });

        if (pricingError) {
          console.warn(
            `Warning: Failed to copy pricing for service ${service.service_id}: ${pricingError.message}`
          );
        }
      }
    }
  }

  return newProfileId;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error(
      "Usage: npx tsx scripts/duplicate-worker-profiles.ts <source-worker-profile-id> <count> [email-prefix] [password]"
    );
    console.error("");
    console.error("Arguments:");
    console.error(
      "  source-worker-profile-id: ID của worker profile mẫu cần nhân bản"
    );
    console.error("  count: Số lượng worker profile cần tạo");
    console.error("  email-prefix: Tiền tố cho email (mặc định: 'worker')");
    console.error(
      "  password: Mật khẩu cho các user mới (mặc định: 'Worker@123456')"
    );
    console.error("");
    console.error("Example:");
    console.error(
      "  npx tsx scripts/duplicate-worker-profiles.ts abc-123-def-456 5 worker Worker@123456"
    );
    process.exit(1);
  }

  const options: DuplicateOptions = {
    sourceProfileId: args[0],
    count: parseInt(args[1], 10),
    emailPrefix: args[2] || "worker",
    password: args[3] || "Worker@123456",
  };

  if (isNaN(options.count) || options.count < 1) {
    console.error("Error: count must be a positive number");
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("Worker Profile Duplication Script");
  console.log("=".repeat(60));
  console.log(`Source Profile ID: ${options.sourceProfileId}`);
  console.log(`Count: ${options.count}`);
  console.log(`Email Prefix: ${options.emailPrefix}`);
  console.log("=".repeat(60));
  console.log();

  try {
    // 1. Lấy dữ liệu worker profile gốc
    console.log("Step 1: Fetching source worker profile...");
    const sourceData = await getFullWorkerProfile(options.sourceProfileId);
    console.log(`✓ Source profile found: ${sourceData.full_name}`);
    console.log(`  - Tags: ${sourceData.tags?.length || 0}`);
    console.log(
      `  - Availabilities: ${sourceData.availabilities?.length || 0}`
    );
    console.log(`  - Images: ${sourceData.images?.length || 0}`);
    console.log(`  - Services: ${sourceData.services?.length || 0}`);
    console.log();

    // 2. Tạo các worker profile mới
    console.log(`Step 2: Creating ${options.count} duplicate profiles...`);
    const createdProfiles: Array<{
      userId: string;
      profileId: string;
      email: string;
    }> = [];

    for (let i = 1; i <= options.count; i++) {
      const email = `${options.emailPrefix}${i}@example.com`;
      console.log(`  [${i}/${options.count}] Creating worker ${email}...`);

      try {
        // Tạo user
        const userId = await createWorkerUser(
          email,
          options.password,
          `${sourceData.full_name} (Copy ${i})`
        );

        // Nhân bản profile
        const profileId = await duplicateWorkerProfile(sourceData, userId, i);

        createdProfiles.push({ userId, profileId, email });
        console.log(`    ✓ Created profile: ${profileId}`);
      } catch (error: any) {
        console.error(`    ✗ Failed to create worker ${i}: ${error.message}`);
        // Tiếp tục với worker tiếp theo
        // Nếu email đã tồn tại, thử với email khác
        if (error.message.includes("already exists")) {
          console.log(`    → Trying alternative email format...`);
          const altEmail = `${
            options.emailPrefix
          }${i}_${Date.now()}@example.com`;
          try {
            const userId = await createWorkerUser(
              altEmail,
              options.password,
              `${sourceData.full_name} (Copy ${i})`
            );
            const profileId = await duplicateWorkerProfile(
              sourceData,
              userId,
              i
            );
            createdProfiles.push({ userId, profileId, email: altEmail });
            console.log(
              `    ✓ Created profile with alternative email: ${profileId}`
            );
          } catch (altError: any) {
            console.error(
              `    ✗ Alternative email also failed: ${altError.message}`
            );
          }
        }
      }
    }

    console.log();
    console.log("=".repeat(60));
    console.log("Duplication completed!");
    console.log("=".repeat(60));
    console.log(
      `Successfully created: ${createdProfiles.length}/${options.count} profiles`
    );
    console.log();

    if (createdProfiles.length > 0) {
      console.log("Created profiles:");
      createdProfiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. Email: ${profile.email}`);
        console.log(`     User ID: ${profile.userId}`);
        console.log(`     Profile ID: ${profile.profileId}`);
        console.log(`     Password: ${options.password}`);
        console.log();
      });
    }

    if (createdProfiles.length < options.count) {
      console.warn(
        `Warning: ${
          options.count - createdProfiles.length
        } profiles failed to create`
      );
    }
  } catch (error: any) {
    console.error("Fatal error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

