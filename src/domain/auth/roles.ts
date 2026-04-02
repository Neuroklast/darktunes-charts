/**
 * @module domain/auth/roles
 *
 * User roles and permission definitions for the darkTunes Charts platform.
 * Defines what each role is permitted to do within the system.
 */

/** Platform user roles with distinct voting and management permissions. */
export type UserRole = 'fan' | 'dj' | 'band' | 'curator' | 'label'

/** Actions available within the platform. */
export type PlatformAction =
  | 'vote:fan'
  | 'vote:dj'
  | 'submit:release'
  | 'curate:compilation'
  | 'nominate:band'
  | 'manage:users'
  | 'view:analytics'
  | 'review:dj-application'
  | 'manage:roster'
  | 'submit:promo'
  | 'book:ad-slot'

/** Mapping of roles to their permitted actions. */
export const ROLE_PERMISSIONS: Record<UserRole, readonly PlatformAction[]> = {
  fan: ['vote:fan', 'nominate:band'],
  dj: ['vote:dj', 'nominate:band', 'view:analytics'],
  band: ['submit:release', 'view:analytics', 'submit:promo'],
  curator: [
    'vote:dj',
    'curate:compilation',
    'nominate:band',
    'view:analytics',
    'review:dj-application',
  ],
  label: [
    'manage:roster',
    'view:analytics',
    'submit:promo',
    'book:ad-slot',
  ],
}

/**
 * Checks whether a given role has permission to perform an action.
 *
 * @param role   - The user's platform role.
 * @param action - The action to check.
 * @returns `true` if the role is permitted to perform the action.
 */
export function hasPermission(role: UserRole, action: PlatformAction): boolean {
  return ROLE_PERMISSIONS[role].includes(action)
}
