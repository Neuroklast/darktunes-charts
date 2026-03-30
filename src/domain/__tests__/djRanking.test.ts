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

// ---------------------------------------------------------------------------
// Ballot Coverage (Issue #56)
// ---------------------------------------------------------------------------

describe('computeBallotCoverage', () => {
  it('returns 1 when all tracks are ranked', () => {
    expect(computeBallotCoverage(10, 10)).toBe(1)
  })

  it('returns 0.5 when half the tracks are ranked', () => {
    expect(computeBallotCoverage(5, 10)).toBeCloseTo(0.5)
  })

  it('returns 0 when no tracks are ranked', () => {
    expect(computeBallotCoverage(0, 10)).toBe(0)
  })

  it('returns 1 when totalEligible is 0 (no penalty)', () => {
    expect(computeBallotCoverage(0, 0)).toBe(1)
  })

  it('clamps to 1 when rankedCount exceeds totalEligible', () => {
    expect(computeBallotCoverage(15, 10)).toBe(1)
  })

  it('returns correct ratio for 2 of 20 tracks', () => {
    expect(computeBallotCoverage(2, 20)).toBeCloseTo(0.1)
  })
})

describe('computeAdjustedAccuracy', () => {
  it('returns full accuracy when coverage ≥ 50%', () => {
    expect(computeAdjustedAccuracy(0.8, 0.5)).toBeCloseTo(0.8)
    expect(computeAdjustedAccuracy(0.8, 0.75)).toBeCloseTo(0.8)
    expect(computeAdjustedAccuracy(0.8, 1.0)).toBeCloseTo(0.8)
  })

  it('scales down accuracy for coverage below 50%', () => {
    // 25% coverage → factor = 0.25 / 0.5 = 0.5; adjusted = 0.8 × 0.5 = 0.4
    expect(computeAdjustedAccuracy(0.8, 0.25)).toBeCloseTo(0.4)
  })

  it('returns 0 when coverage is 0', () => {
    expect(computeAdjustedAccuracy(0.8, 0)).toBe(0)
  })

  it('returns 0 when raw accuracy is 0', () => {
    expect(computeAdjustedAccuracy(0, 1.0)).toBe(0)
  })

  it('penalty scales linearly between 0% and 50% coverage', () => {
    const raw = 1.0
    const at10 = computeAdjustedAccuracy(raw, 0.1)  // factor 0.2
    const at20 = computeAdjustedAccuracy(raw, 0.2)  // factor 0.4
    const at30 = computeAdjustedAccuracy(raw, 0.3)  // factor 0.6
    expect(at20 - at10).toBeCloseTo(at30 - at20)
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

  it('includes all required fields including ballotCoverage', () => {
    const outcomes: DJBallotOutcome[] = [
      { userId: 'dj1', submittedRankings: ['a', 'b'], finalRankings: ['a', 'b'] },
    ]
    const rankings = computeDJRankings(outcomes, [])
    expect(rankings[0]).toHaveProperty('userId')
    expect(rankings[0]).toHaveProperty('predictiveAccuracy')
    expect(rankings[0]).toHaveProperty('ballotCoverage')
    expect(rankings[0]).toHaveProperty('participationRate')
    expect(rankings[0]).toHaveProperty('totalScore')
  })

  it('penalises DJs who rank very few tracks', () => {
    const finalChart = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

    const outcomes: DJBallotOutcome[] = [
      // DJ1 ranks all 10 tracks perfectly — full coverage, full accuracy
      { userId: 'dj1', submittedRankings: [...finalChart], finalRankings: [...finalChart] },
      // DJ2 ranks only 2 of 10 tracks (20% coverage) — penalty applies
      { userId: 'dj2', submittedRankings: ['a', 'b'], finalRankings: [...finalChart] },
    ]
    const participations: DJParticipation[] = [
      { userId: 'dj1', periodsParticipated: 10, totalPeriods: 10 },
      { userId: 'dj2', periodsParticipated: 10, totalPeriods: 10 },
    ]

    const rankings = computeDJRankings(outcomes, participations)
    const dj1 = rankings.find(r => r.userId === 'dj1')!
    const dj2 = rankings.find(r => r.userId === 'dj2')!

    expect(dj1.ballotCoverage).toBe(1.0)
    expect(dj2.ballotCoverage).toBeCloseTo(0.2)
    // DJ1 should score higher even though DJ2's raw Kendall tau is 1.0 for the 2 shared tracks
    expect(dj1.totalScore).toBeGreaterThan(dj2.totalScore)
  })

  it('does not penalise DJs who rank ≥50% of tracks', () => {
    const finalChart = ['a', 'b', 'c', 'd']

    const outcomes: DJBallotOutcome[] = [
      // DJ ranks 2 of 4 tracks (50% coverage) — exactly at threshold
      { userId: 'dj1', submittedRankings: ['a', 'b'], finalRankings: [...finalChart] },
    ]
    const participations: DJParticipation[] = [
      { userId: 'dj1', periodsParticipated: 10, totalPeriods: 10 },
    ]

    const rankings = computeDJRankings(outcomes, participations)
    const dj1 = rankings[0]!
    expect(dj1.ballotCoverage).toBeCloseTo(0.5)
    // At exactly 50% coverage the factor is min(0.5/0.5, 1) = 1 → no penalty
    const rawTau = 1.0 // 'a','b' match perfectly
    expect(dj1.predictiveAccuracy).toBeCloseTo(rawTau)
  })
})
