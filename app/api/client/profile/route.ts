import { NextRequest } from "next/server";
import { requireClient } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus } from "@/lib/utils/enums";

// GET: Lấy thông tin thiết lập cơ bản của client
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Require client authentication
  const { user, supabase } = await requireClient(request);

  // Lấy profile từ bảng user_profiles
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select(
      `
      id,
      email,
      full_name,
      role,
      status,
      avatar_url,
      gender,
      date_of_birth,
      country,
      language,
      address,
      created_at,
      updated_at
    `
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.PROFILE_NOT_FOUND),
      HttpStatus.NOT_FOUND,
      ErrorCode.PROFILE_NOT_FOUND
    );
  }

  return successResponse({ profile });
});

// PUT: Cập nhật thông tin thiết lập cơ bản của client
export const PUT = withErrorHandling(async (request: NextRequest) => {
  // Require client authentication
  const { user, supabase } = await requireClient(request);

  const body = await request.json();
  const {
    full_name,
    avatar_url,
    gender,
    date_of_birth,
    country,
    language,
    address,
  } = body ?? {};

  // Chuẩn hóa dữ liệu cập nhật
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof full_name === "string") updates.full_name = full_name;
  if (typeof avatar_url === "string" || avatar_url === null) {
    updates.avatar_url = avatar_url;
  }
  if (typeof gender === "string" || gender === null) {
    updates.gender = gender;
  }
  if (typeof date_of_birth === "string" || date_of_birth === null) {
    updates.date_of_birth = date_of_birth;
  }
  if (typeof country === "string" || country === null) {
    updates.country = country;
  }
  if (typeof language === "string" || language === null) {
    updates.language = language;
  }
  if (typeof address === "string" || address === null) {
    updates.address = address;
  }

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", user.id);

  if (updateError) {
    throw new ApiError(
      "Failed to update profile",
      HttpStatus.BAD_REQUEST,
      ErrorCode.OPERATION_FAILED
    );
  }

  return successResponse(null, "Profile updated successfully");
});


