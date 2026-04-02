/**
 * @module domain/labels
 *
 * Domain types and pure logic for the Label organisation entity.
 *
 * A Label is an organisational entity (record label) that manages a roster of bands.
 * It is distinct from the `label` user role: a user with role `LABEL` must be a
 * member of a Label organisation with `ADMIN` rights to perform management actions.
 *
 * Why two concepts?
 * - A single person (user) can belong to multiple labels (e.g. as a consultant).
 * - A label can have multiple admin users.
 * - Keeping organisation and role separate follows established RBAC patterns.
 */

import { z } from 'zod'

// ─── Domain types ─────────────────────────────────────────────────────────────

/** Membership role within a Label organisation. */
export type LabelMemberRole = 'ADMIN' | 'MEMBER'

/** A Label organisation record. */
export interface LabelRecord {
  id: string
  name: string
  slug: string
  websiteUrl: string | null
  contactEmail: string | null
  createdAt: Date
  updatedAt: Date
}

/** A membership record linking a user to a label. */
export interface LabelMemberRecord {
  id: string
  labelId: string
  userId: string
  role: LabelMemberRole
  createdAt: Date
}

// ─── Validation schemas ───────────────────────────────────────────────────────

/**
 * Validates the payload for creating a new Label.
 *
 * - `name`: human-readable label name (max 120 chars)
 * - `slug`: URL-safe identifier, lowercase alphanumeric + hyphens
 * - `websiteUrl`: optional website URL
 * - `contactEmail`: optional contact e-mail
 */
export const CreateLabelSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  websiteUrl: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
})

export type CreateLabelPayload = z.infer<typeof CreateLabelSchema>

/** Payload for adding a band to a label's roster. */
export const AddBandToRosterSchema = z.object({
  bandId: z.string().uuid('Invalid band ID'),
})

export type AddBandToRosterPayload = z.infer<typeof AddBandToRosterSchema>

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Returns whether a user is an admin of a given label based on their memberships.
 *
 * @param userId      - The user's ID to check.
 * @param labelId     - The label organisation ID.
 * @param memberships - The list of label memberships for the user.
 */
export function isLabelAdmin(
  userId: string,
  labelId: string,
  memberships: LabelMemberRecord[],
): boolean {
  return memberships.some(
    (m) => m.userId === userId && m.labelId === labelId && m.role === 'ADMIN',
  )
}
