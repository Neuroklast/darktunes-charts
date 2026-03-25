export interface SchulzeResult {
  rankings: string[]
  pairwiseMatrix: number[][]
  strongestPathMatrix: number[][]
  candidates: string[]
}

export interface BallotRanking {
  djId: string
  rankings: string[]
}

export function calculateSchulzeMethod(
  candidates: string[],
  ballots: BallotRanking[]
): SchulzeResult {
  const n = candidates.length
  
  const candidateIndexMap = new Map<string, number>()
  candidates.forEach((id, idx) => candidateIndexMap.set(id, idx))
  
  const pairwiseMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0))
  
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
  
  const strongestPathMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0))
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        if (pairwiseMatrix[i][j] > pairwiseMatrix[j][i]) {
          strongestPathMatrix[i][j] = pairwiseMatrix[i][j]
        } else {
          strongestPathMatrix[i][j] = 0
        }
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
  
  const candidateScores: Array<{ id: string; idx: number; wins: number }> = candidates.map((id, idx) => {
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
    
    const aBeatsB = strongestPathMatrix[a.idx][b.idx]
    const bBeatsA = strongestPathMatrix[b.idx][a.idx]
    return bBeatsA - aBeatsB
  })
  
  return {
    rankings: candidateScores.map(c => c.id),
    pairwiseMatrix,
    strongestPathMatrix,
    candidates
  }
}

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
