import type { Tier } from '@/lib/types'

/**
 * Tier pricing constants (EUR per month per additional category).
 * First category is always free (freemium model, Spec §3.1).
 *
 * CRITICAL: These prices govern access/participation only.
 * They have ZERO influence on chart ranking scores (Spec §3.2).
 */
export const TIER_MONTHLY_PRICE_EUR: Record<Tier, number> = {
  Micro: 5,
  Emerging: 15,
  Established: 35,
  International: 75,
  Macro: 150,
}

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

  const pricePerCategoryEur = TIER_MONTHLY_PRICE_EUR[tier]
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
