/**
 * Early Discoverer Gamification — Spec §9.1
 *
 * Computes whether a fan voted for a track BEFORE that track entered the
 * Top 10 of the Combined Charts.  Fans with such early votes earn the
 * "🔮 Früher Entdecker" (Early Discoverer) badge.
 *
 * Design decisions:
 *   - All timestamp comparisons are done with Date objects (UTC) to avoid
 *     timezone-related edge cases.
 *   - The function is pure (no I/O); the caller fetches the required data
 *     and passes it in, keeping this module testable and framework-agnostic.
 *   - Percentage is rounded to the nearest integer for UI display.
 */

/** A single fan vote with the track it concerns and when it was cast. */
export interface FanVoteRecord {
  trackId: string
  votedAt: Date
}

/**
 * The chart entry for a track: when it first appeared in the Top 10 and
 * the track's identifier.
 */
export interface ChartEntry {
  trackId: string
  /** UTC timestamp when the track FIRST entered the Top 10 Combined Chart. */
  firstEnteredTop10At: Date
}

/** The computed early-discoverer result returned to the dashboard UI. */
export interface EarlyDiscovererResult {
  /** Number of Top-10 tracks the fan voted for before they charted. */
  discoveredCount: number
  /** Total number of Top-10 tracks in the current period. */
  totalTop10Count: number
  /** Percentage of Top-10 tracks discovered early (0–100, integer). */
  discoveryPercent: number
  /** IDs of the tracks the fan discovered early. */
  earlyTracksIds: string[]
}

/**
 * Determines which tracks from the current Top 10 the fan voted for before
 * they entered the chart, and returns a summary for the badge display.
 *
 * A track is considered "discovered early" if:
 *   fan.votedAt < chartEntry.firstEnteredTop10At
 *
 * @param fanVotes   - All votes cast by the fan (any period).
 * @param top10Chart - The current Top 10 Combined Chart entries with their
 *                     first-charted timestamps.
 * @returns EarlyDiscovererResult with discovery statistics.
 *
 * @example
 * const result = computeEarlyDiscoverer(fanVotes, top10Chart)
 * // result.discoveryPercent === 30 → "Du hast 3 von 10 Top-Tracks entdeckt"
 */
export function computeEarlyDiscoverer(
  fanVotes: FanVoteRecord[],
  top10Chart: ChartEntry[]
): EarlyDiscovererResult {
  if (top10Chart.length === 0) {
    return {
      discoveredCount: 0,
      totalTop10Count: 0,
      discoveryPercent: 0,
      earlyTracksIds: [],
    }
  }

  // Group fan votes by track, keeping only the EARLIEST vote per track
  const earliestVotePerTrack = new Map<string, Date>()
  for (const vote of fanVotes) {
    const existing = earliestVotePerTrack.get(vote.trackId)
    if (!existing || vote.votedAt < existing) {
      earliestVotePerTrack.set(vote.trackId, vote.votedAt)
    }
  }

  // Find which Top-10 tracks the fan voted for BEFORE they charted
  const earlyTracksIds: string[] = []

  for (const chartEntry of top10Chart) {
    const fanVotedAt = earliestVotePerTrack.get(chartEntry.trackId)
    if (fanVotedAt && fanVotedAt < chartEntry.firstEnteredTop10At) {
      earlyTracksIds.push(chartEntry.trackId)
    }
  }

  const discoveredCount = earlyTracksIds.length
  const totalTop10Count = top10Chart.length
  const discoveryPercent = Math.round((discoveredCount / totalTop10Count) * 100)

  return {
    discoveredCount,
    totalTop10Count,
    discoveryPercent,
    earlyTracksIds,
  }
}
