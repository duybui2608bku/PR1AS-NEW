/**
 * Image Upload Utilities
 */

import { getErrorMessage } from "./common";

export interface UploadResponse {
  success: boolean;
  data?: {
    path: string;
    publicUrl: string;
    fileName: string;
  };
  error?: string;
}

/**
 * Upload image to server
 * @param file - File object to upload
 * @param folder - Folder name (avatar, general, etc.)
 * @returns Upload response with public URL
 */
export async function uploadImage(
  file: File,
  // `folder` kept for backward‑compat, not used by third‑party API
  // so existing calls don't break.
  folder: string = "general"
): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    // Third‑party API expects `images[]` and a `server` name
    formData.append("images[]", file);
    formData.append("server", "server_1");

    const response = await fetch("https://cfig.ibytecdn.org/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok || !result?.success || !Array.isArray(result.results)) {
      return {
        success: false,
        error: result?.error || "Upload failed",
      };
    }

    const first = result.results[0];

    if (!first?.success || !first?.url) {
      return {
        success: false,
        error: "Upload failed",
      };
    }

    // Map third‑party response về format cũ cho FE
    return {
      success: true,
      data: {
        path: first.url, // không có khái niệm path, dùng luôn URL
        publicUrl: first.url,
        fileName: first.filename || "",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Upload failed"),
    };
  }
}

/**
 * Delete image from server
 * @param filePath - Path to the file in storage
 * @returns Success or error message
 */
export async function deleteImage(filePath: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(
      `/api/upload/image?path=${encodeURIComponent(filePath)}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Delete failed",
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Delete failed"),
    };
  }
}

/**
 * Validate image file
 * @param file - File to validate
 * @param errorMessages - Optional custom error messages for i18n
 * @returns Validation result
 */
export function validateImage(
  file: File,
  errorMessages?: {
    invalidType?: string;
    fileTooLarge?: string;
  }
): {
  valid: boolean;
  error?: string;
} {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error:
        errorMessages?.invalidType ||
        "Only JPEG, PNG, WebP, and GIF formats are supported.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: errorMessages?.fileTooLarge || "File size must not exceed 5MB.",
    };
  }

  return { valid: true };
}

/**
 * Create preview URL from file
 * @param file - File to create preview
 * @returns Preview URL
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke preview URL
 * @param url - Preview URL to revoke
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
