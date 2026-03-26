/**
 * Deterministic "Random Band of the Day" algorithm.
 *
 * Uses a seeded pseudo-random number generator keyed on the UTC date string
 * (YYYY-MM-DD) so that the same band is always selected on the same day —
 * reproducible across server restarts and multiple edge instances.
 *
 * Eligible bands: only Tier 1 (Micro) and Tier 2 (Emerging) bands.
 * Rationale: the spotlight exists to surface artists who don't yet have
 * mainstream visibility; Established / International / Macro artists already
 * have significant reach.
 */

export type EligibleTier = 'Micro' | 'Emerging'

export interface SpotlightBand {
  id: string
  name: string
  tier: EligibleTier
  genre: string
}

/**
 * Seeded linear-congruential generator (LCG).
 *
 * Produces a deterministic float in [0, 1) from a seed string.
 * The seed is hashed by summing char codes, providing reasonable dispersion
 * for short date strings without a crypto dependency.
 *
 * @param seed - Arbitrary string seed (typically a date like "2025-03-26").
 * @returns Pseudo-random float in [0, 1).
 */
export function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0
  }

  // LCG parameters from Numerical Recipes in C, 2nd ed., §7.1 (Press et al., 1992).
  const a = 1664525
  const c = 1013904223
  const m = 2 ** 32
  const next = ((a * (hash >>> 0) + c) >>> 0) / m

  return next
}

/**
 * Selects the Band of the Day using a deterministic, date-seeded algorithm.
 *
 * The function is pure: given the same date and the same list of eligible bands,
 * it will always return the same band. It is safe to call on multiple servers
 * simultaneously.
 *
 * @param bands - All bands that may be spotlighted (should be filtered to Tier 1/2 only).
 * @param dateString - UTC date in ISO format YYYY-MM-DD (e.g. "2025-03-26").
 *                     Defaults to today's UTC date.
 * @returns The selected spotlight band, or null if no eligible bands exist.
 */
export function selectBandOfTheDay(
  bands: SpotlightBand[],
  dateString?: string
): SpotlightBand | null {
  const eligibleBands = bands.filter(
    b => b.tier === 'Micro' || b.tier === 'Emerging'
  )

  if (eligibleBands.length === 0) return null

  const seed = dateString ?? new Date().toISOString().slice(0, 10)
  const rng = seededRandom(seed)
  const index = Math.floor(rng * eligibleBands.length)

  return eligibleBands[index]!
}

/**
 * Returns today's UTC date string in YYYY-MM-DD format.
 * Useful as the default seed for selectBandOfTheDay.
 */
export function todayUTCDateString(): string {
  return new Date().toISOString().slice(0, 10)
}
