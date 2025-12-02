import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, getTokenFromRequest } from "@/lib/auth/helpers";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import { HttpStatus, IMAGE_MAX_SIZE, VALID_IMAGE_TYPES } from "@/lib/utils/enums";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  const { user } = await requireAuth(request);

  // Get form data
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const folder = (formData.get("folder") as string) || "general"; // avatar, general, etc.

  if (!file) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.NO_FILE_PROVIDED),
      HttpStatus.BAD_REQUEST,
      ErrorCode.NO_FILE_PROVIDED
    );
  }

  // Validate file type
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.INVALID_FILE_TYPE),
      HttpStatus.BAD_REQUEST,
      ErrorCode.INVALID_FILE_TYPE
    );
  }

  // Validate file size (max 5MB)
  if (file.size > IMAGE_MAX_SIZE) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.FILE_TOO_LARGE),
      HttpStatus.BAD_REQUEST,
      ErrorCode.FILE_TOO_LARGE
    );
  }

  // Create unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split(".").pop();
  const fileName = `${folder}/${user.id}_${timestamp}_${randomString}.${extension}`;

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Get token for authenticated upload
  const token = getTokenFromRequest(request);

  if (!token) {
    throw new ApiError(
      "Authentication token required",
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED
    );
  }

  // Create authenticated client with token
  const supabase = createClient(token);
  const { data, error } = await supabase.storage
    .from("image")
    .upload(fileName, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new ApiError(
      `Failed to upload image: ${error.message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.UPLOAD_FAILED
    );
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("image").getPublicUrl(fileName);

  return successResponse({
    path: data.path,
    publicUrl: publicUrl,
    fileName: fileName,
  });
});

// Delete image
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  await requireAuth(request);

  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    throw new ApiError(
      "No file path provided",
      HttpStatus.BAD_REQUEST,
      ErrorCode.MISSING_REQUIRED_FIELDS
    );
  }

  // Get token for authenticated delete
  const token = getTokenFromRequest(request);

  if (!token) {
    throw new ApiError(
      "Authentication token required",
      HttpStatus.UNAUTHORIZED,
      ErrorCode.UNAUTHORIZED
    );
  }

  // Create authenticated client with token
  const supabase = createClient(token);
  const { error } = await supabase.storage.from("image").remove([filePath]);

  if (error) {
    throw new ApiError(
      `Failed to delete image: ${error.message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.DELETE_FAILED
    );
  }

  return successResponse(null, "Image deleted successfully");
});
