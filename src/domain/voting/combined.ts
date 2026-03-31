/**
 * Combined chart aggregation module.
 *
 * Supports two scoring modes:
 * 1. Equal 33/33/33 weights (Overall Charts — no category specified).
 * 2. Category-aware weights: Fan-Score, DJ-Score, and Peer-Score are
 *    weighted according to the per-category configuration in CATEGORY_DEFINITIONS.
 *    Example: Best Cover Art uses 70/15/15, Voice of the Void uses 20/20/60.
 *
 * In both modes, each score dimension is independently Min-Max normalised
 * across all tracks before the weighted combination is applied, ensuring that
 * no single voting group can dominate simply because its raw numbers are larger.
 *
 * Formula: combined = normFan * w.fan + normDJ * w.dj + normPeer * w.peer
 */

import type { AllCategory } from '@/lib/types'
import { CATEGORY_DEFINITIONS } from '@/domain/categories'

/** Equal-weight fallback used when no categoryId is provided (Overall Charts). */
const EQUAL_WEIGHT = 1 / 3

/** Active weight configuration for the three voting pillars. */
export interface PillarWeights {
  fan: number
  dj: number
  peer: number
}

/** Raw score triple for a single track. */
export interface TrackScores {
  trackId: string
  fanScore: number
  djScore: number
  peerScore: number
  /** Optional category context. When provided, category-specific weights are applied. */
  categoryId?: AllCategory
}

/** Fully resolved combined score with all intermediate values. */
export interface CombinedScore extends TrackScores {
  /** Fan score normalised to [0, 1]. */
  normalizedFanScore: number
  /** DJ score normalised to [0, 1]. */
  normalizedDJScore: number
  /** Peer score normalised to [0, 1]. */
  normalizedPeerScore: number
  /** Final combined score in [0, 1]. */
  combinedScore: number
  /** Weights that were actually applied — included for transparency in UI. */
  appliedWeights: PillarWeights
}

/**
 * Normalises an array of values to the [0, 1] range using Min-Max scaling.
 *
 * Edge cases:
 * - If all values are identical (range = 0), every normalised value is 0.5
 *   so that no track is arbitrarily favoured or penalised.
 *
 * @param values - Raw numeric scores (any finite numbers).
 * @returns New array of the same length with values in [0, 1].
 */
export function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return []

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  /** Neutral midpoint returned when all values are identical; avoids arbitrary favouritism. */
  const ZERO_RANGE_NORMALIZED_VALUE = 0.5

  if (range === 0) {
    return values.map(() => ZERO_RANGE_NORMALIZED_VALUE)
  }

  return values.map(v => (v - min) / range)
}

/**
 * Resolves the pillar weights for a given category.
 *
 * When a categoryId is provided, the weights defined in CATEGORY_DEFINITIONS are used.
 * When omitted (Overall Charts), equal 1/3 weights are returned.
 *
 * @param categoryId - Optional category to look up weights for.
 * @returns Pillar weight configuration that sums to 1.0.
 */
export function resolveWeights(categoryId?: AllCategory): PillarWeights {
  if (!categoryId) {
    return { fan: EQUAL_WEIGHT, dj: EQUAL_WEIGHT, peer: EQUAL_WEIGHT }
  }
  const meta = CATEGORY_DEFINITIONS[categoryId]
  return { fan: meta.fanWeight, dj: meta.djWeight, peer: meta.peerWeight }
}

/**
 * Calculates a single weighted composite score from three normalised pillar scores.
 *
 * All inputs must be in the [0, 1] range. The weights must sum to 1.0.
 *
 * @param normFan  - Normalised fan score in [0, 1].
 * @param normDJ   - Normalised DJ score in [0, 1].
 * @param normPeer - Normalised peer score in [0, 1].
 * @param weights  - Pillar weight configuration (fan + dj + peer must sum to 1.0).
 * @returns Weighted composite score in [0, 1].
 */
export function calculateWeightedScore(
  normFan: number,
  normDJ: number,
  normPeer: number,
  weights: PillarWeights,
): number {
  return normFan * weights.fan + normDJ * weights.dj + normPeer * weights.peer
}

/**
 * Calculates the combined chart scores for a set of tracks.
 *
 * Each score dimension is independently Min-Max normalised across all tracks
 * before the weighted combination is applied. This means the combined ranking
 * reflects relative, not absolute, performance in each dimension.
 *
 * @param scores     - Raw fan / DJ / peer scores for every track in the period.
 * @param categoryId - Optional category ID. When provided, category-specific
 *                     weights (e.g. 70/15/15 for Best Cover Art) are applied.
 *                     When omitted, equal 1/3 weights are used (Overall Charts).
 * @returns Combined scores sorted descending by combinedScore.
 */
export function calculateCombinedScores(scores: TrackScores[], categoryId?: AllCategory): CombinedScore[] {
  if (scores.length === 0) return []

  const weights = resolveWeights(categoryId)

  const fanValues = scores.map(s => s.fanScore)
  const djValues = scores.map(s => s.djScore)
  const peerValues = scores.map(s => s.peerScore)

  const normalizedFan = minMaxNormalize(fanValues)
  const normalizedDJ = minMaxNormalize(djValues)
  const normalizedPeer = minMaxNormalize(peerValues)

  const combined: CombinedScore[] = scores.map((s, i) => {
    const normFan = normalizedFan[i]!
    const normDJ = normalizedDJ[i]!
    const normPeer = normalizedPeer[i]!
    const combinedScore = calculateWeightedScore(normFan, normDJ, normPeer, weights)

    return {
      ...s,
      categoryId: categoryId ?? s.categoryId,
      normalizedFanScore: normFan,
      normalizedDJScore: normDJ,
      normalizedPeerScore: normPeer,
      combinedScore,
      appliedWeights: weights,
    }
  })

  return combined.sort((a, b) => b.combinedScore - a.combinedScore)
}

/**
 * Assigns ordinal ranks to a sorted array of combined scores.
 *
 * Handles ties: tracks with identical combinedScore receive the same rank,
 * and the rank counter skips accordingly (competition ranking / 1224 ranking).
 *
 * @param sortedScores - Combined scores sorted descending (output of calculateCombinedScores).
 * @returns Map of trackId → rank (1-indexed).
 */
export function assignRanks(sortedScores: CombinedScore[]): Map<string, number> {
  const ranks = new Map<string, number>()
  let rank = 1

  for (let i = 0; i < sortedScores.length; i++) {
    const current = sortedScores[i]!
    const prev = sortedScores[i - 1]

    if (prev && current.combinedScore === prev.combinedScore) {
      ranks.set(current.trackId, ranks.get(prev.trackId)!)
    } else {
      ranks.set(current.trackId, rank)
    }

    rank++
  }

  return ranks
}
