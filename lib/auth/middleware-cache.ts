/**
 * Middleware caching utilities
 * Caches user profile data to reduce database calls
 */

interface CachedProfile {
  role: string;
  status: string;
  cachedAt: number;
}

// In-memory cache for user profiles
// Key: userId, Value: CachedProfile
const profileCache = new Map<string, CachedProfile>();

// Cache TTL: 5 minutes (300000 ms)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Get cached profile for user
 * @param userId - User ID
 * @returns Cached profile or null if not found or expired
 */
export function getCachedProfile(userId: string): CachedProfile | null {
  const cached = profileCache.get(userId);

  if (!cached) {
    return null;
  }

  // Check if cache is expired
  const now = Date.now();
  if (now - cached.cachedAt > CACHE_TTL) {
    profileCache.delete(userId);
    return null;
  }

  return cached;
}

/**
 * Cache profile for user
 * @param userId - User ID
 * @param role - User role
 * @param status - User status
 */
export function setCachedProfile(
  userId: string,
  role: string,
  status: string
): void {
  profileCache.set(userId, {
    role,
    status,
    cachedAt: Date.now(),
  });
}

/**
 * Invalidate cached profile for user
 * @param userId - User ID
 */
export function invalidateCachedProfile(userId: string): void {
  profileCache.delete(userId);
}

/**
 * Clear all cached profiles
 * Useful for testing or when user data changes significantly
 */
export function clearAllCachedProfiles(): void {
  profileCache.clear();
}

/**
 * Get cache statistics
 * @returns Cache stats
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ userId: string; cachedAt: number }>;
} {
  const entries = Array.from(profileCache.entries()).map(([userId, cached]) => ({
    userId,
    cachedAt: cached.cachedAt,
  }));

  return {
    size: profileCache.size,
    entries,
  };
}

