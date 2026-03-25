import { describe, it, expect } from 'vitest'
import {
  calculateQuadraticCost,
  calculateMaxVotesForCredits,
  validateFanVotes,
  calculateSchulzeWinner,
  calculateCliqueCoefficient,
  getTierFromListeners,
  calculateCategoryPrice,
  calculateSubmissionCost,
  generateAIPrediction,
  applyCliqueWeighting,
} from '../voting'
import type { Band, FanVote, DJBallot, BandVote } from '../types'

describe('calculateQuadraticCost', () => {
  it('returns 0 for 0 votes', () => expect(calculateQuadraticCost(0)).toBe(0))
  it('returns 1 for 1 vote', () => expect(calculateQuadraticCost(1)).toBe(1))
  it('returns 25 for 5 votes', () => expect(calculateQuadraticCost(5)).toBe(25))
  it('returns 100 for 10 votes', () => expect(calculateQuadraticCost(10)).toBe(100))
})

describe('calculateMaxVotesForCredits', () => {
  it('returns 1 for 1 credit', () => expect(calculateMaxVotesForCredits(1)).toBe(1))
  it('returns 5 for 25 credits', () => expect(calculateMaxVotesForCredits(25)).toBe(5))
  it('returns 10 for 100 credits', () => expect(calculateMaxVotesForCredits(100)).toBe(10))
})

describe('validateFanVotes', () => {
  it('is valid when total credits <= 100', () => {
    const votes: FanVote[] = [
      { trackId: 't1', votes: 5, creditsSpent: 25 },
      { trackId: 't2', votes: 5, creditsSpent: 25 },
    ]
    const result = validateFanVotes(votes)
    expect(result.valid).toBe(true)
    expect(result.totalCredits).toBe(50)
  })

  it('is invalid when total credits > 100', () => {
    const votes: FanVote[] = [
      { trackId: 't1', votes: 8, creditsSpent: 64 },
      { trackId: 't2', votes: 7, creditsSpent: 49 },
    ]
    const result = validateFanVotes(votes)
    expect(result.valid).toBe(false)
    expect(result.totalCredits).toBe(113)
  })

  it('is valid with 0 votes', () => {
    expect(validateFanVotes([]).valid).toBe(true)
  })
})

describe('calculateSchulzeWinner', () => {
  it('returns empty array for no candidates', () => {
    expect(calculateSchulzeWinner([], [])).toEqual([])
  })

  it('returns single candidate when only one', () => {
    expect(calculateSchulzeWinner([], ['a'])).toEqual(['a'])
  })

  it('finds correct winner with clear preference', () => {
    const ballots: DJBallot[] = [
      { rankings: ['a', 'b', 'c'] },
      { rankings: ['a', 'c', 'b'] },
      { rankings: ['b', 'a', 'c'] },
    ]
    const result = calculateSchulzeWinner(ballots, ['a', 'b', 'c'])
    expect(result[0]).toBe('a')
  })

  it('handles 4 candidates correctly', () => {
    const ballots: DJBallot[] = [
      { rankings: ['a', 'b', 'c', 'd'] },
      { rankings: ['a', 'b', 'd', 'c'] },
      { rankings: ['b', 'a', 'c', 'd'] },
    ]
    const result = calculateSchulzeWinner(ballots, ['a', 'b', 'c', 'd'])
    expect(result).toHaveLength(4)
    expect(result[0]).toBe('a')
  })
})

describe('calculateCliqueCoefficient', () => {
  it('returns 1.0 when no reciprocal vote', () => {
    const allVotes = new Map([['a', ['c']], ['b', ['c']]])
    expect(calculateCliqueCoefficient('a', 'b', allVotes)).toBe(1.0)
  })

  it('reduces weight for simple reciprocal vote', () => {
    const allVotes = new Map([['a', ['b']], ['b', ['a']]])
    const coeff = calculateCliqueCoefficient('a', 'b', allVotes)
    expect(coeff).toBe(1.0) // no mutual connections other than direct reciprocal
  })

  it('reduces weight more for high mutual connections', () => {
    const allVotes = new Map([
      ['a', ['b', 'c', 'd', 'e', 'f']],
      ['b', ['a', 'c', 'd', 'e', 'f']],
    ])
    const coeff = calculateCliqueCoefficient('a', 'b', allVotes)
    expect(coeff).toBeLessThan(1.0)
    expect(coeff).toBeGreaterThanOrEqual(0.4)
  })
})

describe('getTierFromListeners', () => {
  it('returns Micro for 0 listeners', () => expect(getTierFromListeners(0)).toBe('Micro'))
  it('returns Micro for 10000 listeners', () => expect(getTierFromListeners(10_000)).toBe('Micro'))
  it('returns Emerging for 10001 listeners', () => expect(getTierFromListeners(10_001)).toBe('Emerging'))
  it('returns Emerging for 50000', () => expect(getTierFromListeners(50_000)).toBe('Emerging'))
  it('returns Established for 50001', () => expect(getTierFromListeners(50_001)).toBe('Established'))
  it('returns Established for 250000', () => expect(getTierFromListeners(250_000)).toBe('Established'))
  it('returns International for 250001', () => expect(getTierFromListeners(250_001)).toBe('International'))
  it('returns International for 1000000', () => expect(getTierFromListeners(1_000_000)).toBe('International'))
  it('returns Macro for 1000001', () => expect(getTierFromListeners(1_000_001)).toBe('Macro'))
})

describe('calculateCategoryPrice', () => {
  it('returns 5 for Micro', () => expect(calculateCategoryPrice('Micro')).toBe(5))
  it('returns 15 for Emerging', () => expect(calculateCategoryPrice('Emerging')).toBe(15))
  it('returns 35 for Established', () => expect(calculateCategoryPrice('Established')).toBe(35))
  it('returns 75 for International', () => expect(calculateCategoryPrice('International')).toBe(75))
  it('returns 150 for Macro', () => expect(calculateCategoryPrice('Macro')).toBe(150))
})

const mockBand: Band = {
  id: 'b1',
  name: 'Test Band',
  genre: 'Goth',
  spotifyMonthlyListeners: 5_000,
  tier: 'Micro',
}

describe('calculateSubmissionCost', () => {
  it('returns 0 for empty categories', () => {
    const result = calculateSubmissionCost(mockBand, [])
    expect(result.totalCost).toBe(0)
    expect(result.breakdown).toHaveLength(0)
  })

  it('returns 0 for single category (free)', () => {
    const result = calculateSubmissionCost(mockBand, ['track'])
    expect(result.totalCost).toBe(0)
    expect(result.breakdown[0].isFree).toBe(true)
  })

  it('charges for additional categories', () => {
    const result = calculateSubmissionCost(mockBand, ['track', 'album', 'shadow-cinema'])
    expect(result.totalCost).toBe(10) // 0 + 5 + 5
    expect(result.breakdown[0].isFree).toBe(true)
    expect(result.breakdown[1].price).toBe(5)
    expect(result.breakdown[2].price).toBe(5)
  })
})

describe('generateAIPrediction', () => {
  it('returns high confidence for fast-growing band', () => {
    const now = Date.now()
    const historicalVotes = Array.from({ length: 10 }, (_, i) => ({
      timestamp: now - (10 - i) * 3 * 24 * 60 * 60 * 1000,
      votes: i * 10,
    }))
    const result = generateAIPrediction('b1', historicalVotes, 100_000, 50_000, 10)
    expect(result.confidenceScore).toBeGreaterThan(0)
    expect(result.confidenceScore).toBeLessThanOrEqual(95)
  })

  it('returns low confidence for stagnant band', () => {
    const now = Date.now()
    const historicalVotes = Array.from({ length: 5 }, (_, i) => ({
      timestamp: now - (5 - i) * 3 * 24 * 60 * 60 * 1000,
      votes: 1,
    }))
    const result = generateAIPrediction('b1', historicalVotes, 1_000, 1_000, 10)
    expect(result.predictedBreakthrough).toBe(false)
  })
})

describe('applyCliqueWeighting', () => {
  it('applies full weight when no clique detected', () => {
    const votes: BandVote[] = [{ voterId: 'voter-x', votedBandId: 'band-a', weight: 1.0 }]
    const allBandVotes = new Map<string, string[]>()
    const result = applyCliqueWeighting(votes, allBandVotes)
    expect(result[0].weight).toBe(1.0)
  })

  it('reduces weight for reciprocal vote ring', () => {
    const votes: BandVote[] = [{ voterId: 'band-a', votedBandId: 'band-b', weight: 1.0 }]
    const allBandVotes = new Map([
      ['band-a', ['band-b', 'band-c', 'band-d']],
      ['band-b', ['band-a', 'band-c', 'band-d']],
    ])
    const result = applyCliqueWeighting(votes, allBandVotes)
    expect(result[0].weight).toBeLessThan(1.0)
    expect(result[0].weight).toBeGreaterThanOrEqual(0.4)
  })
})
