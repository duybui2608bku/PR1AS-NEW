import { NextRequest } from "next/server";
import { successResponse } from "@/lib/http/response";
import { withErrorHandling, ApiError, ErrorCode } from "@/lib/http/errors";
import { ERROR_MESSAGES, getErrorMessage } from "@/lib/constants/errors";
import {
  HttpStatus,
  IMAGE_MAX_SIZE,
  VALID_IMAGE_TYPES,
} from "@/lib/utils/enums";
import { requireAuth } from "@/lib/auth/middleware";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Authenticate user
  await requireAuth(request);

  // Get form data
  const formData = await request.formData();
  const file = formData.get("file") as File;
  // Note: folder parameter is accepted for backward compatibility but not used by third-party API

  if (!file) {
    throw new ApiError(
      getErrorMessage(ERROR_MESSAGES.NO_FILE_PROVIDED),
      HttpStatus.BAD_REQUEST,
      ErrorCode.NO_FILE_PROVIDED
    );
  }

  // Validate file type
  if (!VALID_IMAGE_TYPES.includes(file.type as any)) {
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

  // Prepare form data for third-party API
  const uploadFormData = new FormData();
  uploadFormData.append("images[]", file);
  uploadFormData.append("server", "server_1");

  // Upload to third-party API
  const uploadResponse = await fetch("https://cfig.ibytecdn.org/upload", {
    method: "POST",
    body: uploadFormData,
  });

  if (!uploadResponse.ok) {
    throw new ApiError(
      "Failed to upload image to third-party service",
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.UPLOAD_FAILED
    );
  }

  const uploadResult = await uploadResponse.json();

  // Validate response structure
  if (!uploadResult?.success || !Array.isArray(uploadResult.results)) {
    throw new ApiError(
      "Invalid response from upload service",
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.UPLOAD_FAILED
    );
  }

  const firstResult = uploadResult.results[0];

  if (!firstResult?.success || !firstResult?.url) {
    throw new ApiError(
      "Upload failed: no URL returned",
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.UPLOAD_FAILED
    );
  }

  // Return response in expected format
  return successResponse({
    path: firstResult.url, // Use URL as path for backward compatibility
    publicUrl: firstResult.url,
    fileName: firstResult.filename || file.name,
  });
});

// Delete image
// Note: Third-party API doesn't support deletion, so this endpoint returns success
// but doesn't actually delete the file from the third-party service
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

  // Third-party API doesn't support deletion
  // Return success for backward compatibility, but file remains on third-party server
  return successResponse(
    null,
    "Delete request acknowledged (third-party service doesn't support deletion)"
  );
});
