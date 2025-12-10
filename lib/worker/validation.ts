/**
 * Worker Profile Validation Utilities
 * Client-side and server-side validation functions for worker profile data
 */

import { PROFILE_CONSTRAINTS } from "./constants";
import { WorkerProfileStep1Request } from "./types";
import { DayOfWeek, AvailabilityType, HttpStatus } from "@/lib/utils/enums";
import { ApiError, ErrorCode } from "@/lib/http/errors";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate full name
 */
export function validateFullName(fullName: string | undefined): string | null {
  if (!fullName || fullName.trim().length === 0) {
    return "Full name is required";
  }

  if (fullName.trim().length < PROFILE_CONSTRAINTS.MIN_FULL_NAME_LENGTH) {
    return `Full name must be at least ${PROFILE_CONSTRAINTS.MIN_FULL_NAME_LENGTH} characters`;
  }

  if (fullName.length > PROFILE_CONSTRAINTS.MAX_FULL_NAME_LENGTH) {
    return `Full name must not exceed ${PROFILE_CONSTRAINTS.MAX_FULL_NAME_LENGTH} characters`;
  }

  // Check for valid characters (allow letters, spaces, hyphens, apostrophes)
  const validNamePattern = /^[a-zA-ZÀ-ỹ\s'-]+$/;
  if (!validNamePattern.test(fullName.trim())) {
    return "Full name contains invalid characters";
  }

  return null;
}

/**
 * Validate age
 */
export function validateAge(age: number | undefined): string | null {
  if (age === undefined || age === null) {
    return "Age is required";
  }

  if (!Number.isInteger(age)) {
    return "Age must be a whole number";
  }

  if (age < PROFILE_CONSTRAINTS.MIN_AGE) {
    return `Age must be at least ${PROFILE_CONSTRAINTS.MIN_AGE}`;
  }

  if (age > PROFILE_CONSTRAINTS.MAX_AGE) {
    return `Age must not exceed ${PROFILE_CONSTRAINTS.MAX_AGE}`;
  }

  return null;
}

/**
 * Validate bio
 */
export function validateBio(bio: string | undefined): string | null {
  if (!bio) return null; // Bio is optional

  if (bio.length > PROFILE_CONSTRAINTS.MAX_BIO_LENGTH) {
    return `Bio must not exceed ${PROFILE_CONSTRAINTS.MAX_BIO_LENGTH} characters`;
  }

  return null;
}

/**
 * Validate personal quote
 */
export function validatePersonalQuote(
  quote: string | undefined
): string | null {
  if (!quote) return null; // Quote is optional

  if (quote.length > PROFILE_CONSTRAINTS.MAX_QUOTE_LENGTH) {
    return `Personal quote must not exceed ${PROFILE_CONSTRAINTS.MAX_QUOTE_LENGTH} characters`;
  }

  return null;
}

/**
 * Validate height
 */
export function validateHeight(height: number | undefined): string | null {
  if (height === undefined || height === null) return null; // Optional

  if (
    height < PROFILE_CONSTRAINTS.MIN_HEIGHT_CM ||
    height > PROFILE_CONSTRAINTS.MAX_HEIGHT_CM
  ) {
    return `Height must be between ${PROFILE_CONSTRAINTS.MIN_HEIGHT_CM} and ${PROFILE_CONSTRAINTS.MAX_HEIGHT_CM} cm`;
  }

  return null;
}

/**
 * Validate weight
 */
export function validateWeight(weight: number | undefined): string | null {
  if (weight === undefined || weight === null) return null; // Optional

  if (
    weight < PROFILE_CONSTRAINTS.MIN_WEIGHT_KG ||
    weight > PROFILE_CONSTRAINTS.MAX_WEIGHT_KG
  ) {
    return `Weight must be between ${PROFILE_CONSTRAINTS.MIN_WEIGHT_KG} and ${PROFILE_CONSTRAINTS.MAX_WEIGHT_KG} kg`;
  }

  return null;
}

/**
 * Validate tags
 */
export function validateTags(tags: string[]): string | null {
  if (tags.length > PROFILE_CONSTRAINTS.MAX_TAGS) {
    return `Maximum ${PROFILE_CONSTRAINTS.MAX_TAGS} tags allowed`;
  }

  // Check for duplicates
  const uniqueTags = new Set(tags.map((t) => t.toLowerCase().trim()));
  if (uniqueTags.size !== tags.length) {
    return "Duplicate tags are not allowed";
  }

  // Validate each tag
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (trimmed.length < PROFILE_CONSTRAINTS.MIN_TAG_LENGTH) {
      return "Tags cannot be empty";
    }
    if (trimmed.length > PROFILE_CONSTRAINTS.MAX_TAG_LENGTH) {
      return `Each tag must not exceed ${PROFILE_CONSTRAINTS.MAX_TAG_LENGTH} characters`;
    }
  }

  return null;
}

/**
 * Validate availabilities
 */
export function validateAvailabilities(
  availabilities: Array<{
    day_of_week: DayOfWeek;
    availability_type: AvailabilityType;
    start_time?: string;
    end_time?: string;
  }>
): string | null {
  if (!availabilities || availabilities.length === 0) {
    return "At least one availability day is required";
  }

  if (availabilities.length > PROFILE_CONSTRAINTS.MAX_AVAILABILITY_DAYS) {
    return `Maximum ${PROFILE_CONSTRAINTS.MAX_AVAILABILITY_DAYS} availability days allowed`;
  }

  // Check for duplicate days
  const days = availabilities.map((a) => a.day_of_week);
  const uniqueDays = new Set(days);
  if (uniqueDays.size !== days.length) {
    return "Duplicate availability days are not allowed";
  }

  // Validate time ranges if provided
  for (const availability of availabilities) {
    if (
      availability.availability_type === AvailabilityType.CUSTOM &&
      availability.start_time &&
      availability.end_time
    ) {
      if (availability.start_time >= availability.end_time) {
        return "Start time must be before end time";
      }
    }
  }

  return null;
}

/**
 * Validate Step 1 profile data
 */
export function validateStep1Profile(
  data: WorkerProfileStep1Request
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate required fields
  const fullNameError = validateFullName(data.full_name);
  if (fullNameError) {
    errors.push({ field: "full_name", message: fullNameError });
  }

  const ageError = validateAge(data.age);
  if (ageError) {
    errors.push({ field: "age", message: ageError });
  }

  // Validate optional fields
  const bioError = validateBio(data.bio);
  if (bioError) {
    errors.push({ field: "bio", message: bioError });
  }

  const quoteError = validatePersonalQuote(data.personal_quote);
  if (quoteError) {
    errors.push({ field: "personal_quote", message: quoteError });
  }

  const heightError = validateHeight(data.height_cm);
  if (heightError) {
    errors.push({ field: "height_cm", message: heightError });
  }

  const weightError = validateWeight(data.weight_kg);
  if (weightError) {
    errors.push({ field: "weight_kg", message: weightError });
  }

  // Validate tags
  if (data.tags && data.tags.length > 0) {
    const tagsArray = data.tags.map((t) => t.tag_key);
    const tagsError = validateTags(tagsArray);
    if (tagsError) {
      errors.push({ field: "tags", message: tagsError });
    }
  }

  // Validate availabilities
  if (data.availabilities && data.availabilities.length > 0) {
    const availError = validateAvailabilities(data.availabilities);
    if (availError) {
      errors.push({ field: "availabilities", message: availError });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate service pricing
 */
export function validateServicePricing(
  priceUsd: number | undefined,
  dailyDiscount?: number,
  weeklyDiscount?: number,
  monthlyDiscount?: number
): string | null {
  if (priceUsd === undefined || priceUsd === null) {
    return "Price is required";
  }

  if (priceUsd < PROFILE_CONSTRAINTS.MIN_PRICE_USD) {
    return `Price must be at least $${PROFILE_CONSTRAINTS.MIN_PRICE_USD}`;
  }

  if (priceUsd > PROFILE_CONSTRAINTS.MAX_PRICE_USD) {
    return `Price must not exceed $${PROFILE_CONSTRAINTS.MAX_PRICE_USD}`;
  }

  // Validate discounts
  const discounts = [dailyDiscount, weeklyDiscount, monthlyDiscount].filter(
    (d) => d !== undefined && d !== null
  ) as number[];

  for (const discount of discounts) {
    if (discount < 0 || discount > PROFILE_CONSTRAINTS.MAX_DISCOUNT_PERCENT) {
      return `Discount must be between 0 and ${PROFILE_CONSTRAINTS.MAX_DISCOUNT_PERCENT}%`;
    }
  }

  return null;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): string | null {
  // Check file type
  const validTypes = PROFILE_CONSTRAINTS.VALID_IMAGE_TYPES as readonly string[];
  if (!validTypes.includes(file.type)) {
    return "Only JPEG, PNG, WebP, and GIF formats are supported";
  }

  // Check file size
  if (file.size > PROFILE_CONSTRAINTS.MAX_IMAGE_SIZE) {
    const maxSizeMB = PROFILE_CONSTRAINTS.MAX_IMAGE_SIZE / (1024 * 1024);
    return `File size must not exceed ${maxSizeMB}MB`;
  }

  return null;
}

/**
 * Validate gallery image count
 */
export function validateGalleryImageCount(count: number): string | null {
  if (count > PROFILE_CONSTRAINTS.MAX_GALLERY_IMAGES) {
    return `Maximum ${PROFILE_CONSTRAINTS.MAX_GALLERY_IMAGES} gallery images allowed`;
  }
  return null;
}

/**
 * Validate Step 1 profile data and throw ApiError if validation fails
 * Server-side validation function for API routes
 */
export function validateWorkerProfileStep1OrThrow(
  data: WorkerProfileStep1Request
): void {
  const result = validateStep1Profile(data);

  if (!result.valid) {
    // Format error messages for API response
    const errorMessages = result.errors.map(
      (error) => `${error.field}: ${error.message}`
    );
    const errorMessage = errorMessages.join("; ");

    throw new ApiError(
      errorMessage,
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
  }
}
