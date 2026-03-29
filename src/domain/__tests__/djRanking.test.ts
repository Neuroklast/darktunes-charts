import { describe, it, expect } from 'vitest'
import {
  computeKendallTau,
  computeBallotCoverage,
  computeAdjustedAccuracy,
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
      { userId: 'dj1', submittedRankings: ['a', 'b', 'c'], finalRankings: ['c', 'b', 'a'], totalEligibleTracks: 3 }, // low accuracy
      { userId: 'dj2', submittedRankings: ['a', 'b', 'c'], finalRankings: ['a', 'b', 'c'], totalEligibleTracks: 3 }, // perfect accuracy
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
      { userId: 'dj1', submittedRankings: ['a', 'b'], finalRankings: ['a', 'b'], totalEligibleTracks: 2 },
    ]
    const rankings = computeDJRankings(outcomes, [])
    expect(rankings[0]).toHaveProperty('userId')
    expect(rankings[0]).toHaveProperty('predictiveAccuracy')
    expect(rankings[0]).toHaveProperty('ballotCoverage')
    expect(rankings[0]).toHaveProperty('participationRate')
    expect(rankings[0]).toHaveProperty('totalScore')
  })
})

describe('computeBallotCoverage', () => {
  it('returns 0 when no tracks are eligible', () => {
    expect(computeBallotCoverage(0, 0)).toBe(0)
  })

  it('returns 1.0 when DJ ranks all eligible tracks', () => {
    expect(computeBallotCoverage(10, 10)).toBe(1)
  })

  it('returns 0.5 for half coverage', () => {
    expect(computeBallotCoverage(5, 10)).toBeCloseTo(0.5)
  })

  it('returns 0.2 for 2 out of 10 tracks', () => {
    expect(computeBallotCoverage(2, 10)).toBeCloseTo(0.2)
  })

  it('caps at 1.0 when submitted exceeds eligible', () => {
    expect(computeBallotCoverage(12, 10)).toBe(1)
  })
})

describe('computeAdjustedAccuracy', () => {
  it('does not penalise full coverage (100 %)', () => {
    const adjusted = computeAdjustedAccuracy(0.8, 1.0)
    expect(adjusted).toBeCloseTo(0.8)
  })

  it('does not penalise 50 % coverage (threshold boundary)', () => {
    const adjusted = computeAdjustedAccuracy(0.8, 0.5)
    expect(adjusted).toBeCloseTo(0.8)
  })

  it('applies proportional penalty below 50 % coverage', () => {
    // 20 % coverage → multiplier = 0.2 / 0.5 = 0.4
    const adjusted = computeAdjustedAccuracy(1.0, 0.2)
    expect(adjusted).toBeCloseTo(0.4)
  })

  it('returns 0 for zero coverage', () => {
    expect(computeAdjustedAccuracy(1.0, 0)).toBe(0)
  })

  it('applies penalty to the neutral score for minimal ballots', () => {
    // rawAccuracy = 0.5 (neutral), coverage = 0.1 → multiplier = 0.1/0.5 = 0.2
    const adjusted = computeAdjustedAccuracy(0.5, 0.1)
    expect(adjusted).toBeCloseTo(0.1)
  })
})

describe('ballot coverage integration in computeDJRankings', () => {
  it('does not penalise DJ ranking all tracks', () => {
    const outcomes: DJBallotOutcome[] = [
      { userId: 'dj1', submittedRankings: ['a', 'b', 'c'], finalRankings: ['a', 'b', 'c'], totalEligibleTracks: 3 },
    ]
    const participations: DJParticipation[] = [
      { userId: 'dj1', periodsParticipated: 10, totalPeriods: 10 },
    ]
    const [result] = computeDJRankings(outcomes, participations)
    // Full coverage → no penalty, perfect accuracy
    expect(result!.ballotCoverage).toBeCloseTo(1.0)
    expect(result!.predictiveAccuracy).toBeCloseTo(1.0)
  })

  it('penalises DJ ranking only 2 out of 10 tracks', () => {
    const outcomes: DJBallotOutcome[] = [
      { userId: 'dj1', submittedRankings: ['a', 'b'], finalRankings: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], totalEligibleTracks: 10 },
    ]
    const participations: DJParticipation[] = [
      { userId: 'dj1', periodsParticipated: 10, totalPeriods: 10 },
    ]
    const [result] = computeDJRankings(outcomes, participations)
    // coverage = 2/10 = 0.2, multiplier = 0.2/0.5 = 0.4
    // raw tau for perfect 2-track match = 1.0
    // adjusted = 1.0 × 0.4 = 0.4
    expect(result!.ballotCoverage).toBeCloseTo(0.2)
    expect(result!.predictiveAccuracy).toBeCloseTo(0.4)
  })

  it('does not penalise DJ ranking 50 % of tracks', () => {
    const outcomes: DJBallotOutcome[] = [
      { userId: 'dj1', submittedRankings: ['a', 'b', 'c', 'd', 'e'], finalRankings: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], totalEligibleTracks: 10 },
    ]
    const participations: DJParticipation[] = [
      { userId: 'dj1', periodsParticipated: 10, totalPeriods: 10 },
    ]
    const [result] = computeDJRankings(outcomes, participations)
    // coverage = 5/10 = 0.5, multiplier = 0.5/0.5 = 1.0 → no penalty
    expect(result!.ballotCoverage).toBeCloseTo(0.5)
    // Perfect match for the 5 shared tracks → raw tau = 1.0, adjusted = 1.0
    expect(result!.predictiveAccuracy).toBeCloseTo(1.0)
  })

  it('ranks full-coverage DJ higher than minimal-ballot DJ with equal raw accuracy', () => {
    const outcomes: DJBallotOutcome[] = [
      { userId: 'dj-minimal', submittedRankings: ['a', 'b'], finalRankings: ['a', 'b', 'c', 'd', 'e'], totalEligibleTracks: 5 },
      { userId: 'dj-full', submittedRankings: ['a', 'b', 'c', 'd', 'e'], finalRankings: ['a', 'b', 'c', 'd', 'e'], totalEligibleTracks: 5 },
    ]
    const participations: DJParticipation[] = [
      { userId: 'dj-minimal', periodsParticipated: 10, totalPeriods: 10 },
      { userId: 'dj-full', periodsParticipated: 10, totalPeriods: 10 },
    ]
    const rankings = computeDJRankings(outcomes, participations)
    expect(rankings[0]!.userId).toBe('dj-full')
    expect(rankings[1]!.userId).toBe('dj-minimal')
    expect(rankings[0]!.totalScore).toBeGreaterThan(rankings[1]!.totalScore)
  })
})
