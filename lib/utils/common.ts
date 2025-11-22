/**
 * Common Utility Functions
 * Shared utility functions used across the application
 */

import { UserRole } from "./enums";

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Get error message from unknown error type
 * @param error - The error to extract message from
 * @param defaultMessage - Optional default message if error cannot be extracted
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage: string = "An unknown error occurred"
): string {
  if (isError(error)) {
    return error.message || defaultMessage;
  }
  if (typeof error === "string") {
    return error || defaultMessage;
  }
  return defaultMessage;
}

// =============================================================================
// ROLE HELPERS
// =============================================================================

/**
 * Get redirect URL based on user role
 */
export function getRedirectByRole(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "/admin/dashboard";
    case UserRole.CLIENT:
      return "/client/dashboard";
    case UserRole.WORKER:
      return "/worker/dashboard";
    default:
      return "/";
  }
}

/**
 * Check if user has required role
 */
export function hasRole(
  userRole: UserRole,
  requiredRole: UserRole | UserRole[]
): boolean {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

/**
 * Add minutes to current date
 */
export function addMinutes(minutes: number): Date {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
}

/**
 * Add days to current date
 */
export function addDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj < new Date();
}

/**
 * Format date to ISO string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

// =============================================================================
// NUMBER UTILITIES
// =============================================================================

/**
 * Round to 2 decimal places
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Convert USD to VND
 */
export function usdToVnd(usd: number, rate: number = 24000): number {
  return Math.round(usd * rate);
}

/**
 * Check if number is positive
 */
export function isPositive(value: number): boolean {
  return value > 0;
}

/**
 * Check if number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// =============================================================================
// STRING UTILITIES
// =============================================================================

/**
 * Generate unique transfer content code
 * Format: ND + timestamp + random
 */
export function generateTransferContent(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ND${timestamp}${random}`;
}

/**
 * Check if string is empty or whitespace
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Check if array is empty
 */
export function isArrayEmpty<T>(arr: T[] | null | undefined): boolean {
  return !arr || arr.length === 0;
}

/**
 * Get first element or null
 */
export function firstOrNull<T>(arr: T[] | null | undefined): T | null {
  return arr && arr.length > 0 ? arr[0] : null;
}

// =============================================================================
// OBJECT UTILITIES
// =============================================================================

/**
 * Check if object is empty
 */
export function isObjectEmpty(
  obj: Record<string, unknown> | null | undefined
): boolean {
  return !obj || Object.keys(obj).length === 0;
}

/**
 * Safe get nested property
 */
export function getNestedProperty<T>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue: T
): T {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }
  }

  return current as T;
}
