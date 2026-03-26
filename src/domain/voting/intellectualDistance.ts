/**
 * Intellectual Distance Bonus — rewards bands that vote across diverse genres
 * and regions, indicating genuine engagement rather than bloc voting.
 *
 * Rationale (Spec §5.3.4):
 *   Bands that exclusively vote for tracks within their own genre or region are
 *   more likely to be participating in coordinated mutual-promotion rings.
 *   Bands that vote across a broad spectrum demonstrate independent judgment
 *   and deserve a bonus weight multiplier on their votes.
 *
 * Formula:
 *   diversityScore ∈ [0, 1] — computed as the normalised Shannon entropy of
 *   the voter's genre distribution across their voted tracks.
 *
 *   bonus = 1.0 + (diversityScore × MAX_BONUS_INCREMENT)
 *         = 1.0 + (diversityScore × 0.15)
 *   Therefore bonus ∈ [1.0, 1.15]
 *
 * Shannon entropy chosen because it is the standard information-theoretic
 * measure of diversity; it is maximised when votes are spread uniformly
 * across all genres and minimised when all votes go to the same genre.
 */

/** Maximum bonus increment added on top of 1.0 for perfectly diverse voters. */
const MAX_BONUS_INCREMENT = 0.15

/** Minimum multiplier (no diversity bonus). */
const MIN_MULTIPLIER = 1.0

/** Maximum multiplier (fully diverse voter). */
const MAX_MULTIPLIER = 1.0 + MAX_BONUS_INCREMENT

/**
 * Genre distribution: a map of genre label → vote count.
 * Passed in by the caller to keep this module framework-agnostic.
 */
export type GenreDistribution = Record<string, number>

/**
 * Computes the normalised Shannon entropy of a genre distribution.
 *
 * H_norm = H / log2(n)
 *
 * where H = -Σ p_i * log2(p_i) is the raw Shannon entropy and n is the
 * number of distinct genres.  Normalising by log2(n) maps the result to
 * [0, 1] regardless of the number of genres.
 *
 * Edge cases:
 *   - Empty distribution → 0.0
 *   - Single genre → 0.0 (no diversity)
 *   - Uniform distribution across n genres → 1.0
 *
 * @param distribution - Mapping of genre → count (counts must be ≥ 0).
 * @returns Normalised entropy value in [0, 1].
 */
export function computeNormalisedEntropy(distribution: GenreDistribution): number {
  const counts = Object.values(distribution).filter(c => c > 0)

  if (counts.length === 0) return 0
  if (counts.length === 1) return 0

  const total = counts.reduce((sum, c) => sum + c, 0)
  if (total === 0) return 0

  const n = counts.length
  const maxEntropy = Math.log2(n)

  if (maxEntropy === 0) return 0

  const entropy = counts.reduce((h, c) => {
    const p = c / total
    return h - p * Math.log2(p)
  }, 0)

  return Math.min(entropy / maxEntropy, 1)
}

/**
 * Calculates the intellectual-distance bonus multiplier for a voter.
 *
 * @param distribution - Genre distribution of the tracks this voter has voted for.
 * @returns Bonus multiplier in [1.0, 1.15].
 */
export function computeIntellectualDistanceBonus(distribution: GenreDistribution): number {
  const diversity = computeNormalisedEntropy(distribution)
  return Math.min(MAX_MULTIPLIER, MIN_MULTIPLIER + diversity * MAX_BONUS_INCREMENT)
}

/**
 * Applies intellectual-distance bonuses to a set of peer band votes.
 *
 * For each voter, the caller must supply the genre distribution of tracks
 * that voter has voted for (collected from the database before calling this
 * function).  This keeps the domain module free of database dependencies.
 *
 * State is immutable — returns new vote objects without mutating the originals.
 *
 * @param votes           - Peer band votes (possibly already clique/triadic adjusted).
 * @param voterGenreMap   - Map of voterId → GenreDistribution of their voted tracks.
 * @returns New array of votes with intellectual-distance bonuses applied.
 */
export function applyIntellectualDistanceBonus<T extends { voterId: string; weight: number }>(
  votes: T[],
  voterGenreMap: Map<string, GenreDistribution>
): T[] {
  const bonusCache = new Map<string, number>()

  return votes.map(vote => {
    let bonus = bonusCache.get(vote.voterId)
    if (bonus === undefined) {
      const distribution = voterGenreMap.get(vote.voterId) ?? {}
      bonus = computeIntellectualDistanceBonus(distribution)
      bonusCache.set(vote.voterId, bonus)
    }
    return { ...vote, weight: vote.weight * bonus }
  })
}
