/**
 * @module domain/tiers
 *
 * Single Source of Truth for the five-tier band classification system.
 *
 * Every constant and function related to tier thresholds (Spotify monthly
 * listeners) and tier pricing (EUR per additional chart category) lives here.
 * Both `domain/voting/tiers` and `domain/payment/tierPricing` import from
 * this module to eliminate duplication.
 *
 * Tier structure (Darktunes platform specification, Section 5):
 * - **Micro** (Underground): 0 – 10,000 listeners → €5 / additional category
 * - **Emerging** (Small): 10,001 – 50,000 → €15
 * - **Established** (Medium): 50,001 – 250,000 → €35
 * - **International** (Large): 250,001 – 1,000,000 → €75
 * - **Macro** (Crossover): above 1,000,000 → €150
 *
 * **CRITICAL**: Financial contribution has ZERO influence on chart ranking
 * scores. Payment only unlocks participation in additional categories (Spec §3.2).
 */

import type { Tier } from '@/lib/types'

/**
 * Spotify monthly listener thresholds that define each competition tier.
 * A band must *exceed* the threshold to advance to the next tier
 * (i.e., exactly 10,000 listeners → still Micro).
 */
export const TIER_THRESHOLDS: Readonly<Record<Tier, number>> = {
  Micro: 10_000,
  Emerging: 50_000,
  Established: 250_000,
  International: 1_000_000,
  Macro: Infinity,
} as const

/**
 * Monthly EUR price per additional chart category for each tier.
 * The first category is always free (freemium model, Spec §3.1).
 * Progressive pricing enables cross-subsidization: Macro band fees (€150)
 * fund infrastructure that allows Micro bands to participate for only €5.
 */
export const TIER_PRICING_EUR: Readonly<Record<Tier, number>> = {
  Micro: 5,
  Emerging: 15,
  Established: 35,
  International: 75,
  Macro: 150,
} as const

/**
 * Derives the competition tier for a band from its Spotify monthly listener count.
 *
 * Tier assignment uses exclusive lower bounds: a band at exactly 10,000 listeners
 * remains in Micro; they must exceed the threshold to advance.
 *
 * Negative listener counts are not valid (Spotify returns 0 as the minimum);
 * this function throws a `RangeError` for negative inputs to fail fast on invalid data.
 *
 * @param monthlyListeners - Spotify monthly listener count (must be ≥ 0).
 * @returns The corresponding Tier label.
 * @throws {RangeError} If `monthlyListeners` is negative.
 */
export function getTierFromListeners(monthlyListeners: number): Tier {
  if (monthlyListeners < 0) {
    throw new RangeError(`monthlyListeners must be ≥ 0, got ${monthlyListeners}`)
  }
  if (monthlyListeners > TIER_THRESHOLDS.International) return 'Macro'
  if (monthlyListeners > TIER_THRESHOLDS.Established) return 'International'
  if (monthlyListeners > TIER_THRESHOLDS.Emerging) return 'Established'
  if (monthlyListeners > TIER_THRESHOLDS.Micro) return 'Emerging'
  return 'Micro'
}

/**
 * Returns the EUR price per additional chart category for a given tier.
 *
 * @param tier - The band's competition tier.
 * @returns EUR price for each additional category beyond the first free one.
 */
export function getTierPriceEur(tier: Tier): number {
  return TIER_PRICING_EUR[tier]
}
