/**
 * @module domain/payment/tierPricing
 *
 * Payment-specific tier pricing utilities (Spec §3.1).
 *
 * Base tier prices are imported from the canonical `@/domain/tiers` module
 * (single source of truth). This module adds the Stripe-oriented breakdown
 * with EUR-cent amounts used by the payment infrastructure layer.
 *
 * CRITICAL: These prices govern access/participation only.
 * They have ZERO influence on chart ranking scores (Spec §3.2).
 */

import type { Tier } from '@/lib/types'
import { TIER_PRICING_EUR } from '@/domain/tiers'

/**
 * Re-export the canonical pricing constant under its legacy name so that
 * existing consumers (tests, Stripe adapter) continue to work.
 */
export const TIER_MONTHLY_PRICE_EUR: Readonly<Record<Tier, number>> = TIER_PRICING_EUR

export interface TierPricingResult {
  /** Total monthly cost in EUR cents (to avoid floating-point errors). */
  totalCents: number
  /** Human-readable EUR amount, e.g. "45.00". */
  totalEur: string
  /** Number of free categories (always 1). */
  freeCategories: number
  /** Number of paid additional categories. */
  paidCategories: number
  /** Price per additional category in EUR cents. */
  pricePerCategoryEurCents: number
}

/**
 * Calculates the total monthly price for a band entering multiple chart categories.
 *
 * Business rules (Spec §3.1):
 * - The first category is always free regardless of tier.
 * - Each additional category is billed at the tier-specific rate.
 * - Financial contribution has ZERO effect on chart ranking scores (Spec §3.2).
 *
 * All prices are returned in integer EUR cents to avoid floating-point issues.
 *
 * @param tier - The band's competition tier (derived from Spotify monthly listeners).
 * @param totalCategories - Total number of categories the band wishes to enter (≥ 1).
 * @returns Pricing breakdown with totals in EUR cents and a formatted EUR string.
 * @throws {RangeError} If `totalCategories` is less than 1.
 */
export function calculateTierPrice(tier: Tier, totalCategories: number): TierPricingResult {
  if (totalCategories < 1) {
    throw new RangeError(`totalCategories must be ≥ 1, got ${totalCategories}`)
  }

  const pricePerCategoryEur = TIER_PRICING_EUR[tier]
  const pricePerCategoryEurCents = Math.round(pricePerCategoryEur * 100)
  const paidCategories = totalCategories - 1
  const totalCents = paidCategories * pricePerCategoryEurCents

  return {
    totalCents,
    totalEur: (totalCents / 100).toFixed(2),
    freeCategories: 1,
    paidCategories,
    pricePerCategoryEurCents,
  }
}
