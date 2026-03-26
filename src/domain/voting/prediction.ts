/** Factors included in an AI breakthrough prediction. */
export interface AIPredictionFactors {
  /** Rate of fan vote increase over the past 30 days (votes/day). */
  voteVelocity: number
  /** Percentage growth in Spotify monthly listeners since the previous period. */
  streamGrowth: number
  /** Band's growth relative to the genre average (ratio, 1.0 = at par). */
  genreMomentum: number
}

/** Result of the AI breakthrough prediction algorithm. */
export interface AIPredictionResult {
  /** Aggregate confidence score 0–95. Above 65 triggers a breakthrough prediction. */
  confidenceScore: number
  /** True when `confidenceScore > 65` — band likely to tier-up within 3 months. */
  predictedBreakthrough: boolean
  /** Disaggregated signal contributions for A&R transparency. */
  factors: AIPredictionFactors
}

/**
 * Generates a machine-learning-style breakthrough prediction for a band.
 *
 * Combines three independent signals with fixed weights:
 * - **Vote Velocity** (40%): rate of fan vote increase over the past 30 days.
 *   Calculated as (last_votes − first_votes) / actual_time_span_in_days.
 *   Produces true votes-per-day velocity; falls back to 0 if fewer than two data points exist.
 *   A high velocity indicates an emerging, passionate fanbase before mainstream breakthrough.
 * - **Stream Growth** (40%): percentage increase in Spotify monthly listeners.
 *   Absolute listeners are irrelevant; only growth rate matters for breakthrough detection.
 * - **Genre Momentum** (20%): band's stream growth relative to the genre average.
 *   A band growing 3× faster than its genre is a stronger signal than raw growth alone.
 *
 * Bands with `confidenceScore > 65` are flagged as predicted tier-up candidates
 * and highlighted in the A&R dashboard for label discovery.
 *
 * @param _bandId - Band identifier (reserved for future real Spotify/API integration).
 * @param historicalVotes - Time-series of vote counts for velocity calculation.
 *   Each entry must include a `timestamp` (epoch ms) and cumulative `votes` count.
 *   Velocity is computed as delta votes divided by the time span in days between the first and last entry.
 * @param currentListeners - Current Spotify monthly listener count.
 * @param previousListeners - Listener count from the previous period (must be > 0 to avoid division by zero).
 * @param genreAvgGrowth - Average stream growth percentage across the band's genre.
 * @returns Confidence score (0–95), breakthrough flag, and factor breakdown for display.
 */
export function generateAIPrediction(
  _bandId: string,
  historicalVotes: { timestamp: number; votes: number }[],
  currentListeners: number,
  previousListeners: number,
  genreAvgGrowth: number
): AIPredictionResult {
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const recentVotes = historicalVotes.filter(v => v.timestamp > thirtyDaysAgo)

  // True daily velocity: delta votes divided by the actual time span in days.
  // Uses the time difference between the first and last entry within the 30-day window.
  // Falls back to 0 when fewer than two data points are available.
  const voteVelocity =
    recentVotes.length > 1
      ? (recentVotes[recentVotes.length - 1].votes - recentVotes[0].votes) /
        Math.max(
          (recentVotes[recentVotes.length - 1].timestamp - recentVotes[0].timestamp) /
            (24 * 60 * 60 * 1000),
          1,
        )
      : 0

  const streamGrowth =
    previousListeners > 0
      ? ((currentListeners - previousListeners) / previousListeners) * 100
      : 0

  const genreMomentum = genreAvgGrowth > 0 ? streamGrowth / genreAvgGrowth : 1

  const voteScore = Math.min(voteVelocity / 10, 1) * 0.4
  const streamScore = Math.min(streamGrowth / 50, 1) * 0.4
  const genreScore = Math.min(genreMomentum, 1) * 0.2

  const rawScore = (voteScore + streamScore + genreScore) * 100
  const confidenceScore = Math.min(Math.round(rawScore), 95)

  return {
    confidenceScore,
    predictedBreakthrough: confidenceScore > 65,
    factors: {
      voteVelocity: Math.round(voteVelocity * 10) / 10,
      streamGrowth: Math.round(streamGrowth * 10) / 10,
      genreMomentum: Math.round(genreMomentum * 100) / 100,
    },
  }
}
