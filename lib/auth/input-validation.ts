/**
 * Input validation and sanitization utilities
 * Prevents XSS, injection attacks, and validates input formats
 */

/**
 * Email validation regex
 * RFC 5322 compliant email regex (simplified version)
 */
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns true if email format is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  // Check length (max 254 characters per RFC 5321)
  if (email.length > 254) {
    return false;
  }

  // Check format
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Sanitize string input to prevent XSS attacks
 * Removes HTML tags and dangerous characters
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "");

  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize email input
 * Validates format and sanitizes
 * @param email - Email to validate and sanitize
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== "string") {
    return null;
  }

  // Trim and lowercase
  const trimmed = email.trim().toLowerCase();

  // Validate format
  if (!isValidEmail(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize name/fullName input
 * Allows letters, spaces, hyphens, apostrophes (for names like O'Brien, Mary-Jane)
 * @param name - Name to sanitize
 * @param maxLength - Maximum length (default 100)
 * @returns Sanitized name or null if invalid
 */
export function sanitizeName(name: string, maxLength: number = 100): string | null {
  if (!name || typeof name !== "string") {
    return null;
  }

  // Remove HTML tags and dangerous characters
  let sanitized = sanitizeString(name);

  // Allow only letters, spaces, hyphens, apostrophes, and common name characters
  sanitized = sanitized.replace(/[^a-zA-Z\s\-'àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/g, "");

  // Remove multiple spaces
  sanitized = sanitized.replace(/\s+/g, " ");

  // Trim
  sanitized = sanitized.trim();

  // Check length
  if (sanitized.length === 0 || sanitized.length > maxLength) {
    return null;
  }

  return sanitized;
}

/**
 * Validate and sanitize role input
 * @param role - Role to validate
 * @param allowedRoles - Array of allowed roles
 * @returns Validated role or null if invalid
 */
export function sanitizeRole(
  role: string,
  allowedRoles: string[] = ["client", "worker", "admin"]
): string | null {
  if (!role || typeof role !== "string") {
    return null;
  }

  const trimmed = role.trim().toLowerCase();

  if (!allowedRoles.includes(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize general text input
 * @param text - Text to sanitize
 * @param maxLength - Maximum length
 * @returns Sanitized text
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  let sanitized = sanitizeString(text);

  // Trim to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

