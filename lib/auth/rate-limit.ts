/**
 * Rate Limiting Utility
 *
 * Implements rate limiting to prevent brute force attacks and spam.
 * Uses in-memory store (can be upgraded to Redis for production)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  lockedUntil?: number; // For account lockout
}

// In-memory store (consider Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (
      entry.resetTime < now &&
      (!entry.lockedUntil || entry.lockedUntil < now)
    ) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxAttempts: number; // Maximum attempts allowed
  windowMs: number; // Time window in milliseconds
  lockoutDurationMs?: number; // Lockout duration after max attempts (optional)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  lockedUntil?: number;
  retryAfter?: number; // Seconds until retry is allowed
}

/**
 * Check rate limit for a given identifier (IP, email, etc.)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Check if account is locked
  if (entry?.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      lockedUntil: entry.lockedUntil,
      retryAfter: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  // If no entry or window expired, create new entry
  if (!entry || entry.resetTime < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Increment count
  entry.count += 1;

  // Check if limit exceeded
  if (entry.count > config.maxAttempts) {
    // Apply lockout if configured
    if (config.lockoutDurationMs) {
      entry.lockedUntil = now + config.lockoutDurationMs;
    }

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      lockedUntil: entry.lockedUntil,
      retryAfter: config.lockoutDurationMs
        ? Math.ceil(config.lockoutDurationMs / 1000)
        : Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Reset rate limit for an identifier (e.g., after successful login)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Try various headers (for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback (won't work in serverless, but good for development)
  return "unknown";
}

/**
 * Rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // Login: 5 attempts per 15 minutes, lockout for 30 minutes after 5 failures
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    lockoutDurationMs: 30 * 60 * 1000, // 30 minutes lockout
  } as RateLimitConfig,

  // Signup: 3 attempts per hour per IP, 1 attempt per hour per email
  SIGNUP_IP: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  } as RateLimitConfig,

  SIGNUP_EMAIL: {
    maxAttempts: 1,
    windowMs: 60 * 60 * 1000, // 1 hour
  } as RateLimitConfig,

  // Forgot password: 3 attempts per hour per IP/email
  FORGOT_PASSWORD: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  } as RateLimitConfig,

  // Reset password: 5 attempts per hour per IP
  RESET_PASSWORD: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  } as RateLimitConfig,
};
