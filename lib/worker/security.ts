/**
 * Worker Profile Security Utilities
 * Input sanitization and security checks for worker profile data
 */

import {
  sanitizeString,
  sanitizeName,
  sanitizeText,
} from "@/lib/auth/input-validation";
import { WorkerProfileStep1Request } from "./types";
import { PROFILE_CONSTRAINTS } from "./constants";

/**
 * Sanitize worker profile Step 1 data
 */
export function sanitizeWorkerProfileStep1(
  data: WorkerProfileStep1Request
): WorkerProfileStep1Request {
  return {
    full_name:
      sanitizeName(data.full_name, PROFILE_CONSTRAINTS.MAX_FULL_NAME_LENGTH) ||
      "",
    nickname: data.nickname
      ? sanitizeName(data.nickname, PROFILE_CONSTRAINTS.MAX_FULL_NAME_LENGTH) ||
        undefined
      : undefined,
    age: data.age,
    height_cm: data.height_cm,
    weight_kg: data.weight_kg,
    zodiac_sign: data.zodiac_sign
      ? sanitizeString(data.zodiac_sign)
      : undefined,
    lifestyle: data.lifestyle ? sanitizeString(data.lifestyle) : undefined,
    personal_quote: data.personal_quote
      ? sanitizeText(data.personal_quote, PROFILE_CONSTRAINTS.MAX_QUOTE_LENGTH)
      : undefined,
    bio: data.bio
      ? sanitizeText(data.bio, PROFILE_CONSTRAINTS.MAX_BIO_LENGTH)
      : undefined,
    tags: data.tags?.map((tag) => ({
      tag_key: sanitizeString(tag.tag_key).substring(
        0,
        PROFILE_CONSTRAINTS.MAX_TAG_LENGTH
      ),
      tag_value: sanitizeString(tag.tag_value).substring(
        0,
        PROFILE_CONSTRAINTS.MAX_TAG_LENGTH
      ),
      tag_type: tag.tag_type,
    })),
    availabilities: data.availabilities?.map((avail) => ({
      day_of_week: avail.day_of_week,
      availability_type: avail.availability_type,
      start_time: avail.start_time
        ? sanitizeString(avail.start_time)
        : undefined,
      end_time: avail.end_time ? sanitizeString(avail.end_time) : undefined,
      notes: avail.notes ? sanitizeText(avail.notes, 500) : undefined,
    })),
  };
}

/**
 * Validate and sanitize image URL
 * Prevents XSS through image URLs
 */
export function sanitizeImageUrl(url: string): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  // Remove dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];
  const lowerUrl = url.toLowerCase().trim();

  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return null;
    }
  }

  // Only allow http/https URLs
  if (!lowerUrl.startsWith("http://") && !lowerUrl.startsWith("https://")) {
    return null;
  }

  // Validate URL format
  try {
    const urlObj = new URL(url);
    // Only allow http/https protocols
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return null;
    }
    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Validate file name to prevent path traversal attacks
 */
export function sanitizeFileName(fileName: string): string | null {
  if (!fileName || typeof fileName !== "string") {
    return null;
  }

  // Remove path traversal attempts
  const sanitized = fileName
    .replace(/\.\./g, "") // Remove ..
    .replace(/\//g, "") // Remove /
    .replace(/\\/g, "") // Remove \
    .replace(/[<>:"|?*]/g, ""); // Remove Windows reserved characters

  // Check for empty result
  if (sanitized.length === 0) {
    return null;
  }

  // Limit length
  if (sanitized.length > 255) {
    return sanitized.substring(0, 255);
  }

  return sanitized;
}
