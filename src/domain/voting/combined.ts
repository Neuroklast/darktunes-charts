/**
 * Combined chart aggregation module.
 *
 * Implements the 33/33/33 scoring model: Fan-Score, DJ-Score, and Peer-Score
 * are each Min-Max normalised independently to the [0, 1] interval and then
 * combined with equal weights.
 *
 * Why Min-Max normalisation?  Raw scores from three different voting systems
 * are not on the same scale.  QV credits produce absolute totals (e.g. 0–10 000),
 * Schulze produces Condorcet beatpath strengths, and peer voting produces
 * clique-adjusted weights.  Normalising each dimension independently ensures
 * that no single voting group can dominate the combined result simply because
 * its raw numbers are larger.
 *
 * Formula: combined = (1/3) * normFan + (1/3) * normDJ + (1/3) * normPeer
 */

/** Raw score triple for a single track. */
export interface TrackScores {
  trackId: string
  fanScore: number
  djScore: number
  peerScore: number
}

/** Fully resolved combined score with all intermediate values. */
export interface CombinedScore extends TrackScores {
  /** Fan score normalised to [0, 1]. */
  normalizedFanScore: number
  /** DJ score normalised to [0, 1]. */
  normalizedDJScore: number
  /** Peer score normalised to [0, 1]. */
  normalizedPeerScore: number
  /** Final combined score: (normFan + normDJ + normPeer) / 3. */
  combinedScore: number
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
 * Calculates the combined chart scores for a set of tracks.
 *
 * Each score dimension is independently Min-Max normalised across all tracks
 * before the equal-weight combination is applied. This means the combined
 * ranking reflects relative, not absolute, performance in each dimension.
 *
 * @param scores - Raw fan / DJ / peer scores for every track in the period.
 * @returns Combined scores sorted descending by combinedScore.
 */
export function calculateCombinedScores(scores: TrackScores[]): CombinedScore[] {
  if (scores.length === 0) return []

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
    const combinedScore = (normFan + normDJ + normPeer) / 3

    return {
      ...s,
      normalizedFanScore: normFan,
      normalizedDJScore: normDJ,
      normalizedPeerScore: normPeer,
      combinedScore,
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
