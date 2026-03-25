import type { FanVote, DJBallot, BandVote } from './types'

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
