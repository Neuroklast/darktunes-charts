/**
 * @module infrastructure/security
 *
 * Barrel export for security infrastructure (RBAC, rate limiting, etc.).
 */
export { withAuth } from './rbac'
export type { AuthenticatedUser, AuthenticatedHandler } from './rbac'
