import type { FanVote, DJBallot, BandVote, TransparencyLogEntry, BotDetectionAlert, Band, Tier, CategoryPricing } from './types'

export function calculateQuadraticCost(votes: number): number {
  return votes * votes
}

export function calculateMaxVotesForCredits(credits: number): number {
  return Math.floor(Math.sqrt(credits))
}

export function validateFanVotes(votes: FanVote[]): { valid: boolean; totalCredits: number } {
  const totalCredits = votes.reduce((sum, vote) => sum + calculateQuadraticCost(vote.votes), 0)
  return {
    valid: totalCredits <= 100,
    totalCredits
  }
}

export function calculateSchulzeWinner(ballots: DJBallot[], candidateIds: string[]): string[] {
  const n = candidateIds.length
  if (n === 0) return []
  if (n === 1) return candidateIds

  const d: number[][] = Array(n).fill(0).map(() => Array(n).fill(0))

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

  const p: number[][] = Array(n).fill(0).map(() => Array(n).fill(0))
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        if (d[i][j] > d[j][i]) {
          p[i][j] = d[i][j]
        } else {
          p[i][j] = 0
        }
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

export function calculateCliqueCoefficient(
  voterId: string,
  votedForId: string,
  allBandVotes: Map<string, string[]>
): number {
  const voterVotedFor = allBandVotes.get(voterId) || []
  const votedForVotedFor = allBandVotes.get(votedForId) || []

  const reciprocalVote = votedForVotedFor.includes(voterId)
  
  if (!reciprocalVote) {
    return 1.0
  }

  const mutualConnections = voterVotedFor.filter(id => votedForVotedFor.includes(id)).length
  
  const cliqueFactor = Math.min(mutualConnections * 0.15, 0.6)
  
  return Math.max(1.0 - cliqueFactor, 0.4)
}

export function applyCliqueWeighting(votes: BandVote[], allBandVotes: Map<string, string[]>): BandVote[] {
  return votes.map(vote => ({
    ...vote,
    weight: vote.weight
  }))
}

export function generateAIPrediction(
  bandId: string,
  historicalVotes: { timestamp: number; votes: number }[],
  currentListeners: number,
  previousListeners: number,
  genreAvgGrowth: number
): { confidenceScore: number; predictedBreakthrough: boolean; factors: any } {
  const recentVotes = historicalVotes.filter(v => v.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000)
  const voteVelocity = recentVotes.length > 1
    ? (recentVotes[recentVotes.length - 1].votes - recentVotes[0].votes) / recentVotes.length
    : 0

  const streamGrowth = previousListeners > 0
    ? ((currentListeners - previousListeners) / previousListeners) * 100
    : 0

  const genreMomentum = genreAvgGrowth > 0 ? streamGrowth / genreAvgGrowth : 1

  const voteScore = Math.min(voteVelocity / 10, 1) * 0.4
  const streamScore = Math.min(streamGrowth / 50, 1) * 0.4
  const genreScore = Math.min(genreMomentum, 1) * 0.2

  const confidenceScore = Math.min((voteScore + streamScore + genreScore) * 100, 95)

  return {
    confidenceScore: Math.round(confidenceScore),
    predictedBreakthrough: confidenceScore > 65,
    factors: {
      voteVelocity: Math.round(voteVelocity * 10) / 10,
      streamGrowth: Math.round(streamGrowth * 10) / 10,
      genreMomentum: Math.round(genreMomentum * 100) / 100
    }
  }
}

export function getTierFromListeners(monthlyListeners: number): Tier {
  if (monthlyListeners > 1000000) return 'Macro'
  if (monthlyListeners > 250000) return 'Established'
  if (monthlyListeners > 50000) return 'Emerging'
  return 'Micro'
}

export function calculateCategoryPrice(tier: Tier): number {
  const pricing: Record<Tier, number> = {
    'Micro': 5,
    'Emerging': 15,
    'Established': 35,
    'Macro': 150
  }
  return pricing[tier]
}

export function calculateSubmissionCost(
  band: Band,
  selectedCategories: string[]
): { totalCost: number; breakdown: { category: string; price: number; isFree: boolean }[] } {
  if (selectedCategories.length === 0) {
    return { totalCost: 0, breakdown: [] }
  }

  const pricePerCategory = calculateCategoryPrice(band.tier)
  const breakdown = selectedCategories.map((category, idx) => ({
    category,
    price: idx === 0 ? 0 : pricePerCategory,
    isFree: idx === 0
  }))

  const totalCost = breakdown.reduce((sum, item) => sum + item.price, 0)

  return { totalCost, breakdown }
}

export function simulateSpotifyListenersFetch(bandId: string): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockListeners = Math.floor(Math.random() * 1000000) + 1000
      resolve(mockListeners)
    }, 500)
  })
}

export function createTransparencyLogEntry(
  trackId: string,
  userId: string,
  voteType: 'fan' | 'dj' | 'peer',
  rawVotes: number,
  creditsSpent: number | undefined,
  weight: number,
  reason?: string
): TransparencyLogEntry {
  const finalContribution = rawVotes * weight

  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    trackId,
    userId,
    voteType,
    rawVotes,
    creditsSpent,
    weight,
    finalContribution,
    reason
  }
}

export function detectBotActivity(
  trackId: string,
  bandId: string,
  voteEvents: Array<{ timestamp: number; userId: string; ip?: string; accountAge?: number }>
): BotDetectionAlert | null {
  const now = Date.now()
  const oneMinute = 60 * 1000
  const recentVotes = voteEvents.filter(v => now - v.timestamp < oneMinute)

  if (recentVotes.length >= 100) {
    const newAccounts = recentVotes.filter(v => 
      v.accountAge && v.accountAge < 7 * 24 * 60 * 60 * 1000
    )
    const newAccountRatio = newAccounts.length / recentVotes.length

    const uniqueIPs = new Set(recentVotes.map(v => v.ip).filter(Boolean))
    const suspiciousIPs = recentVotes
      .filter(v => v.ip)
      .map(v => v.ip!)
      .filter((ip, _, arr) => arr.filter(i => i === ip).length > 5)

    let severity: 'low' | 'medium' | 'high' = 'low'
    if (newAccountRatio > 0.7 && suspiciousIPs.length > 3) {
      severity = 'high'
    } else if (newAccountRatio > 0.5 || suspiciousIPs.length > 2) {
      severity = 'medium'
    }

    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      trackId,
      bandId,
      alertType: 'velocity',
      severity,
      details: {
        votesCount: recentVotes.length,
        timeWindow: oneMinute,
        suspiciousIPs: Array.from(new Set(suspiciousIPs)),
        newAccountRatio
      },
      status: 'flagged'
    }
  }

  return null
}

export function quarantineVotes(
  alert: BotDetectionAlert,
  allVotes: TransparencyLogEntry[]
): { quarantined: TransparencyLogEntry[]; clean: TransparencyLogEntry[] } {
  const quarantinedVotes = allVotes.filter(
    v => v.trackId === alert.trackId && 
         v.timestamp > alert.timestamp - alert.details.timeWindow
  )

  const cleanVotes = allVotes.filter(
    v => !quarantinedVotes.some(qv => qv.id === v.id)
  )

  return {
    quarantined: quarantinedVotes,
    clean: cleanVotes
  }
}
