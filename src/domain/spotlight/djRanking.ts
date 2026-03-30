/**
 * DJ Leaderboard ranking module.
 *
 * The DJ ranking score combines three dimensions:
 *
 * 1. **Predictive accuracy** — how often did the DJ's ballot rankings match
 *    the final chart outcome?  Measured as normalised Kendall's tau (rank
 *    correlation) between the DJ's submitted ranking and the final combined chart.
 *
 * 2. **Ballot coverage** — what fraction of eligible tracks did the DJ rank?
 *    Submitting a minimal ballot (e.g. only 2 of 20 tracks) is penalised to
 *    prevent gaming the neutral-score fallback.
 *    Formula: adjustedAccuracy = rawAccuracy × min(ballotCoverage / 0.5, 1.0)
 *
 * 3. **Participation rate** — what fraction of available voting periods did
 *    the DJ participate in?  A DJ who votes every cycle should rank higher
 *    than one who only submits occasionally.
 *
 * Final score: totalScore = adjustedAccuracy × participationRate
 *
 * This multiplicative formula ensures that a highly accurate but rarely-present
 * DJ still scores lower than a consistently present DJ with moderate accuracy.
 */

export interface DJParticipation {
  userId: string
  /** Number of voting periods the DJ submitted a ballot in. */
  periodsParticipated: number
  /** Total number of voting periods available during the DJ's tenure. */
  totalPeriods: number
}

export interface DJBallotOutcome {
  userId: string
  /** DJ's submitted ranking (array of trackIds, index 0 = top pick). */
  submittedRankings: string[]
  /** Final combined chart ranking (array of trackIds, index 0 = #1 chart position). */
  finalRankings: string[]
}

export interface DJRankingResult {
  userId: string
  predictiveAccuracy: number
  /** Fraction of eligible tracks the DJ ranked (0–1). */
  ballotCoverage: number
  participationRate: number
  totalScore: number
}

/** Neutral score returned when there are fewer than 2 shared tracks for comparison. */
const NEUTRAL_KENDALL_TAU_SCORE = 0.5

/**
 * Computes the normalised Kendall tau rank correlation.
 *
 * Kendall's tau counts concordant pairs (same relative order) minus discordant
 * pairs, divided by the total number of pairs. Result is in [-1, 1].
 * We normalise to [0, 1] by applying: normalised = (tau + 1) / 2.
 *
 * Only tracks appearing in both rankings are compared; tracks in one but not
 * the other are ignored (partial ballots are common for DJs who rank a subset).
 *
 * @param submitted - DJ's submitted track IDs in preference order.
 * @param final - Final combined chart track IDs in rank order.
 * @returns Normalised Kendall's tau in [0, 1].
 */
export function computeKendallTau(submitted: string[], final: string[]): number {
  // Build intersection of both rankings.
  const submittedSet = new Set(submitted)
  const sharedTracks = final.filter(id => submittedSet.has(id))

  if (sharedTracks.length < 2) return NEUTRAL_KENDALL_TAU_SCORE

  // Map each track to its position in each ranking.
  const submittedIndex = new Map(submitted.map((id, i) => [id, i]))
  const finalIndex = new Map(final.map((id, i) => [id, i]))

  let concordant = 0
  let discordant = 0

  for (let i = 0; i < sharedTracks.length; i++) {
    for (let j = i + 1; j < sharedTracks.length; j++) {
      const a = sharedTracks[i]!
      const b = sharedTracks[j]!

      const submittedABeforeB = (submittedIndex.get(a) ?? 0) < (submittedIndex.get(b) ?? 0)
      const finalABeforeB = (finalIndex.get(a) ?? 0) < (finalIndex.get(b) ?? 0)

      if (submittedABeforeB === finalABeforeB) {
        concordant++
      } else {
        discordant++
      }
    }
  }

  const total = concordant + discordant
  if (total === 0) return NEUTRAL_KENDALL_TAU_SCORE

  const tau = (concordant - discordant) / total
  return (tau + 1) / 2 // Normalise from [-1, 1] to [0, 1].
}

/**
 * Minimum ballot coverage threshold before a penalty applies.
 *
 * DJs who rank at least 50% of eligible tracks receive no penalty.
 * Below this threshold the coverage penalty scales linearly to zero.
 */
const MINIMUM_COVERAGE_THRESHOLD = 0.5

/**
 * Computes the ballot coverage ratio — the fraction of eligible tracks
 * that a DJ actually ranked in their ballot.
 *
 * @param rankedCount  - Number of tracks the DJ placed in their ballot.
 * @param totalEligible - Total tracks available for ranking in the period.
 * @returns Coverage ratio in [0, 1].  Returns 1 when totalEligible is 0
 *          (no tracks available → no penalty).
 */
export function computeBallotCoverage(
  rankedCount: number,
  totalEligible: number
): number {
  // When no tracks are eligible there is nothing to rank — no penalty applies.
  if (totalEligible <= 0) return 1
  return Math.min(1, Math.max(0, rankedCount / totalEligible))
}

/**
 * Adjusts raw Kendall's tau accuracy by the ballot coverage factor.
 *
 * DJs who rank ≥ 50% of eligible tracks receive their full accuracy score.
 * Below 50% the accuracy is scaled down linearly:
 *
 *   adjustedAccuracy = rawAccuracy × min(ballotCoverage / 0.5, 1.0)
 *
 * This prevents gaming where a DJ submits only 2 tracks to guarantee the
 * neutral 0.5 score instead of risking a lower accuracy on a full ballot.
 *
 * @param rawAccuracy    - Normalised Kendall's tau in [0, 1].
 * @param ballotCoverage - Fraction of eligible tracks ranked (0–1).
 * @returns Adjusted accuracy in [0, 1].
 */
export function computeAdjustedAccuracy(
  rawAccuracy: number,
  ballotCoverage: number
): number {
  const coverageFactor = Math.min(ballotCoverage / MINIMUM_COVERAGE_THRESHOLD, 1.0)
  return rawAccuracy * coverageFactor
}

/**
 * Computes the participation rate for a DJ.
 *
 * @param participation - Period counts for the DJ.
 * @returns Value in [0, 1]; 1.0 = voted every period.
 */
export function computeParticipationRate(participation: DJParticipation): number {
  if (participation.totalPeriods === 0) return 0
  return Math.min(1, participation.periodsParticipated / participation.totalPeriods)
}

/**
 * Computes the full DJ ranking scores for a list of DJs.
 *
 * Each DJ's raw Kendall's tau accuracy is adjusted by their ballot coverage
 * before being multiplied by the participation rate.
 *
 * @param ballotOutcomes - One entry per DJ with their ballot vs. final chart.
 * @param participations - Participation records (matched by userId).
 * @returns Ranked DJ results sorted descending by totalScore.
 */
export function computeDJRankings(
  ballotOutcomes: DJBallotOutcome[],
  participations: DJParticipation[]
): DJRankingResult[] {
  const participationMap = new Map(participations.map(p => [p.userId, p]))

  const results: DJRankingResult[] = ballotOutcomes.map(outcome => {
    const rawAccuracy = computeKendallTau(
      outcome.submittedRankings,
      outcome.finalRankings
    )

    const ballotCoverage = computeBallotCoverage(
      outcome.submittedRankings.length,
      outcome.finalRankings.length
    )

    const adjustedAccuracy = computeAdjustedAccuracy(rawAccuracy, ballotCoverage)

    const participation = participationMap.get(outcome.userId) ?? {
      userId: outcome.userId,
      periodsParticipated: 1,
      totalPeriods: 1,
    }

    const participationRate = computeParticipationRate(participation)
    const totalScore = adjustedAccuracy * participationRate

    return {
      userId: outcome.userId,
      predictiveAccuracy: adjustedAccuracy,
      ballotCoverage,
      participationRate,
      totalScore,
    }
  })

  return results.sort((a, b) => b.totalScore - a.totalScore)
}
