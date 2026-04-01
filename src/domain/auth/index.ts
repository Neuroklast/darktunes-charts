/**
 * @module domain/auth
 *
 * Barrel export for the auth domain module.
 * Includes user roles, permissions, DJ verification logic, and profile management.
 */

export type { UserRole, PlatformAction } from './roles'
export { ROLE_PERMISSIONS, hasPermission } from './roles'

export type { DJEvent, DJVerificationRequest, DJVerificationStatus } from './verification'
export { validateDJApplication } from './verification'

// Re-export profile module for backward compatibility
export {
  CreateProfileSchema,
  REGISTERABLE_ROLES,
  dashboardPathForRole,
  extractRoleFromMetadata,
  getRoleOptions,
  userRoleToPrismaRole,
  prismaRoleToUserRole,
} from './profile'
export type {
  PrismaUserRole,
  RegisterableRole,
  CreateProfilePayload,
  UserProfile,
} from './profile'
