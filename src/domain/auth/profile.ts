/**
 * @module domain/auth/profile
 *
 * Domain types and pure logic for the DarkTunes user profile system.
 *
 * A "profile" is the platform-side record that extends a Supabase Auth user
 * with a role, display name and credits. It is created either during
 * email/password registration (with the chosen role in user_metadata) or
 * during the onboarding flow that runs after a first-time OAuth login.
 */

import { z } from 'zod'
import type { UserRole } from '@/lib/types'

// ─── Allowed roles for self-registration ─────────────────────────────────────

/** Roles a user can choose during onboarding or email signup. */
export const REGISTERABLE_ROLES = ['fan', 'band', 'dj', 'editor'] as const
export type RegisterableRole = typeof REGISTERABLE_ROLES[number]

// ─── Zod schema ──────────────────────────────────────────────────────────────

/**
 * Validated shape for creating or updating a user profile.
 * Used both by the onboarding page and the profile API route.
 */
export const CreateProfileSchema = z.object({
  /** The user's preferred display name (min 2 chars, no trailing spaces). */
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein.').max(80).trim(),
  /** Platform role — determines voting rights and dashboard access. */
  role: z.enum(REGISTERABLE_ROLES, {
    errorMap: () => ({ message: 'Bitte wähle eine gültige Rolle.' }),
  }),
  /**
   * Optional band/project name — required when role is "band".
   * Stored separately in the bands table, not in the users table.
   */
  bandName: z.string().min(1).max(120).trim().optional(),
})

export type CreateProfilePayload = z.infer<typeof CreateProfileSchema>

// ─── Platform profile shape ───────────────────────────────────────────────────

/** The platform profile as returned by GET /api/profile. */
export interface UserProfile {
  id: string
  role: UserRole
  name: string
  email: string
  credits: number
  avatarUrl: string | null
  bandId: string | null
  isDJVerified: boolean
  createdAt: string
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Maps a user role to the appropriate dashboard path.
 * Used after login and onboarding to redirect to the right section.
 *
 * @param role - The authenticated user's platform role
 * @returns    - Absolute path for the role's primary dashboard
 */
export function dashboardPathForRole(role: UserRole): string {
  const ROLE_DASHBOARD: Record<UserRole, string> = {
    fan:    '/dashboard/fan',
    band:   '/dashboard/band',
    dj:     '/dashboard/dj',
    editor: '/dashboard/fan',   // editors use fan dashboard + editorial tools
    admin:  '/admin',
    ar:     '/dashboard/label',
    label:  '/dashboard/label',
  }
  return ROLE_DASHBOARD[role] ?? '/'
}

/**
 * Determines whether a Supabase `user_metadata` object contains a valid
 * pre-selected role (set during email/password registration).
 *
 * When present, the auth callback can create the profile automatically
 * instead of sending the user through onboarding.
 *
 * @param metadata - Raw user_metadata from the Supabase Auth user object
 * @returns        - The pre-selected role, or null if absent / invalid
 */
export function extractRoleFromMetadata(
  metadata: Record<string, unknown>,
): RegisterableRole | null {
  const role = metadata['darktunes_role']
  if (typeof role !== 'string') return null
  if (REGISTERABLE_ROLES.includes(role as RegisterableRole)) {
    return role as RegisterableRole
  }
  return null
}

/**
 * Returns human-readable labels and descriptions for each registerable role.
 * Used in the onboarding UI and the login modal role picker.
 */
export function getRoleOptions(): Array<{
  role: RegisterableRole
  label: string
  description: string
  requiresKyc: boolean
}> {
  return [
    {
      role: 'fan',
      label: 'Fan',
      description: '100 Voice Credits pro Monat · Quadratic Voting',
      requiresKyc: false,
    },
    {
      role: 'band',
      label: 'Band / Künstler',
      description: '1 kostenlose Kategorie pro Monat · Peer-Review Voting',
      requiresKyc: false,
    },
    {
      role: 'dj',
      label: 'DJ / Kurator',
      description: 'Ranked-Choice Schulze Ballot · KYC-Verifikation erforderlich',
      requiresKyc: true,
    },
    {
      role: 'editor',
      label: 'Redakteur',
      description: 'Redaktionelle Rechte · Spotlights & Nominierungen',
      requiresKyc: false,
    },
  ]
}
