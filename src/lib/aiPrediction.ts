/** Factors included in an AI breakthrough prediction. */
export interface AIPredictionFactors {
  voteVelocity: number
  streamGrowth: number
  genreMomentum: number
}

/** Result of the AI breakthrough prediction algorithm. */
export interface AIPredictionResult {
  confidenceScore: number
  predictedBreakthrough: boolean
  factors: AIPredictionFactors
}

/**
 * Generates a machine-learning-style breakthrough prediction for a band.
 *
 * Combines three signals:
 * - Vote Velocity (40%): rate of fan vote increase over the past 30 days.
 * - Stream Growth (40%): percentage growth in Spotify monthly listeners.
 * - Genre Momentum (20%): band's growth vs. genre-average growth.
 *
 * Bands with a confidence score above 65% are predicted to tier-up within 3 months.
 *
 * @param _bandId - Band identifier (reserved for real Spotify/API integration).
 * @param historicalVotes - Time-series of vote counts for velocity calculation.
 * @param currentListeners - Current Spotify monthly listener count.
 * @param previousListeners - Listener count from the previous period (must be > 0).
 * @param genreAvgGrowth - Average growth percentage across the band's genre.
 * @returns Confidence score (0-95), breakthrough flag, and factor breakdown.
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

  const voteVelocity =
    recentVotes.length > 1
      ? (recentVotes[recentVotes.length - 1].votes - recentVotes[0].votes) / recentVotes.length
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
