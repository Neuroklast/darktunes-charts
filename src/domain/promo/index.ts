/**
 * @module domain/promo
 *
 * Domain types and pure logic for the Promo Pool feature.
 *
 * The Promo Pool allows bands and labels to submit releases into a DJ discovery
 * queue. DJs browse their inbox, mark tracks, and optionally leave feedback.
 *
 * **Important invariant:** Promo Pool submissions have NO automatic effect on
 * chart rankings. They only enable discoverability; any chart impact is indirect
 * (a DJ who discovers and enjoys a track may naturally vote for it in their ballot).
 *
 * Submission rules:
 * - Bands may submit their own releases.
 * - Labels may submit on behalf of any band in their roster (labelId must match band.labelId).
 * - Admin users may submit for any band.
 */

import { z } from 'zod'
import type { PrismaUserRole } from '@/domain/auth/profile'

// ─── Domain types ─────────────────────────────────────────────────────────────

export type PromoStatus = 'PENDING' | 'REVIEWED' | 'SELECTED' | 'REJECTED'
export type DJInboxStatus = 'UNREAD' | 'READ' | 'PLAYED' | 'PASSED'

export interface PromoSubmissionRecord {
  id: string
  submittedByUserId: string
  bandId: string
  releaseId: string | null
  message: string | null
  status: PromoStatus
  createdAt: Date
}

export interface DJInboxItemRecord {
  id: string
  promoSubmissionId: string
  djUserId: string
  status: DJInboxStatus
  feedbackMessage: string | null
  createdAt: Date
  updatedAt: Date
}

// ─── Validation schemas ───────────────────────────────────────────────────────

export const SubmitPromoSchema = z.object({
  bandId: z.string().uuid('Invalid band ID'),
  releaseId: z.string().uuid('Invalid release ID').optional(),
  message: z.string().max(500).optional(),
})

export type SubmitPromoPayload = z.infer<typeof SubmitPromoSchema>

export const DJFeedbackSchema = z.object({
  status: z.enum(['READ', 'PLAYED', 'PASSED']),
  feedbackMessage: z.string().max(500).optional(),
})

export type DJFeedbackPayload = z.infer<typeof DJFeedbackSchema>

// ─── Permission helpers ───────────────────────────────────────────────────────

/** Roles that are allowed to submit to the Promo Pool. */
export const PROMO_ALLOWED_ROLES: readonly PrismaUserRole[] = ['BAND', 'LABEL', 'ADMIN']

/**
 * Returns whether a user may submit a promo on behalf of a given band.
 *
 * Rules:
 * - ADMIN: always allowed.
 * - BAND: only for their own band (userId must equal band.ownerId).
 * - LABEL: only for bands in their roster (band.labelId must match the user's label).
 *
 * This is a pure function; the caller is responsible for fetching the necessary
 * context (band owner, label membership) from the database.
 *
 * @param role       - The submitting user's Prisma role.
 * @param userId     - The submitting user's ID.
 * @param bandOwnerId - The band's owner user ID.
 * @param bandLabelId - The label ID associated with the band (may be null).
 * @param userLabelIds - IDs of all labels the user is a member of.
 */
export function canSubmitPromo(
  role: PrismaUserRole,
  userId: string,
  bandOwnerId: string,
  bandLabelId: string | null,
  userLabelIds: string[],
): boolean {
  if (role === 'ADMIN') return true
  if (role === 'BAND') return userId === bandOwnerId
  if (role === 'LABEL') {
    if (!bandLabelId) return false
    return userLabelIds.includes(bandLabelId)
  }
  return false
}
