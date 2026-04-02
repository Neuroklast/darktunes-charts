/**
 * @module domain/ads
 *
 * Sponsored Placement / Ad Booking — self-serve booking system for darkTunes.
 *
 * Supports booking of sponsored display slots (home hero, sidebar, genre banner,
 * "Neu & Hot" list). Bookings go through a Stripe checkout flow and are
 * activated on webhook confirmation.
 *
 * **Architecture boundary (ADR-018):**
 * - Ad bookings have NO influence on chart rankings.
 * - All sponsored placements must be labeled "Sponsored" in the UI.
 * - The booking engine never imports from `src/domain/charts/`.
 * - Sponsored slots appear on separate UI surfaces — never inside ranked chart lists.
 *
 * Double-booking prevention is enforced by `checkSlotAvailability()`, which
 * counts active/paid bookings per slot type within the requested date range
 * and compares against `AdSlot.maxConcurrent`.
 */

import { z } from 'zod'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Available slot types for sponsored placements. */
export type AdSlotType =
  | 'HOME_HERO'
  | 'HOME_SIDEBAR'
  | 'GENRE_BANNER'
  | 'NEW_AND_HOT_LIST'

/** Lifecycle status of an ad booking. */
export type AdBookingStatus =
  | 'RESERVED'
  | 'PAID'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELED'

/**
 * A sponsored placement booking.
 *
 * @remarks
 * Either `bandId` or `labelId` must be present.
 * `creative` holds display metadata (headline, imageUrl, ctaUrl).
 * `stripeCheckoutSessionId` is set when checkout is initiated;
 * status moves to PAID/ACTIVE on webhook confirmation.
 */
export interface AdBooking {
  id: string
  slotType: AdSlotType
  bandId?: string
  labelId?: string
  startDate: string
  endDate: string
  status: AdBookingStatus
  creative: AdCreative
  stripeCheckoutSessionId?: string
  createdAt: string
  updatedAt: string
}

/** Creative content for a sponsored placement. */
export interface AdCreative {
  /** Display headline (max 80 chars). */
  headline: string
  /** Optional image URL (CDN). */
  imageUrl?: string
  /** Click-through URL. */
  ctaUrl: string
  /** Optional secondary tagline. */
  tagline?: string
}

/** Slot configuration with availability info. */
export interface AdSlotAvailability {
  slotType: AdSlotType
  maxConcurrent: number
  /** Number of available slots for the queried date range. */
  availableCount: number
  /** Pricing in EUR cents per day. */
  pricePerDayEurCents: number
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

/** Base price per slot type per day in EUR cents. */
export const SLOT_PRICES_EUR_CENTS: Record<AdSlotType, number> = {
  HOME_HERO:        4900,  // €49/day
  HOME_SIDEBAR:     1900,  // €19/day
  GENRE_BANNER:     2900,  // €29/day
  NEW_AND_HOT_LIST: 1500,  // €15/day
}

/** Default max concurrent bookings per slot type. */
export const DEFAULT_MAX_CONCURRENT: Record<AdSlotType, number> = {
  HOME_HERO:        1,
  HOME_SIDEBAR:     3,
  GENRE_BANNER:     5,
  NEW_AND_HOT_LIST: 10,
}

// ─── Validation schemas ───────────────────────────────────────────────────────

/** Maximum number of days for a single booking. */
export const MAX_BOOKING_DAYS = 30

/** Minimum number of days for a single booking. */
export const MIN_BOOKING_DAYS = 1

/** Zod schema for validating a new ad booking request. */
export const AdBookingSchema = z.object({
  slotType: z.enum(['HOME_HERO', 'HOME_SIDEBAR', 'GENRE_BANNER', 'NEW_AND_HOT_LIST']),
  bandId: z.string().uuid().optional(),
  labelId: z.string().uuid().optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  creative: z.object({
    headline: z.string().min(1).max(80),
    imageUrl: z.string().url().optional(),
    ctaUrl: z.string().url(),
    tagline: z.string().max(120).optional(),
  }),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
}).refine(
  data => Boolean(data.bandId ?? data.labelId),
  { message: 'Either bandId or labelId must be provided' },
)

// ─── Business rules ───────────────────────────────────────────────────────────

/**
 * Validates an ad booking request.
 *
 * @param data - Raw request body.
 * @returns Parsed booking data.
 * @throws Error if validation fails.
 */
export function validateAdBooking(data: unknown): z.infer<typeof AdBookingSchema> {
  const result = AdBookingSchema.safeParse(data)
  if (!result.success) {
    throw new Error(
      `Invalid ad booking: ${result.error.issues.map(i => i.message).join(', ')}`,
    )
  }
  return result.data
}

/**
 * Calculates the booking duration in calendar days (inclusive on both ends).
 *
 * Both `startDate` and `endDate` are inclusive. A single-day booking
 * (e.g., '2026-06-01' to '2026-06-01') has a duration of 1 day.
 *
 * @param startDate - ISO 8601 date string (start, inclusive).
 * @param endDate - ISO 8601 date string (end, inclusive).
 * @returns Number of days (minimum 1).
 * @throws RangeError if end is before start or duration exceeds MAX_BOOKING_DAYS.
 */
export function calculateBookingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffMs = end.getTime() - start.getTime()

  if (diffMs < 0) {
    throw new RangeError('endDate must be on or after startDate')
  }

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1

  if (days < MIN_BOOKING_DAYS) {
    throw new RangeError(`Minimum booking duration is ${MIN_BOOKING_DAYS} day`)
  }

  if (days > MAX_BOOKING_DAYS) {
    throw new RangeError(
      `Maximum booking duration is ${MAX_BOOKING_DAYS} days (requested: ${days})`,
    )
  }

  return days
}

/**
 * Calculates the total booking cost in EUR cents.
 *
 * @param slotType - The slot type being booked.
 * @param days - Duration in days.
 * @returns Total cost in EUR cents.
 */
export function calculateBookingCost(slotType: AdSlotType, days: number): number {
  return SLOT_PRICES_EUR_CENTS[slotType] * days
}

/**
 * Checks whether a slot has availability for the requested date range.
 *
 * This is the core double-booking prevention function.
 * It compares the count of active/paid bookings that overlap the requested
 * range against the slot's `maxConcurrent` limit.
 *
 * @param existingBookings - Active or paid bookings for the same slot type.
 * @param maxConcurrent - Maximum concurrent bookings allowed for the slot.
 * @param requestedStart - Requested start date string.
 * @param requestedEnd - Requested end date string.
 * @returns True if a new booking can be created without exceeding `maxConcurrent`.
 */
export function checkSlotAvailability(
  existingBookings: Array<{ startDate: string; endDate: string; status: AdBookingStatus }>,
  maxConcurrent: number,
  requestedStart: string,
  requestedEnd: string,
): boolean {
  const start = new Date(requestedStart)
  const end = new Date(requestedEnd)

  const overlappingCount = existingBookings.filter(booking => {
    if (booking.status === 'CANCELED' || booking.status === 'EXPIRED') return false
    const bookingStart = new Date(booking.startDate)
    const bookingEnd = new Date(booking.endDate)
    // Overlap: not (end < bookingStart or start > bookingEnd)
    return !(end < bookingStart || start > bookingEnd)
  }).length

  return overlappingCount < maxConcurrent
}

/**
 * Determines the peak concurrent bookings count within a date range.
 * Used for availability calendar display.
 *
 * @param existingBookings - Active/paid bookings for the slot type.
 * @param maxConcurrent - Max concurrent limit for the slot.
 * @param requestedStart - Range start.
 * @param requestedEnd - Range end.
 * @returns Available slot count (0 means fully booked).
 */
export function getAvailableSlotCount(
  existingBookings: Array<{ startDate: string; endDate: string; status: AdBookingStatus }>,
  maxConcurrent: number,
  requestedStart: string,
  requestedEnd: string,
): number {
  const start = new Date(requestedStart)
  const end = new Date(requestedEnd)

  const overlapping = existingBookings.filter(booking => {
    if (booking.status === 'CANCELED' || booking.status === 'EXPIRED') return false
    const bookingStart = new Date(booking.startDate)
    const bookingEnd = new Date(booking.endDate)
    return !(end < bookingStart || start > bookingEnd)
  })

  return Math.max(0, maxConcurrent - overlapping.length)
}
