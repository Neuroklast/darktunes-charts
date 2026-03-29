/**
 * @module infrastructure/security
 *
 * Security infrastructure barrel export.
 * Re-exports RBAC, rate limiting, and CORS utilities.
 */

export { withAuth, type AuthenticatedUser } from './rbac'
export {
  createRateLimiter,
  withRateLimit,
  getRateLimitKey,
  checkRateLimit,
  type RateLimitConfig,
} from './rateLimiter'
export {
  VOTE_RATE_LIMIT,
  PUBLIC_RATE_LIMIT,
  WRITE_RATE_LIMIT,
  ADMIN_RATE_LIMIT,
} from './rateLimitConfig'
export { withCors, handleCorsOptions } from './cors'
