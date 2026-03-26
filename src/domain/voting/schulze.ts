import type { DJBallot } from '@/lib/types'

/** Structured result from a full Schulze method calculation. */
export interface SchulzeResult {
  /** Candidate IDs sorted from strongest (index 0) to weakest Schulze winner. */
  rankings: string[]
  /** d[i][j] = number of ballots preferring candidate i over candidate j. */
  pairwiseMatrix: number[][]
  /** p[i][j] = strength of the strongest beatpath from i to j (Floyd-Warshall). */
  strongestPathMatrix: number[][]
  /** Ordered candidate ID list used as row/column index in both matrices. */
  candidates: string[]
}

/** A single DJ's ranked-choice ballot for input to the Schulze method. */
export interface BallotRanking {
  djId: string
  rankings: string[]
}

/**
 * Implements the Schulze (Beatpath) Condorcet method for DJ ranked-choice ballots.
 *
 * Algorithm:
 * 1. Build a pairwise preference matrix d[i][j] from all ballots.
 * 2. Compute the strongest-path matrix p[i][j] using Floyd-Warshall on the
 *    (min, max)-semiring: p[j][k] = max(p[j][k], min(p[j][i], p[i][k])).
 * 3. Rank candidates by the number of opponents they defeat via their strongest path.
 *
 * Time complexity: O(n³) — not suitable for synchronous API routes with large n.
 * For n ≤ 100 nominees (typical chart cycle) latency is negligible.
 *
 * Eliminates strategic burial (a fatal flaw of Borda Count used in Eurovision).
 * DJs cannot improve their preferred candidate's chances by tactically lowering others.
 *
 * @param candidates - Full list of candidate IDs eligible in this category.
 * @param ballots - DJ ballots each containing an ordered ranking of candidate IDs.
 * @returns Full Schulze result including ranked winners and both matrices for transparency.
 */
export function calculateSchulzeMethod(
  candidates: string[],
  ballots: BallotRanking[]
): SchulzeResult {
  const n = candidates.length

  const candidateIndexMap = new Map<string, number>()
  candidates.forEach((id, idx) => candidateIndexMap.set(id, idx))

  const pairwiseMatrix: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0))

  for (const ballot of ballots) {
    const validRankings = ballot.rankings.filter(id => candidateIndexMap.has(id))

    for (let i = 0; i < validRankings.length; i++) {
      for (let j = i + 1; j < validRankings.length; j++) {
        const upperIdx = candidateIndexMap.get(validRankings[i])!
        const lowerIdx = candidateIndexMap.get(validRankings[j])!
        pairwiseMatrix[upperIdx][lowerIdx]++
      }
    }
  }

  const strongestPathMatrix: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        strongestPathMatrix[i][j] =
          pairwiseMatrix[i][j] > pairwiseMatrix[j][i] ? pairwiseMatrix[i][j] : 0
      }
    }
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        for (let k = 0; k < n; k++) {
          if (i !== k && j !== k) {
            strongestPathMatrix[j][k] = Math.max(
              strongestPathMatrix[j][k],
              Math.min(strongestPathMatrix[j][i], strongestPathMatrix[i][k])
            )
          }
        }
      }
    }
  }

  const candidateScores = candidates.map((id, idx) => {
    let wins = 0
    for (let j = 0; j < n; j++) {
      if (idx !== j && strongestPathMatrix[idx][j] > strongestPathMatrix[j][idx]) {
        wins++
      }
    }
    return { id, idx, wins }
  })

  candidateScores.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    // Tiebreak: compare direct strongest-path strengths
    return strongestPathMatrix[b.idx][a.idx] - strongestPathMatrix[a.idx][b.idx]
  })

  return {
    rankings: candidateScores.map(c => c.id),
    pairwiseMatrix,
    strongestPathMatrix,
    candidates,
  }
}

/**
 * Simplified Schulze wrapper that accepts the legacy `DJBallot` type (no djId).
 *
 * @param ballots - DJ ballots using the DJBallot interface.
 * @param candidateIds - Eligible candidate IDs.
 * @returns Candidate IDs sorted from strongest to weakest Schulze winner.
 */
export function calculateSchulzeWinner(ballots: DJBallot[], candidateIds: string[]): string[] {
  const n = candidateIds.length
  if (n === 0) return []
  if (n === 1) return candidateIds

  const d: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0))

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

  const p: number[][] = Array.from({ length: n }, () => Array<number>(n).fill(0))

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

  const candidateScores = candidateIds.map((id, idx) => {
    let score = 0
    for (let j = 0; j < n; j++) {
      if (idx !== j && p[idx][j] > p[j][idx]) {
        score++
      }
    }
    return { id, score }
  })

  candidateScores.sort((a, b) => b.score - a.score)
  return candidateScores.map(s => s.id)
}

/**
 * Extracts a pairwise head-to-head comparison between two candidates from a Schulze result.
 *
 * Useful for the Transparency page where users can verify individual matchups.
 *
 * @param result - Previously computed SchulzeResult.
 * @param candidateA - ID of the first candidate.
 * @param candidateB - ID of the second candidate.
 * @returns Raw ballot counts favouring each candidate and the head-to-head winner.
 */
export function getPairwiseComparison(
  result: SchulzeResult,
  candidateA: string,
  candidateB: string
): { aWins: number; bWins: number; winner: string | null } {
  const aIdx = result.candidates.indexOf(candidateA)
  const bIdx = result.candidates.indexOf(candidateB)

  if (aIdx === -1 || bIdx === -1) {
    return { aWins: 0, bWins: 0, winner: null }
  }

  const aWins = result.pairwiseMatrix[aIdx][bIdx]
  const bWins = result.pairwiseMatrix[bIdx][aIdx]

  let winner: string | null = null
  if (aWins > bWins) winner = candidateA
  else if (bWins > aWins) winner = candidateB

  return { aWins, bWins, winner }
}
