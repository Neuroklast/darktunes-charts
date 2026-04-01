/**
 * @module infrastructure/rateLimiter
 *
 * Simple in-memory rate limiter for API route protection.
 *
 * Limits requests per user/IP within a sliding window.
 * In production with multiple Vercel instances, a Redis-backed limiter
 * (e.g. @upstash/ratelimit) would be preferred, but this in-memory
 * implementation is sufficient for a single-instance deployment.
 *
 * Usage:
 *   const result = rateLimiter.check(userId, 'votes', 60, 60_000)
 *   if (!result.allowed) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

class RateLimiter {
  private readonly store = new Map<string, RateLimitEntry>()

  /**
   * Checks and increments the rate limit counter for a key.
   *
   * @param identifier  - User ID or IP address.
   * @param namespace   - Logical namespace (e.g. 'votes', 'ballots').
   * @param limit       - Maximum requests allowed within the window.
   * @param windowMs    - Window size in milliseconds.
   * @returns `allowed` flag and `remaining` request count.
   */
  check(
    identifier: string,
    namespace: string,
    limit: number,
    windowMs: number,
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const key = `${namespace}:${identifier}`
    const now = Date.now()

    const existing = this.store.get(key)

    if (!existing || now >= existing.resetAt) {
      // Start new window
      this.store.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
    }

    if (existing.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: existing.resetAt }
    }

    existing.count += 1
    return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt }
  }

  /** Removes expired entries to prevent memory leaks. Call periodically in production. */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(key)
      }
    }
  }
}

/** Singleton rate limiter instance (shared across all API routes in this process). */
export const rateLimiter = new RateLimiter()

/** Maximum voting API requests per user per minute. */
export const VOTE_RATE_LIMIT = 60
/** Rate limit window duration: 1 minute. */
export const VOTE_RATE_WINDOW_MS = 60_000
