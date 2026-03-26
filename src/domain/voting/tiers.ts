import type { Band, Tier } from '@/lib/types'

/** Spotify monthly listener thresholds that define each competition tier. */
const TIER_THRESHOLDS: Record<Tier, number> = {
  Micro: 10_000,
  Emerging: 50_000,
  Established: 250_000,
  International: 1_000_000,
  Macro: Infinity,
}

/** Monthly EUR price per additional chart category for each tier (beyond the first free entry). */
const TIER_PRICING: Record<Tier, number> = {
  Micro: 5,
  Emerging: 15,
  Established: 35,
  International: 75,
  Macro: 150,
}

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
 * Derives the competition tier for a band from its Spotify monthly listener count.
 *
 * Five-tier structure (Darktunes platform specification, Section 5):
 * - **Micro** (Underground): 0 – 10,000
 * - **Emerging** (Small): 10,001 – 50,000
 * - **Established** (Medium): 50,001 – 250,000
 * - **International** (Large): 250,001 – 1,000,000
 * - **Macro** (Crossover): above 1,000,000
 *
 * Tier assignment uses exclusive lower bounds: a band at exactly 10,000 listeners
 * remains in Micro; they must exceed the threshold to advance.
 *
 * Negative listener counts are not valid (Spotify returns 0 as the minimum); callers
 * must ensure `monthlyListeners >= 0`. Negative inputs would incorrectly return 'Micro'.
 *
 * @param monthlyListeners - Spotify monthly listener count (non-negative; caller-validated).
 * @returns The corresponding Tier label.
 */
export function getTierFromListeners(monthlyListeners: number): Tier {
  if (monthlyListeners > TIER_THRESHOLDS.International) return 'Macro'
  if (monthlyListeners > TIER_THRESHOLDS.Established) return 'International'
  if (monthlyListeners > TIER_THRESHOLDS.Emerging) return 'Established'
  if (monthlyListeners > TIER_THRESHOLDS.Micro) return 'Emerging'
  return 'Micro'
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
  return TIER_PRICING[tier]
}

/**
 * Calculates the total submission cost for a band entering multiple chart categories.
 *
 * The first selected category is always free regardless of tier. Each subsequent
 * category is billed at the tier-specific monthly rate. The breakdown array can be
 * shown in the band dashboard's CategoryPricing component for full transparency.
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

  const pricePerCategory = calculateCategoryPrice(band.tier)
  const breakdown: CategoryCostItem[] = selectedCategories.map((category, idx) => ({
    category,
    price: idx === 0 ? 0 : pricePerCategory,
    isFree: idx === 0,
  }))

  const totalCost = breakdown.reduce((sum, item) => sum + item.price, 0)
  return { totalCost, breakdown }
}
