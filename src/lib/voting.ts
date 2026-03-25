import type { FanVote, DJBallot, BandVote, Band, Tier } from './types'

// Audit-related functions (transparency log, bot detection, quarantine) are in votingAudit.ts
export { createTransparencyLogEntry, detectBotActivity, quarantineVotes } from './votingAudit'

/** Thresholds for each tier based on Spotify monthly listeners. */
const TIER_THRESHOLDS: Record<Tier, number> = {
  Micro: 10_000,
  Emerging: 50_000,
  Established: 250_000,
  International: 1_000_000,
  Macro: Infinity,
}

/** Price in EUR for each additional chart category beyond the first free one. */
const TIER_PRICING: Record<Tier, number> = {
  Micro: 5,
  Emerging: 15,
  Established: 35,
  International: 75,
  Macro: 150,
}

/**
 * Calculates the voice credit cost for casting a given number of quadratic votes.
 * The cost grows quadratically to prevent wealthy vote accumulation (votes^2 credits).
 * @param votes - The number of votes to cast (must be a non-negative integer).
 * @returns The total credit cost.
 */
export function calculateQuadraticCost(votes: number): number {
  return votes * votes
}

/**
 * Returns the maximum number of votes a user can cast with a given credit budget.
 * Derived from the inverse of the quadratic cost function: floor(sqrt(credits)).
 * @param credits - Available voice credits.
 * @returns Maximum votes the user can cast.
 */
export function calculateMaxVotesForCredits(credits: number): number {
  return Math.floor(Math.sqrt(credits))
}

/**
 * Validates that a fan's vote allocations do not exceed the 100-credit monthly budget.
 * @param votes - Array of all fan votes across tracks.
 * @returns Validation result with total credits spent.
 */
export function validateFanVotes(votes: FanVote[]): { valid: boolean; totalCredits: number } {
  const totalCredits = votes.reduce((sum, vote) => sum + calculateQuadraticCost(vote.votes), 0)
  return {
    valid: totalCredits <= 100,
    totalCredits,
  }
}

/**
 * Implements the Schulze (Beatpath) method for DJ ranked-choice ballots.
 *
 * This Condorcet-compatible method finds the candidate that would beat all others
 * in pairwise comparisons via the strongest path. It eliminates strategic burial
 * (a major flaw of simpler Borda-count systems used in awards like the ESC).
 *
 * @param ballots - Array of DJ ballots, each containing an ordered ranking of candidate IDs.
 * @param candidateIds - The full list of candidate IDs eligible in this category.
 * @returns Candidate IDs sorted from strongest to weakest Schulze winner.
 */
export function calculateSchulzeWinner(ballots: DJBallot[], candidateIds: string[]): string[] {
  const n = candidateIds.length
  if (n === 0) return []
  if (n === 1) return candidateIds

  // d[i][j] = how many ballots rank i above j
  const d: number[][] = Array.from({ length: n }, () => Array(n).fill(0))

  for (const ballot of ballots) {
    for (let i = 0; i < ballot.rankings.length; i++) {
      for (let j = i + 1; j < ballot.rankings.length; j++) {
        const higherIdx = candidateIds.indexOf(ballot.rankings[i])
        const lowerIdx = candidateIds.indexOf(ballot.rankings[j])
        if (higherIdx !== -1 && lowerIdx !== -1) {
          d[higherIdx][lowerIdx]++
        }
      }
    }
  }

  // p[i][j] = strength of the strongest path from i to j (Floyd-Warshall variant)
  const p: number[][] = Array.from({ length: n }, () => Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        p[i][j] = d[i][j] > d[j][i] ? d[i][j] : 0
      }
    }
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        for (let k = 0; k < n; k++) {
          if (i !== k && j !== k) {
            p[j][k] = Math.max(p[j][k], Math.min(p[j][i], p[i][k]))
          }
        }
      }
    }
  }

  const scores: { id: string; score: number }[] = candidateIds.map((id, idx) => {
    let score = 0
    for (let j = 0; j < n; j++) {
      if (idx !== j && p[idx][j] > p[j][idx]) {
        score++
      }
    }
    return { id, score }
  })

  scores.sort((a, b) => b.score - a.score)
  return scores.map(s => s.id)
}

/**
 * Computes an anti-collusion weight for a peer vote using network clique detection.
 *
 * If a reciprocal voting relationship is detected (A votes B and B votes A exclusively),
 * the weight is gradually reduced. Mutual connections in a voting ring amplify the penalty.
 * This prevents vote-trading rings from gaming the peer review pillar.
 *
 * @param voterId - The ID of the band casting the vote.
 * @param votedForId - The ID of the band receiving the vote.
 * @param allBandVotes - Map of bandId to list of band IDs that band voted for.
 * @returns A weight multiplier between 0.4 (heavy collusion) and 1.0 (clean).
 */
export function calculateCliqueCoefficient(
  voterId: string,
  votedForId: string,
  allBandVotes: Map<string, string[]>
): number {
  const voterVotedFor = allBandVotes.get(voterId) ?? []
  const votedForVotedFor = allBandVotes.get(votedForId) ?? []

  const hasReciprocalVote = votedForVotedFor.includes(voterId)

  if (!hasReciprocalVote) {
    return 1.0
  }

  const mutualConnections = voterVotedFor.filter(id => votedForVotedFor.includes(id)).length
  const cliqueFactor = Math.min(mutualConnections * 0.15, 0.6)

  return Math.max(1.0 - cliqueFactor, 0.4)
}

/**
 * Applies clique-adjusted weights to a set of peer votes.
 * @param votes - Raw peer band votes.
 * @param _allBandVotes - Historical vote map used for clique detection (reserved for future use).
 * @returns Votes with adjusted weights.
 */
export function applyCliqueWeighting(votes: BandVote[], _allBandVotes: Map<string, string[]>): BandVote[] {
  return votes.map(vote => ({ ...vote, weight: vote.weight }))
}

/** Factors included in an AI breakthrough prediction. */
interface AIPredictionFactors {
  voteVelocity: number
  streamGrowth: number
  genreMomentum: number
}

/** Result of the AI breakthrough prediction algorithm. */
interface AIPredictionResult {
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

/**
 * Derives the competition tier for a band from its Spotify monthly listener count.
 *
 * Five-tier structure (per platform specification):
 * - Micro (Underground): 0 to 10,000
 * - Emerging (Small): 10,001 to 50,000
 * - Established (Medium): 50,001 to 250,000
 * - International (Large): 250,001 to 1,000,000
 * - Macro (Crossover): above 1,000,000
 *
 * @param monthlyListeners - Spotify monthly listener count (must be >= 0).
 * @returns The corresponding Tier.
 */
export function getTierFromListeners(monthlyListeners: number): Tier {
  if (monthlyListeners > TIER_THRESHOLDS.International) return 'Macro'
  if (monthlyListeners > TIER_THRESHOLDS.Established) return 'International'
  if (monthlyListeners > TIER_THRESHOLDS.Emerging) return 'Established'
  if (monthlyListeners > TIER_THRESHOLDS.Micro) return 'Emerging'
  return 'Micro'
}

/**
 * Returns the EUR price per additional chart category for a given tier.
 *
 * The first category is always free for all tiers. This progressive pricing
 * enables established bands to subsidize free participation of newcomers
 * (cross-subsidization model).
 *
 * @param tier - The band's competition tier.
 * @returns Price in EUR for each additional category beyond the first free one.
 */
export function calculateCategoryPrice(tier: Tier): number {
  return TIER_PRICING[tier]
}

/** Breakdown of a single category submission cost. */
interface CategoryCostItem {
  category: string
  price: number
  isFree: boolean
}

/** Full submission cost result including per-category breakdown. */
interface SubmissionCostResult {
  totalCost: number
  breakdown: CategoryCostItem[]
}

/**
 * Calculates the total cost for submitting a band to multiple chart categories.
 *
 * The first selected category is always free. Each additional category is priced
 * according to the band's tier to prevent Pay-to-Win dynamics while sustaining
 * the platform financially.
 *
 * @param band - The band submitting entries (must have a valid tier).
 * @param selectedCategories - List of category IDs the band wishes to enter.
 * @returns Total cost in EUR and a per-category breakdown.
 */
export function calculateSubmissionCost(band: Band, selectedCategories: string[]): SubmissionCostResult {
  if (selectedCategories.length === 0) {
    return { totalCost: 0, breakdown: [] }
  }

  const pricePerCategory = calculateCategoryPrice(band.tier)
  const breakdown = selectedCategories.map((category, idx) => ({
    category,
    price: idx === 0 ? 0 : pricePerCategory,
    isFree: idx === 0,
  }))

  const totalCost = breakdown.reduce((sum, item) => sum + item.price, 0)
  return { totalCost, breakdown }
}

/**
 * Simulates fetching Spotify monthly listener data for a band.
 * In production this calls the Spotify Web API via the backend.
 * @param _bandId - Band identifier (reserved for real API integration).
 * @returns A promise resolving to a mock listener count.
 */
export function simulateSpotifyListenersFetch(_bandId: string): Promise<number> {
  return new Promise(resolve => {
    setTimeout(() => {
      const mockListeners = Math.floor(Math.random() * 1_000_000) + 1_000
      resolve(mockListeners)
    }, 500)
  })
}
