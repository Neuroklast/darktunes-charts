import type { Tier } from '@/lib/types'

/** Billing cycle options for category subscriptions. */
export type BillingCycle = 'monthly' | 'yearly'

/**
 * Default yearly discount percentage (0–100).
 * Configurable per deployment; used when no override is provided.
 */
export const DEFAULT_YEARLY_DISCOUNT_PERCENT = 15

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
  /** Total cost in EUR cents for the selected billing cycle. */
  totalCents: number
  /** Human-readable EUR amount, e.g. "45.00". */
  totalEur: string
  /** Number of free categories (always 1). */
  freeCategories: number
  /** Number of paid additional categories. */
  paidCategories: number
  /** Price per additional category in EUR cents (per billing period). */
  pricePerCategoryEurCents: number
}

/** Extended result including yearly comparison data. */
export interface YearlyPricingComparison {
  /** Monthly billing breakdown. */
  monthly: TierPricingResult
  /** Yearly billing breakdown (12 months with discount applied). */
  yearly: TierPricingResult
  /** Discount percentage applied to the yearly cycle. */
  discountPercent: number
  /** Amount saved per year in EUR cents when choosing yearly over monthly. */
  yearlySavingsCents: number
  /** Human-readable savings amount, e.g. "54.00". */
  yearlySavingsEur: string
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

/**
 * Calculates the yearly price by applying a discount to 12× the monthly rate.
 *
 * The yearly total is: `monthlyTotal × 12 × (1 − discountPercent / 100)`,
 * rounded to the nearest cent. This avoids floating-point drift by operating
 * in integer cents until the final EUR formatting step.
 *
 * @param tier - The band's competition tier.
 * @param totalCategories - Total number of categories (≥ 1).
 * @param discountPercent - Yearly discount as a whole number (0–100). Defaults to {@link DEFAULT_YEARLY_DISCOUNT_PERCENT}.
 * @returns Yearly pricing breakdown in EUR cents.
 * @throws {RangeError} If `totalCategories` < 1 or `discountPercent` is outside 0–100.
 */
export function calculateYearlyTierPrice(
  tier: Tier,
  totalCategories: number,
  discountPercent: number = DEFAULT_YEARLY_DISCOUNT_PERCENT,
): TierPricingResult {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new RangeError(`discountPercent must be 0–100, got ${discountPercent}`)
  }

  const monthly = calculateTierPrice(tier, totalCategories)
  const annualBeforeDiscount = monthly.totalCents * 12
  const totalCents = Math.round(annualBeforeDiscount * (1 - discountPercent / 100))
  const pricePerCategoryEurCents = monthly.paidCategories > 0
    ? Math.round(totalCents / monthly.paidCategories)
    : 0

  return {
    totalCents,
    totalEur: (totalCents / 100).toFixed(2),
    freeCategories: monthly.freeCategories,
    paidCategories: monthly.paidCategories,
    pricePerCategoryEurCents,
  }
}

/**
 * Compares monthly vs yearly pricing for a given tier and category count.
 *
 * Returns both breakdowns plus the savings amount and discount percentage,
 * enabling the UI to display a "Save X%" badge and a side-by-side comparison.
 *
 * @param tier - The band's competition tier.
 * @param totalCategories - Total number of categories (≥ 1).
 * @param discountPercent - Yearly discount (0–100). Defaults to {@link DEFAULT_YEARLY_DISCOUNT_PERCENT}.
 * @returns A {@link YearlyPricingComparison} with monthly, yearly, and savings data.
 */
export function compareBillingCycles(
  tier: Tier,
  totalCategories: number,
  discountPercent: number = DEFAULT_YEARLY_DISCOUNT_PERCENT,
): YearlyPricingComparison {
  const monthly = calculateTierPrice(tier, totalCategories)
  const yearly = calculateYearlyTierPrice(tier, totalCategories, discountPercent)
  const annualFromMonthly = monthly.totalCents * 12
  const yearlySavingsCents = annualFromMonthly - yearly.totalCents

  return {
    monthly,
    yearly,
    discountPercent,
    yearlySavingsCents,
    yearlySavingsEur: (yearlySavingsCents / 100).toFixed(2),
  }
}
