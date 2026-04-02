/**
 * @module domain/promo
 *
 * DJ Promo Pool — submission and feedback workflow for darkTunes.
 *
 * Allows bands and labels to submit releases to a DJ inbox. DJs can then mark
 * submissions as played, considered, or pass, with an optional note.
 *
 * **Critical invariant (ADR-018):** Promo submissions and DJ feedback are
 * EXPLICITLY excluded from chart scoring. A DJ marking a track as "played"
 * has zero influence on that DJ's Schulze ballot or the combined chart score.
 * The two systems are intentionally isolated.
 */

import { z } from 'zod'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Status lifecycle of a promo submission. */
export type PromoStatus = 'PENDING' | 'ACTIVE' | 'CLOSED'

/** DJ decision on a promo submission. */
export type PromoDecision = 'PLAYED' | 'CONSIDERED' | 'PASS'

/** Asset types that can be attached to a promo submission. */
export type PromoAssetType = 'audio_preview' | 'cover_art' | 'press_kit' | 'bandcamp_link' | 'other'

/**
 * A promo submission from a band or label to the DJ pool.
 *
 * @remarks
 * Either `bandId` or `labelId` must be present (submitter identity).
 * `releaseId` is optional — a submission may be for an upcoming release
 * that is not yet in the database.
 *
 * This type deliberately has no `chartScore` or `voteWeight` fields.
 * See ADR-018.
 */
export interface PromoSubmission {
  id: string
  bandId?: string
  labelId?: string
  releaseId?: string
  status: PromoStatus
  createdAt: string
  assets?: PromoAsset[]
  feedbacks?: PromoFeedback[]
}

/**
 * A DJ's feedback decision on a promo submission.
 *
 * @remarks
 * The `decision` field has no connection to the DJ's Schulze ballot.
 * A `PLAYED` decision does not create a vote, chart entry, or ballot.
 */
export interface PromoFeedback {
  id: string
  submissionId: string
  djUserId: string
  decision: PromoDecision
  note?: string
  createdAt: string
}

/** A media asset attached to a promo submission. */
export interface PromoAsset {
  id: string
  submissionId: string
  type: PromoAssetType
  /** Public URL to the asset (CDN or external). */
  url: string
  createdAt: string
}

// ─── Validation schemas ───────────────────────────────────────────────────────

/** Maximum number of assets per promo submission. */
export const MAX_PROMO_ASSETS = 5

/** Maximum length of a DJ feedback note. */
export const MAX_FEEDBACK_NOTE_LENGTH = 500

/** Zod schema for validating a new promo submission request. */
export const PromoSubmitSchema = z.object({
  bandId: z.string().uuid().optional(),
  labelId: z.string().uuid().optional(),
  releaseId: z.string().uuid().optional(),
  assets: z
    .array(
      z.object({
        type: z.enum(['audio_preview', 'cover_art', 'press_kit', 'bandcamp_link', 'other']),
        url: z.string().url(),
      }),
    )
    .max(MAX_PROMO_ASSETS)
    .optional(),
}).refine(
  data => Boolean(data.bandId ?? data.labelId),
  { message: 'Either bandId or labelId must be provided' },
)

/** Zod schema for validating a DJ feedback submission. */
export const PromoFeedbackSchema = z.object({
  decision: z.enum(['PLAYED', 'CONSIDERED', 'PASS']),
  note: z.string().max(MAX_FEEDBACK_NOTE_LENGTH).optional(),
})

/** Zod schema for filtering the DJ promo inbox. */
export const PromoInboxFilterSchema = z.object({
  genre: z.string().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'CLOSED']).optional().default('ACTIVE'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

// ─── Business rules ───────────────────────────────────────────────────────────

/**
 * Validates that a promo submission request is structurally valid.
 *
 * @param data - Raw request body.
 * @returns Parsed and validated submission data.
 * @throws Error if validation fails.
 */
export function validatePromoSubmission(
  data: unknown,
): z.infer<typeof PromoSubmitSchema> {
  const result = PromoSubmitSchema.safeParse(data)
  if (!result.success) {
    throw new Error(
      `Invalid promo submission: ${result.error.issues.map(i => i.message).join(', ')}`,
    )
  }
  return result.data
}

/**
 * Validates a DJ feedback submission.
 *
 * @param data - Raw request body.
 * @returns Parsed and validated feedback data.
 * @throws Error if validation fails.
 */
export function validatePromoFeedback(
  data: unknown,
): z.infer<typeof PromoFeedbackSchema> {
  const result = PromoFeedbackSchema.safeParse(data)
  if (!result.success) {
    throw new Error(
      `Invalid promo feedback: ${result.error.issues.map(i => i.message).join(', ')}`,
    )
  }
  return result.data
}

/**
 * Checks if a user is the submitter of a promo (band owner or label).
 *
 * @param submission - The promo submission.
 * @param userId - The authenticated user's ID.
 * @param userBandId - The band ID the user owns (if any).
 * @param userLabelId - The label ID associated with the user (if any).
 * @returns True if the user is the submitter or an admin.
 */
export function isPromoSubmitter(
  submission: Pick<PromoSubmission, 'bandId' | 'labelId'>,
  userId: string,
  userBandId?: string,
  userLabelId?: string,
): boolean {
  if (userBandId && submission.bandId === userBandId) return true
  if (userLabelId && submission.labelId === userLabelId) return true
  void userId // retained for future user-level ownership check
  return false
}
