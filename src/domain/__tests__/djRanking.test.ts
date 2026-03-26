import { describe, it, expect } from 'vitest'
import {
  computeKendallTau,
  computeParticipationRate,
  computeDJRankings,
  type DJParticipation,
  type DJBallotOutcome,
} from '../spotlight/djRanking'

describe('computeKendallTau', () => {
  it('returns 0.5 for insufficient data', () => {
    expect(computeKendallTau(['a'], ['a'])).toBe(0.5)
    expect(computeKendallTau([], [])).toBe(0.5)
  })

  it('returns 1.0 for perfect match', () => {
    const ranking = ['a', 'b', 'c']
    const tau = computeKendallTau(ranking, ranking)
    expect(tau).toBeCloseTo(1.0)
  })

  it('returns 0.0 for perfect reverse match', () => {
    const submitted = ['a', 'b', 'c']
    const final = ['c', 'b', 'a']
    const tau = computeKendallTau(submitted, final)
    expect(tau).toBeCloseTo(0.0)
  })

  it('returns 0.5 for no correlation', () => {
    // a>b in submitted but b>a in final, b>c in submitted and b>c in final: 1 concordant, 1 discordant
    const submitted = ['a', 'b', 'c']
    const final = ['b', 'a', 'c']
    const tau = computeKendallTau(submitted, final)
    expect(tau).toBeGreaterThanOrEqual(0)
    expect(tau).toBeLessThanOrEqual(1)
  })

  it('only considers tracks in both rankings', () => {
    const submitted = ['a', 'b', 'x'] // x not in final
    const final = ['a', 'b', 'c'] // c not in submitted
    const tau = computeKendallTau(submitted, final)
    // Only a and b are shared — perfect order match
    expect(tau).toBeCloseTo(1.0)
  })
})

describe('computeParticipationRate', () => {
  it('returns 0 for totalPeriods = 0', () => {
    const p: DJParticipation = { userId: 'u1', periodsParticipated: 0, totalPeriods: 0 }
    expect(computeParticipationRate(p)).toBe(0)
  })

  it('returns 1.0 for full participation', () => {
    const p: DJParticipation = { userId: 'u1', periodsParticipated: 10, totalPeriods: 10 }
    expect(computeParticipationRate(p)).toBe(1)
  })

  it('returns 0.5 for half participation', () => {
    const p: DJParticipation = { userId: 'u1', periodsParticipated: 5, totalPeriods: 10 }
    expect(computeParticipationRate(p)).toBeCloseTo(0.5)
  })

  it('caps at 1.0 even if periodsParticipated > totalPeriods', () => {
    const p: DJParticipation = { userId: 'u1', periodsParticipated: 15, totalPeriods: 10 }
    expect(computeParticipationRate(p)).toBe(1)
  })
})

describe('computeDJRankings', () => {
  it('returns empty array for empty input', () => {
    expect(computeDJRankings([], [])).toEqual([])
  })

  it('sorts by totalScore descending', () => {
    const outcomes: DJBallotOutcome[] = [
      { userId: 'dj1', submittedRankings: ['a', 'b', 'c'], finalRankings: ['c', 'b', 'a'] }, // low accuracy
      { userId: 'dj2', submittedRankings: ['a', 'b', 'c'], finalRankings: ['a', 'b', 'c'] }, // perfect accuracy
    ]
    const participations: DJParticipation[] = [
      { userId: 'dj1', periodsParticipated: 10, totalPeriods: 10 },
      { userId: 'dj2', periodsParticipated: 10, totalPeriods: 10 },
    ]
    const rankings = computeDJRankings(outcomes, participations)
    expect(rankings[0]!.userId).toBe('dj2')
    expect(rankings[1]!.userId).toBe('dj1')
  })

  it('includes all required fields', () => {
    const outcomes: DJBallotOutcome[] = [
      { userId: 'dj1', submittedRankings: ['a', 'b'], finalRankings: ['a', 'b'] },
    ]
    const rankings = computeDJRankings(outcomes, [])
    expect(rankings[0]).toHaveProperty('userId')
    expect(rankings[0]).toHaveProperty('predictiveAccuracy')
    expect(rankings[0]).toHaveProperty('participationRate')
    expect(rankings[0]).toHaveProperty('totalScore')
  })
})
