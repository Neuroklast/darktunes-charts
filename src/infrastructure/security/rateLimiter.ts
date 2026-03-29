/**
 * @module infrastructure/security/rateLimiter
 *
 * Sliding window rate limiter for Next.js API routes.
 *
 * Provides in-memory rate limiting with configurable windows and maximum
 * request counts. Designed to work in serverless environments with an
 * in-memory store (suitable for single-instance deployments or development).
 *
 * For multi-instance production deployments (e.g. Vercel), replace the
 * in-memory store with a Redis/Vercel KV adapter.
 *
 * @example
 * ```typescript
 * const voteLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 })
 *
 * export const POST = withRateLimit(voteLimiter, async (req) => {
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */

import { NextResponse, type NextRequest } from 'next/server'

/** Configuration for a rate limiter instance. */
export interface RateLimitConfig {
  /** Time window in milliseconds. */
  windowMs: number
  /** Maximum number of requests allowed within the window. */
  maxRequests: number
}

/** A single entry tracking request timestamps for a key. */
interface RateLimitEntry {
  timestamps: number[]
}

/** In-memory rate limit store. Keys are user IDs or IP addresses. */
const store = new Map<string, RateLimitEntry>()

/**
 * Interval (in ms) for cleaning up expired entries from the store.
 * Runs every 60 seconds to prevent unbounded memory growth.
 */
const CLEANUP_INTERVAL_MS = 60_000

let cleanupTimer: ReturnType<typeof setInterval> | null = null

/**
 * Starts the periodic cleanup if not already running.
 * Removes entries whose timestamps are all older than the largest
 * configured window.
 */
function ensureCleanup(windowMs: number): void {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)
      if (entry.timestamps.length === 0) {
        store.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS)
  // Allow the Node.js process to exit even if the timer is active
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref()
  }
}

/**
 * Checks whether a key has exceeded the rate limit.
 *
 * Uses a sliding window algorithm: only timestamps within the current
 * window are counted. Returns the number of remaining requests and the
 * time until the window resets.
 *
 * @param key    - Unique identifier (user ID, IP address, etc.)
 * @param config - Rate limit configuration
 * @returns      - Whether the request is allowed and metadata for headers
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetMs: number } {
  ensureCleanup(config.windowMs)

  const now = Date.now()
  const entry = store.get(key) ?? { timestamps: [] }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs)

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    const resetMs = oldestInWindow + config.windowMs - now
    store.set(key, entry)
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(resetMs, 0),
    }
  }

  entry.timestamps.push(now)
  store.set(key, entry)

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetMs: config.windowMs,
  }
}

/**
 * Creates a rate limiter with the given configuration.
 * Returns a function that can be used to check rate limits for a key.
 *
 * @param config - Rate limit configuration
 * @returns      - A check function bound to the configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  return {
    config,
    check: (key: string) => checkRateLimit(key, config),
  }
}

/**
 * Extracts a rate-limit key from the request.
 * Prefers the authenticated user ID; falls back to IP address.
 *
 * @param request - The incoming Next.js request
 * @param userId  - Optional authenticated user ID
 * @returns       - A string key for rate limiting
 */
export function getRateLimitKey(request: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown'
  return `ip:${ip}`
}

/**
 * Wraps a route handler with rate limiting.
 *
 * @param limiter  - A rate limiter created with `createRateLimiter`
 * @param handler  - The route handler to protect
 * @param keyFn    - Optional function to extract the rate limit key from the request
 * @returns        - A Next.js route handler with rate limiting applied
 */
export function withRateLimit(
  limiter: ReturnType<typeof createRateLimiter>,
  handler: (request: NextRequest) => Promise<NextResponse>,
  keyFn?: (request: NextRequest) => string,
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    const key = keyFn ? keyFn(request) : getRateLimitKey(request)
    const result = limiter.check(key)

    if (!result.allowed) {
      const retryAfterSeconds = Math.ceil(result.resetMs / 1000)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(limiter.config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(retryAfterSeconds),
          },
        },
      )
    }

    const response = await handler(request)

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', String(limiter.config.maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))

    return response
  }
}

/**
 * Resets the rate limit store. Intended for testing only.
 */
export function _resetRateLimitStore(): void {
  store.clear()
}
