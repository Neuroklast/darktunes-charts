import { describe, it, expect } from 'vitest'
import {
  computeFanImpact,
  type FanVoteEntry,
  type TrackRankingOutcome,
} from '../gamification/fanImpact'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeOutcomes(entries: TrackRankingOutcome[]): Map<string, TrackRankingOutcome> {
  return new Map(entries.map(e => [e.trackId, e]))
}

const singleOutcome: TrackRankingOutcome = {
  trackId: 't1',
  trackTitle: 'Shadows Fall',
  bandName: 'Void Walkers',
  rankBefore: 8,
  rankAfter: 3,
}

const winnerOutcome: TrackRankingOutcome = {
  trackId: 'winner',
  trackTitle: 'Iron Cathedral',
  bandName: 'Cathedral',
  rankBefore: 5,
  rankAfter: 1,
  categoryWon: 'Track of the Month',
}

const newcomerOutcome: TrackRankingOutcome = {
  trackId: 'new-track',
  trackTitle: 'Unknown Signal',
  bandName: 'Cipher',
  rankBefore: null,   // First appearance — early discoverer
  rankAfter: 6,
}

describe('computeFanImpact — basic behaviour', () => {
  it('returns empty summary when no votes are cast', () => {
    const result = computeFanImpact('2026-03', 'März 2026', [], new Map())
    expect(result.tracksVotedFor).toBe(0)
    expect(result.totalCreditsSpent).toBe(0)
    expect(result.impactRecords).toHaveLength(0)
    expect(result.biggestImpact).toBeNull()
    expect(result.earlyDiscoveries).toBe(0)
    expect(result.impactScore).toBe(0)
  })

  it('skips votes for tracks not in outcomes (disqualified / not submitted)', () => {
    const votes: FanVoteEntry[] = [{ trackId: 'ghost-track', creditsSpent: 9 }]
    const result = computeFanImpact('2026-03', 'März 2026', votes, new Map())
    expect(result.tracksVotedFor).toBe(0)
    expect(result.impactRecords).toHaveLength(0)
  })

  it('returns correct period metadata', () => {
    const result = computeFanImpact('2026-03', 'März 2026', [], new Map())
    expect(result.periodId).toBe('2026-03')
    expect(result.periodLabel).toBe('März 2026')
  })
})

describe('computeFanImpact — VoteImpactRecord', () => {
  it('correctly maps a single vote to a VoteImpactRecord', () => {
    const votes: FanVoteEntry[] = [{ trackId: 't1', creditsSpent: 16 }]
    const result = computeFanImpact('2026-03', 'März 2026', votes, makeOutcomes([singleOutcome]))
    expect(result.impactRecords).toHaveLength(1)
    const record = result.impactRecords[0]!
    expect(record.trackId).toBe('t1')
    expect(record.trackTitle).toBe('Shadows Fall')
    expect(record.bandName).toBe('Void Walkers')
    expect(record.creditsSpent).toBe(16)
    expect(record.rankBefore).toBe(8)
    expect(record.rankAfter).toBe(3)
    expect(record.rankChange).toBe(5) // 8 - 3 = +5 positions improved
  })

  it('wasEarlyDiscoverer is false when rankBefore ≤ 10', () => {
    const votes: FanVoteEntry[] = [{ trackId: 't1', creditsSpent: 4 }]
    const result = computeFanImpact('2026-03', 'März 2026', votes, makeOutcomes([singleOutcome]))
    // singleOutcome.rankBefore = 8 ≤ EARLY_DISCOVERER_RANK_THRESHOLD (10) → false
    expect(result.impactRecords[0]!.wasEarlyDiscoverer).toBe(false)
  })

  it('wasEarlyDiscoverer is true when rankBefore is null (first appearance)', () => {
    const votes: FanVoteEntry[] = [{ trackId: 'new-track', creditsSpent: 9 }]
    const result = computeFanImpact('2026-03', 'März 2026', votes, makeOutcomes([newcomerOutcome]))
    expect(result.impactRecords[0]!.wasEarlyDiscoverer).toBe(true)
  })

  it('wasEarlyDiscoverer is true when rankBefore > 10', () => {
    const deepRankOutcome: TrackRankingOutcome = {
      ...singleOutcome,
      trackId: 'deep',
      rankBefore: 15,
      rankAfter: 5,
    }
    const votes: FanVoteEntry[] = [{ trackId: 'deep', creditsSpent: 9 }]
    const result = computeFanImpact('2026-03', 'März 2026', votes, makeOutcomes([deepRankOutcome]))
    expect(result.impactRecords[0]!.wasEarlyDiscoverer).toBe(true)
  })

  it('categoryWon is set when track won a category', () => {
    const votes: FanVoteEntry[] = [{ trackId: 'winner', creditsSpent: 25 }]
    const result = computeFanImpact('2026-03', 'März 2026', votes, makeOutcomes([winnerOutcome]))
    expect(result.impactRecords[0]!.categoryWon).toBe('Track of the Month')
  })

  it('categoryWon is undefined when track did not win a category', () => {
    const votes: FanVoteEntry[] = [{ trackId: 't1', creditsSpent: 4 }]
    const result = computeFanImpact('2026-03', 'März 2026', votes, makeOutcomes([singleOutcome]))
    expect(result.impactRecords[0]!.categoryWon).toBeUndefined()
  })
})

describe('computeFanImpact — aggregated fields', () => {
  const multiVotes: FanVoteEntry[] = [
    { trackId: 't1', creditsSpent: 16 },
    { trackId: 'winner', creditsSpent: 25 },
    { trackId: 'new-track', creditsSpent: 9 },
  ]
  const multiOutcomes = makeOutcomes([singleOutcome, winnerOutcome, newcomerOutcome])

  it('totalCreditsSpent sums all credits across voted tracks', () => {
    const result = computeFanImpact('2026-03', 'März 2026', multiVotes, multiOutcomes)
    expect(result.totalCreditsSpent).toBe(50)
  })

  it('tracksVotedFor counts only tracks present in outcomes', () => {
    const result = computeFanImpact('2026-03', 'März 2026', multiVotes, multiOutcomes)
    expect(result.tracksVotedFor).toBe(3)
  })

  it('earlyDiscoveries counts tracks with null or high rankBefore', () => {
    const result = computeFanImpact('2026-03', 'März 2026', multiVotes, multiOutcomes)
    // newcomerOutcome has rankBefore null → earlyDiscoverer
    expect(result.earlyDiscoveries).toBeGreaterThanOrEqual(1)
  })

  it('categoryWinnersVoted counts tracks that won a category', () => {
    const result = computeFanImpact('2026-03', 'März 2026', multiVotes, multiOutcomes)
    expect(result.categoryWinnersVoted).toBe(1)
  })

  it('biggestImpact is the track with the largest rank improvement', () => {
    const result = computeFanImpact('2026-03', 'März 2026', multiVotes, multiOutcomes)
    // winnerOutcome: rankChange = 5-1 = 4; singleOutcome: 8-3 = 5; newcomerOutcome: null→0
    expect(result.biggestImpact?.trackId).toBe('t1')
  })

  it('biggestImpact is null when no votes map to outcomes', () => {
    const result = computeFanImpact('2026-03', 'März 2026', [], new Map())
    expect(result.biggestImpact).toBeNull()
  })
})

describe('computeFanImpact — impactScore', () => {
  it('impactScore is 0 for empty vote set', () => {
    const result = computeFanImpact('2026-03', 'März 2026', [], new Map())
    expect(result.impactScore).toBe(0)
  })

  it('impactScore is in [0, 100]', () => {
    const votes: FanVoteEntry[] = [
      { trackId: 't1', creditsSpent: 100 },
      { trackId: 'winner', creditsSpent: 100 },
    ]
    const result = computeFanImpact('2026-03', 'März 2026', votes, makeOutcomes([singleOutcome, winnerOutcome]))
    expect(result.impactScore).toBeGreaterThanOrEqual(0)
    expect(result.impactScore).toBeLessThanOrEqual(100)
  })

  it('higher credits spent lead to a higher impactScore', () => {
    const lowVotes: FanVoteEntry[] = [{ trackId: 't1', creditsSpent: 1 }]
    const highVotes: FanVoteEntry[] = [{ trackId: 't1', creditsSpent: 100 }]
    const outcomes = makeOutcomes([singleOutcome])
    const low = computeFanImpact('2026-03', 'März 2026', lowVotes, outcomes)
    const high = computeFanImpact('2026-03', 'März 2026', highVotes, outcomes)
    expect(high.impactScore).toBeGreaterThan(low.impactScore)
  })

  it('voting for a category winner increases impactScore', () => {
    const withoutWinner: FanVoteEntry[] = [{ trackId: 't1', creditsSpent: 25 }]
    const withWinner: FanVoteEntry[] = [{ trackId: 'winner', creditsSpent: 25 }]
    const noWin = computeFanImpact('2026-03', 'März 2026', withoutWinner, makeOutcomes([singleOutcome]))
    const win = computeFanImpact('2026-03', 'März 2026', withWinner, makeOutcomes([winnerOutcome]))
    expect(win.impactScore).toBeGreaterThan(noWin.impactScore)
  })
})
