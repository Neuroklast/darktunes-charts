/**
 * Coupon validation domain logic.
 *
 * Pure functions for validating discount coupons and applying discounts
 * to category pricing. This module contains NO database or Stripe dependencies —
 * it operates solely on typed data structures passed in by the caller.
 *
 * Financial discounts have ZERO effect on chart ranking scores (Spec §3.2).
 */

import type { TierPricingResult } from './tierPricing'

/** Shape of a coupon record as returned from the database. */
export interface CouponRecord {
  readonly id: string
  readonly code: string
  readonly discountPercent: number
  readonly maxUses: number
  readonly currentUses: number
  readonly validUntil: Date
  readonly partnerId: string
  readonly partnerName: string
  readonly isActive: boolean
}

/** All possible reasons a coupon validation can fail. */
export type CouponInvalidReason =
  | 'NOT_FOUND'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'MAX_USES_REACHED'
  | 'INVALID_DISCOUNT'

/** Result of a coupon validation attempt. */
export type CouponValidationResult =
  | {
      readonly valid: true
      readonly discountPercent: number
      readonly partnerName: string
      readonly couponId: string
    }
  | {
      readonly valid: false
      readonly reason: CouponInvalidReason
    }

/** Result of applying a coupon discount to tier pricing. */
export interface DiscountedPricingResult {
  /** Original pricing before discount. */
  readonly originalTotalCents: number
  /** Discount percentage applied (0–100). */
  readonly discountPercent: number
  /** Amount discounted in EUR cents. */
  readonly discountCents: number
  /** Final price after discount in EUR cents. */
  readonly finalTotalCents: number
  /** Human-readable final EUR amount, e.g. "22.50". */
  readonly finalTotalEur: string
}

/**
 * Validates a coupon record against business rules.
 *
 * A coupon is valid when ALL of the following conditions hold:
 * 1. The record exists (caller passes `null` when not found).
 * 2. The coupon is marked as active.
 * 3. The current date is before `validUntil`.
 * 4. `currentUses` is below `maxUses`.
 * 5. `discountPercent` is in the range 1–100.
 *
 * @param coupon - The coupon record from the database, or `null` if not found.
 * @param now    - Current timestamp for expiry checks (injectable for testing).
 * @returns Validation result with discount details or a failure reason.
 */
export function validateCoupon(
  coupon: CouponRecord | null,
  now: Date = new Date()
): CouponValidationResult {
  if (!coupon) {
    return { valid: false, reason: 'NOT_FOUND' }
  }

  if (!coupon.isActive) {
    return { valid: false, reason: 'INACTIVE' }
  }

  if (now >= coupon.validUntil) {
    return { valid: false, reason: 'EXPIRED' }
  }

  if (coupon.currentUses >= coupon.maxUses) {
    return { valid: false, reason: 'MAX_USES_REACHED' }
  }

  if (coupon.discountPercent < 1 || coupon.discountPercent > 100) {
    return { valid: false, reason: 'INVALID_DISCOUNT' }
  }

  return {
    valid: true,
    discountPercent: coupon.discountPercent,
    partnerName: coupon.partnerName,
    couponId: coupon.id,
  }
}

/**
 * Applies a coupon discount to tier pricing.
 *
 * The discount is applied to the total price in EUR cents.  The result is
 * rounded down (floor) to the nearest cent so that the platform never
 * under-charges.
 *
 * @param pricing         - The original tier pricing result from `calculateTierPrice`.
 * @param discountPercent - Discount percentage (1–100).
 * @returns Pricing breakdown with discount applied.
 * @throws {RangeError} If discountPercent is outside the 1–100 range.
 */
export function applyDiscount(
  pricing: TierPricingResult,
  discountPercent: number
): DiscountedPricingResult {
  if (discountPercent < 1 || discountPercent > 100) {
    throw new RangeError(`discountPercent must be between 1 and 100, got ${discountPercent}`)
  }

  const discountCents = Math.floor(pricing.totalCents * (discountPercent / 100))
  const finalTotalCents = pricing.totalCents - discountCents

  return {
    originalTotalCents: pricing.totalCents,
    discountPercent,
    discountCents,
    finalTotalCents,
    finalTotalEur: (finalTotalCents / 100).toFixed(2),
  }
}
