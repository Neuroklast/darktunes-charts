/**
 * @module domain/adslots
 *
 * Domain types and pure logic for the Sponsored "Neu & Hot" weekly booking system.
 *
 * ## Week boundary definition
 * A "week" is defined as starting on **Monday 00:00:00 UTC** and ending on
 * **Sunday 23:59:59 UTC**. All `startDate` values for bookings must be aligned to
 * the Monday 00:00:00 UTC boundary of the desired week.
 *
 * ## Booking rules
 * - Minimum booking: 1 week (7 days).
 * - `endDate = startDate + 7 days × k` where k ≥ 1.
 * - `startDate` must be a Monday at exactly 00:00:00 UTC.
 *
 * These rules are enforced by `validateWeeklyBooking`, which is called in the
 * domain layer before any database write. This ensures consistency regardless
 * of which API channel initiated the booking.
 *
 * ## Booking flow
 * 1. Client calls POST /api/ad-slots/book → RESERVED status.
 * 2. Client is redirected to Stripe Checkout.
 * 3. Stripe webhook (checkout.session.completed) → ACTIVE status.
 * 4. GET /api/ad-slots/active → returns all ACTIVE bookings for public display.
 */

import { z } from 'zod'

// ─── Domain types ─────────────────────────────────────────────────────────────

export type AdSlotType = 'NEU_HOT' | 'GENRE_PAGE' | 'SIDEBAR'
export type AdBookingStatus = 'RESERVED' | 'PENDING_PAYMENT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface AdSlotRecord {
  id: string
  slotType: AdSlotType
  weekStart: Date
  isAvailable: boolean
  maxBookings: number
  priceEur: number
  createdAt: Date
}

export interface AdBookingRecord {
  id: string
  adSlotId: string
  bandId: string
  startDate: Date
  endDate: Date
  weekCount: number
  status: AdBookingStatus
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  assetUrl: string | null
  headline: string | null
  createdAt: Date
  updatedAt: Date
}

// ─── Validation schemas ───────────────────────────────────────────────────────

export const BookAdSlotSchema = z.object({
  adSlotId: z.string().uuid('Invalid ad slot ID'),
  bandId: z.string().uuid('Invalid band ID'),
  /** ISO 8601 date-time string — must be a Monday at 00:00:00 UTC. */
  startDate: z.string().datetime({ message: 'startDate must be ISO 8601' }),
  /** Number of weeks to book (minimum 1). */
  weekCount: z.number().int().min(1, 'Minimum booking is 1 week'),
  headline: z.string().max(100).optional(),
  assetUrl: z.string().url().optional(),
})

export type BookAdSlotPayload = z.infer<typeof BookAdSlotSchema>

// ─── Week boundary helpers ────────────────────────────────────────────────────

/** Day-of-week index for Monday in JavaScript Date (0 = Sunday). */
const MONDAY = 1

/**
 * Returns the Monday 00:00:00 UTC date for the ISO week containing `date`.
 *
 * @param date - Any Date object.
 * @returns    - A new Date set to Monday 00:00:00.000 UTC of the same week.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay()
  // Shift so Monday = 0, ..., Sunday = 6
  const distanceToMonday = (day - MONDAY + 7) % 7
  d.setUTCDate(d.getUTCDate() - distanceToMonday)
  return d
}

/**
 * Returns true if `date` is exactly aligned to a Monday 00:00:00 UTC boundary.
 *
 * @param date - The date to check.
 */
export function isWeekBoundary(date: Date): boolean {
  return (
    date.getUTCDay() === MONDAY &&
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  )
}

/** Milliseconds in one week. */
export const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

// ─── Booking validation ───────────────────────────────────────────────────────

export interface WeeklyBookingValidationResult {
  valid: boolean
  error?: string
  endDate?: Date
}

/**
 * Validates a weekly booking request and computes the end date.
 *
 * Rules (documented in ADR-004):
 * 1. `startDate` must be a Monday at 00:00:00 UTC.
 * 2. `weekCount` must be ≥ 1.
 * 3. `startDate` must not be in the past.
 * 4. `endDate` = startDate + 7 * weekCount days.
 *
 * @param startDate - Proposed booking start date.
 * @param weekCount - Number of weeks to book.
 * @param now       - Current time (injectable for testing; defaults to `new Date()`).
 */
export function validateWeeklyBooking(
  startDate: Date,
  weekCount: number,
  now: Date = new Date(),
): WeeklyBookingValidationResult {
  if (!isWeekBoundary(startDate)) {
    return {
      valid: false,
      error: 'startDate must be a Monday at 00:00:00 UTC (week boundary)',
    }
  }

  if (!Number.isInteger(weekCount) || weekCount < 1) {
    return {
      valid: false,
      error: 'weekCount must be a positive integer (minimum 1)',
    }
  }

  // Treat "in the past" as: startDate is before the start of the current week
  const currentWeekStart = getWeekStart(now)
  if (startDate < currentWeekStart) {
    return {
      valid: false,
      error: 'startDate must not be in the past (must be the current or a future week)',
    }
  }

  const endDate = new Date(startDate.getTime() + weekCount * MS_PER_WEEK)

  return { valid: true, endDate }
}
