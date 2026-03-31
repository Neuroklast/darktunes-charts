/**
 * @module domain/gamification/fanImpact
 *
 * Fan Impact Tracker — "Dein Impact" emotional architecture module.
 *
 * Transforms raw vote data into a meaningful personal impact narrative for fans.
 * The platform becomes a living community when fans can see how their voice
 * shaped the charts: which tracks climbed because of their support, whether
 * they were early discoverers of a winning artist, and a composite impact score
 * that recognises sustained engagement over a voting period.
 *
 * Design decisions:
 * - Pure functions only; no side effects, no I/O.
 * - `impactScore` is a 0–100 composite that rewards both credits spent and
 *   the quality of outcomes (tracks that rose, category winners supported).
 * - `wasEarlyDiscoverer` is true when the track had fewer than
 *   EARLY_DISCOVERER_RANK_THRESHOLD in the previous period, meaning the fan
 *   voted for it before it was popular.
 */

/** Threshold: a track is considered "newly discovered" if its previous rank
 *  was beyond this position (or it had no previous rank at all). */
const EARLY_DISCOVERER_RANK_THRESHOLD = 10

/** Caps for normalising the impactScore composite. */
const MAX_IMPACT_CREDITS = 100
const IMPACT_RANK_CHANGE_CAP = 20

/** Impact record for a single track that a fan voted for in a period. */
export interface VoteImpactRecord {
  trackId: string
  trackTitle: string
  bandName: string
  creditsSpent: number
  /** Null when this is the first period the track appeared in the charts. */
  rankBefore: number | null
  rankAfter: number
  /** Positive = climbed (improved rank), negative = fell, 0 = unchanged. */
  rankChange: number
  /** True if the fan voted for this track when it was outside the top 10. */
  wasEarlyDiscoverer: boolean
  /** Set to the category name if the track won a category this period. */
  categoryWon?: string
}

/** Aggregated impact summary for a fan over a single voting period. */
export interface FanImpactSummary {
  periodId: string
  /** Human-readable period label, e.g. "März 2026". */
  periodLabel: string
  totalCreditsSpent: number
  tracksVotedFor: number
  impactRecords: VoteImpactRecord[]
  /** The single track where the fan's support correlates with the largest rank improvement. */
  biggestImpact: VoteImpactRecord | null
  /** Number of tracks the fan voted for before they entered the top 10. */
  earlyDiscoveries: number
  /** Number of category winners the fan voted for this period. */
  categoryWinnersVoted: number
  /** Composite engagement score in [0, 100]. */
  impactScore: number
}

/** Minimal vote data required for impact computation. */
export interface FanVoteEntry {
  trackId: string
  creditsSpent: number
}

/** Ranking outcome for a single track. */
export interface TrackRankingOutcome {
  trackId: string
  trackTitle: string
  bandName: string
  rankBefore: number | null
  rankAfter: number
  categoryWon?: string
}

/**
 * Computes a fan's impact summary for a completed voting period.
 *
 * Each track the fan voted for is cross-referenced with the ranking outcomes
 * to determine rank changes, early-discoverer status, and category wins.
 * Tracks that appear in `votes` but not in `outcomes` are silently skipped
 * (the track may have been disqualified or not submitted in the period).
 *
 * @param periodId        - Unique identifier for the voting period (e.g. "2026-03").
 * @param periodLabel     - Human-readable period label (e.g. "März 2026").
 * @param votes           - All votes cast by the fan in this period.
 * @param outcomes        - Final ranking outcomes indexed by trackId.
 * @returns FanImpactSummary with all impact metrics computed.
 */
export function computeFanImpact(
  periodId: string,
  periodLabel: string,
  votes: FanVoteEntry[],
  outcomes: Map<string, TrackRankingOutcome>,
): FanImpactSummary {
  const impactRecords: VoteImpactRecord[] = []
  let totalCreditsSpent = 0

  for (const vote of votes) {
    const outcome = outcomes.get(vote.trackId)
    if (!outcome) continue

    totalCreditsSpent += vote.creditsSpent
    const rankChange = computeRankChange(outcome.rankBefore, outcome.rankAfter)
    const wasEarlyDiscoverer = determineEarlyDiscoverer(outcome.rankBefore)

    impactRecords.push({
      trackId: vote.trackId,
      trackTitle: outcome.trackTitle,
      bandName: outcome.bandName,
      creditsSpent: vote.creditsSpent,
      rankBefore: outcome.rankBefore,
      rankAfter: outcome.rankAfter,
      rankChange,
      wasEarlyDiscoverer,
      categoryWon: outcome.categoryWon,
    })
  }

  const biggestImpact = findBiggestImpact(impactRecords)
  const earlyDiscoveries = impactRecords.filter(r => r.wasEarlyDiscoverer).length
  const categoryWinnersVoted = impactRecords.filter(r => r.categoryWon !== undefined).length
  const impactScore = computeImpactScore(impactRecords, totalCreditsSpent)

  return {
    periodId,
    periodLabel,
    totalCreditsSpent,
    tracksVotedFor: impactRecords.length,
    impactRecords,
    biggestImpact,
    earlyDiscoveries,
    categoryWinnersVoted,
    impactScore,
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Rank change: positive means the track climbed (rank number decreased),
 * negative means it fell.  Null `rankBefore` (first appearance) is treated
 * as "new entry" and yields a positive change equal to chart size.
 */
function computeRankChange(rankBefore: number | null, rankAfter: number): number {
  if (rankBefore === null) return 0
  return rankBefore - rankAfter
}

function determineEarlyDiscoverer(rankBefore: number | null): boolean {
  return rankBefore === null || rankBefore > EARLY_DISCOVERER_RANK_THRESHOLD
}

function findBiggestImpact(records: VoteImpactRecord[]): VoteImpactRecord | null {
  if (records.length === 0) return null

  return records.reduce((best, current) =>
    current.rankChange > best.rankChange ? current : best,
  )
}

/**
 * Composite impact score in [0, 100].
 *
 * Components:
 * - 50 % from credits spent (normalised against MAX_IMPACT_CREDITS).
 * - 30 % from average rank improvement across voted tracks (normalised against
 *   IMPACT_RANK_CHANGE_CAP positions).
 * - 20 % from bonus events: early discoveries and category winners (each capped at 10 %).
 */
function computeImpactScore(records: VoteImpactRecord[], totalCreditsSpent: number): number {
  if (records.length === 0) return 0

  const creditComponent = Math.min(totalCreditsSpent / MAX_IMPACT_CREDITS, 1.0) * 50

  const avgRankChange = records.reduce((sum, r) => sum + Math.max(0, r.rankChange), 0) / records.length
  const rankComponent = Math.min(avgRankChange / IMPACT_RANK_CHANGE_CAP, 1.0) * 30

  const earlyDiscoveryRatio = records.filter(r => r.wasEarlyDiscoverer).length / records.length
  const categoryWinRatio = records.filter(r => r.categoryWon !== undefined).length / records.length
  const bonusComponent = Math.min(earlyDiscoveryRatio, 1.0) * 10 + Math.min(categoryWinRatio, 1.0) * 10

  return Math.round(creditComponent + rankComponent + bonusComponent)
}
