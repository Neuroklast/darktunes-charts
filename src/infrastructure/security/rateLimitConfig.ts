/**
 * @module infrastructure/security/rateLimitConfig
 *
 * Centralised rate limit configuration for all API endpoints.
 *
 * Keeping limits in a single file makes them easy to audit and adjust
 * without hunting through individual route handlers.
 */

import type { RateLimitConfig } from './rateLimiter'

/**
 * Rate limit for voting endpoints (fan, DJ, peer).
 * 10 requests per minute per user — voting is infrequent by design.
 */
export const VOTE_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 10,
}

/**
 * Rate limit for public read endpoints (charts, tracks, bands).
 * 60 requests per minute per IP — generous for normal browsing.
 */
export const PUBLIC_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 60,
}

/**
 * Rate limit for authenticated write endpoints (events, awards, mandates).
 * 20 requests per minute per user.
 */
export const WRITE_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 20,
}

/**
 * Rate limit for sensitive admin endpoints (bot-detection, export).
 * 30 requests per minute per user.
 */
export const ADMIN_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 30,
}
