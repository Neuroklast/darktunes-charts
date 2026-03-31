import type { Band, Tier } from '@/lib/types'
import { TIER_PRICING_EUR } from '@/domain/tiers'
import { MAX_CATEGORIES_PER_BAND } from '@/domain/categories'

// Re-export getTierFromListeners from the canonical source for backward compatibility.
export { getTierFromListeners } from '@/domain/tiers'

/** Breakdown of the cost for a single category submission. */
export interface CategoryCostItem {
  category: string
  price: number
  isFree: boolean
}

/** Aggregated cost result for all categories a band wishes to enter. */
export interface SubmissionCostResult {
  totalCost: number
  breakdown: CategoryCostItem[]
}

/**
 * Returns the EUR price per additional chart category for a given tier.
 *
 * The first category is always free for all tiers (freemium model).
 * Progressive pricing enables cross-subsidization: Macro band fees (€150/category)
 * fund infrastructure that allows Micro bands to participate for only €5/category.
 *
 * **Critical constraint**: Financial contribution has ZERO influence on ranking scores.
 * Payment only unlocks participation in additional categories.
 *
 * @param tier - The band's competition tier.
 * @returns EUR price for each additional category beyond the first free one.
 */
export function calculateCategoryPrice(tier: Tier): number {
  return TIER_PRICING_EUR[tier]
}

/**
 * Calculates the total submission cost for a band entering multiple chart categories.
 *
 * The first selected category is always free regardless of tier. Each subsequent
 * category is billed at the tier-specific monthly rate. The breakdown array can be
 * shown in the band dashboard's CategoryPricing component for full transparency.
 *
 * Enforces the category cap (MAX_CATEGORIES_PER_BAND = 5). Selections exceeding the
 * cap are silently truncated to the allowed maximum to avoid runtime errors; callers
 * should validate the selection with `validateCategorySelection` before calling this.
 *
 * @param band - The band submitting entries (must have a valid `tier` field).
 * @param selectedCategories - Ordered list of category IDs the band wishes to enter.
 *   The first element is treated as the free category.
 * @returns Total cost in EUR and a per-category breakdown for transparent billing.
 */
export function calculateSubmissionCost(band: Band, selectedCategories: string[]): SubmissionCostResult {
  if (selectedCategories.length === 0) {
    return { totalCost: 0, breakdown: [] }
  }

  // Enforce anti-pay2win cap — truncate to at most MAX_CATEGORIES_PER_BAND entries.
  const capped = selectedCategories.slice(0, MAX_CATEGORIES_PER_BAND)

  const pricePerCategory = calculateCategoryPrice(band.tier)
  const breakdown: CategoryCostItem[] = capped.map((category, idx) => ({
    category,
    price: idx === 0 ? 0 : pricePerCategory,
    isFree: idx === 0,
  }))

  const totalCost = breakdown.reduce((sum, item) => sum + item.price, 0)
  return { totalCost, breakdown }
}
