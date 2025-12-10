/**
 * Worker Profile Constants
 * Centralized constants for worker profile validation and constraints
 */

export const PROFILE_CONSTRAINTS = {
  // Age constraints
  MIN_AGE: 18,
  MAX_AGE: 100,

  // Text length constraints
  MAX_BIO_LENGTH: 1000,
  MAX_QUOTE_LENGTH: 200,
  MIN_FULL_NAME_LENGTH: 2,
  MAX_FULL_NAME_LENGTH: 100,

  // Physical constraints
  MIN_HEIGHT_CM: 100,
  MAX_HEIGHT_CM: 250,
  MIN_WEIGHT_KG: 30,
  MAX_WEIGHT_KG: 300,

  // Image constraints
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_GALLERY_IMAGES: 10,
  MIN_IMAGE_WIDTH: 200,
  MAX_IMAGE_WIDTH: 5000,
  MIN_IMAGE_HEIGHT: 200,
  MAX_IMAGE_HEIGHT: 5000,
  VALID_IMAGE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ] as const,

  // Service constraints
  MIN_SERVICES_REQUIRED: 1,
  MIN_PRICE_USD: 0,
  MAX_PRICE_USD: 10000,
  MAX_DISCOUNT_PERCENT: 100,

  // Tag constraints
  MAX_TAGS: 20,
  MIN_TAG_LENGTH: 1,
  MAX_TAG_LENGTH: 50,

  // Availability constraints
  MIN_AVAILABILITY_DAYS: 1,
  MAX_AVAILABILITY_DAYS: 7,

  // Custom availability constraints
  MIN_CUSTOM_AVAILABILITY_DAYS: 1,
  MAX_CUSTOM_AVAILABILITY_DAYS: 30,
} as const;

export const VALID_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const DAY_NAMES: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};
