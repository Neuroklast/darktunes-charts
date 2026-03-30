/**
 * @module domain/tiers
 *
 * Single Source of Truth for the five-tier band classification system.
 *
 * Both the voting module (`domain/voting/tiers`) and the payment module
 * (`domain/payment/tierPricing`) import their tier constants and classification
 * logic from this canonical location, eliminating duplication (DRY principle).
 *
 * Tier assignment is based solely on Spotify monthly listener counts and
 * has ZERO influence on chart ranking scores (Spec §3.2).
 */
import type { Tier } from '@/lib/types'

/**
 * Spotify monthly listener thresholds that define each competition tier.
 *
 * A band is classified into a tier when its listener count *exceeds*
 * the threshold (exclusive lower bound). For example, a band at exactly
 * 10,000 listeners remains in Micro; it must exceed 10,000 to advance
 * to Emerging.
 */
export const TIER_THRESHOLDS: Readonly<Record<Tier, number>> = {
  Micro: 10_000,
  Emerging: 50_000,
  Established: 250_000,
  International: 1_000_000,
  Macro: Infinity,
}

/**
 * Monthly EUR price per additional chart category for each tier
 * (beyond the first free entry).
 *
 * First category is always free (freemium model, Spec §3.1).
 *
 * CRITICAL: These prices govern access/participation only.
 * They have ZERO influence on chart ranking scores (Spec §3.2).
 */
export const TIER_PRICING_EUR: Readonly<Record<Tier, number>> = {
  Micro: 5,
  Emerging: 15,
  Established: 35,
  International: 75,
  Macro: 150,
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
