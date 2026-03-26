import { describe, it, expect } from 'vitest'
import { analyzeVotingPatterns, type VoteRecord } from '@/domain/security/botDetection'
import { calculateSuspicionScore, shannonEntropy } from '@/domain/security/fingerprintAnalysis'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeVote(overrides: Partial<VoteRecord> = {}): VoteRecord {
  return {
    voterId: 'voter-1',
    ipAddress: '192.168.1.1',
    timestamp: Date.now(),
    ballotHash: 'abc123',
    accountCreatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// analyzeVotingPatterns
// ---------------------------------------------------------------------------
describe('analyzeVotingPatterns', () => {
  it('returns empty array for empty input', () => {
    expect(analyzeVotingPatterns([])).toEqual([])
  })

  it('detects burst voting from a single IP', () => {
    const now = Date.now()
    const votes: VoteRecord[] = Array.from({ length: 15 }, (_, i) =>
      makeVote({ voterId: `voter-${i}`, timestamp: now + i * 1000 }) // 1 vote/sec for 15 seconds
    )
    const alerts = analyzeVotingPatterns(votes)
    const burst = alerts.find((a) => a.type === 'BURST_VOTING')
    expect(burst).toBeDefined()
    expect(['high', 'critical']).toContain(burst!.severity)
  })

  it('does NOT flag burst voting below threshold', () => {
    const now = Date.now()
    const votes: VoteRecord[] = Array.from({ length: 5 }, (_, i) =>
      makeVote({ voterId: `voter-${i}`, timestamp: now + i * 60_000 }) // 1/min — spread out
    )
    const alerts = analyzeVotingPatterns(votes)
    expect(alerts.find((a) => a.type === 'BURST_VOTING')).toBeUndefined()
  })

  it('detects identical ballots from multiple voters', () => {
    const votes: VoteRecord[] = Array.from({ length: 5 }, (_, i) =>
      makeVote({ voterId: `voter-${i}`, ballotHash: 'same-hash', ipAddress: `10.0.0.${i}` })
    )
    const alerts = analyzeVotingPatterns(votes)
    const identical = alerts.find((a) => a.type === 'IDENTICAL_BALLOT')
    expect(identical).toBeDefined()
    expect(identical!.affectedIds).toHaveLength(5)
  })

  it('does NOT flag identical ballots below threshold', () => {
    const votes: VoteRecord[] = [
      makeVote({ voterId: 'voter-1', ballotHash: 'same-hash' }),
      makeVote({ voterId: 'voter-2', ballotHash: 'same-hash' }),
    ]
    const alerts = analyzeVotingPatterns(votes)
    expect(alerts.find((a) => a.type === 'IDENTICAL_BALLOT')).toBeUndefined()
  })

  it('detects new account mass voting', () => {
    const recentAccountDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago (< 24h threshold)
    const votes: VoteRecord[] = Array.from({ length: 6 }, (_, i) =>
      makeVote({
        voterId: 'new-voter',
        accountCreatedAt: recentAccountDate,
        ballotHash: `hash-${i}`,
        ipAddress: `1.1.1.${i}`,
      })
    )
    const alerts = analyzeVotingPatterns(votes)
    const newAccAlert = alerts.find((a) => a.type === 'NEW_ACCOUNT_MASS_VOTING')
    expect(newAccAlert).toBeDefined()
    expect(newAccAlert!.affectedIds).toContain('new-voter')
  })

  it('detects time-of-day anomaly for night votes', () => {
    // Create votes at 03:00 UTC
    const nightTimestamp = new Date()
    nightTimestamp.setUTCHours(3, 0, 0, 0)
    const votes: VoteRecord[] = Array.from({ length: 10 }, (_, i) =>
      makeVote({
        voterId: `voter-${i}`,
        timestamp: nightTimestamp.getTime() + i * 60_000,
        ipAddress: `2.2.2.${i}`,
        ballotHash: `hash-${i}`,
      })
    )
    const alerts = analyzeVotingPatterns(votes)
    const timeAlert = alerts.find((a) => a.type === 'TIME_OF_DAY_ANOMALY')
    expect(timeAlert).toBeDefined()
    expect(timeAlert!.severity).toBe('low')
  })

  it('sorts alerts by severity — critical first', () => {
    const now = Date.now()
    // Burst voting (high/critical) + identical ballot (medium)
    const burstVotes: VoteRecord[] = Array.from({ length: 25 }, (_, i) =>
      makeVote({ voterId: `voter-${i}`, timestamp: now + i * 500 })
    )
    const identicalVotes: VoteRecord[] = Array.from({ length: 4 }, (_, i) =>
      makeVote({ voterId: `iv-${i}`, ballotHash: 'dupe', ipAddress: `5.5.5.${i}` })
    )
    const alerts = analyzeVotingPatterns([...burstVotes, ...identicalVotes])
    const severities = alerts.map((a) => a.severity)
    const critIdx = severities.indexOf('critical')
    const medIdx = severities.indexOf('medium')
    if (critIdx !== -1 && medIdx !== -1) {
      expect(critIdx).toBeLessThan(medIdx)
    }
  })
})

// ---------------------------------------------------------------------------
// shannonEntropy
// ---------------------------------------------------------------------------
describe('shannonEntropy', () => {
  it('returns 0 for a single element', () => {
    expect(shannonEntropy([42])).toBe(0)
  })

  it('returns 0 for identical values (no diversity)', () => {
    expect(shannonEntropy([10, 10, 10, 10])).toBe(0)
  })

  it('returns higher entropy for diverse values', () => {
    const uniform = shannonEntropy([1, 1, 1, 1])
    const diverse = shannonEntropy([1, 2, 4, 8])
    expect(diverse).toBeGreaterThan(uniform)
  })
})

// ---------------------------------------------------------------------------
// calculateSuspicionScore
// ---------------------------------------------------------------------------
describe('calculateSuspicionScore', () => {
  it('assigns minimal risk to human-like behaviour', () => {
    const result = calculateSuspicionScore({
      voteIntervals: [2500, 3100, 2800, 4200, 3700], // natural spread
      sessionDurationMs: 5 * 60_000,
      voteCount: 5,
      hasMouseOrScrollEvents: true,
      uniqueIpCount: 1,
    })
    expect(result.riskLevel).toMatch(/^(minimal|low)$/)
    expect(result.suspicionScore).toBeLessThan(0.4)
  })

  it('assigns high risk to bot-like behaviour', () => {
    const result = calculateSuspicionScore({
      voteIntervals: [100, 100, 100, 100, 100], // perfectly regular
      sessionDurationMs: 500, // 100ms per vote
      voteCount: 5,
      hasMouseOrScrollEvents: false,
      uniqueIpCount: 4,
    })
    expect(result.riskLevel).toMatch(/^(high|critical)$/)
    expect(result.suspicionScore).toBeGreaterThan(0.5)
  })

  it('returns suspicion score in [0, 1]', () => {
    const result = calculateSuspicionScore({
      voteIntervals: [50, 50, 50],
      sessionDurationMs: 150,
      voteCount: 3,
      hasMouseOrScrollEvents: false,
      uniqueIpCount: 2,
    })
    expect(result.suspicionScore).toBeGreaterThanOrEqual(0)
    expect(result.suspicionScore).toBeLessThanOrEqual(1)
  })

  it('includes signal breakdown in result', () => {
    const result = calculateSuspicionScore({
      voteIntervals: [1000, 1100, 900],
      sessionDurationMs: 3000,
      voteCount: 3,
      hasMouseOrScrollEvents: true,
      uniqueIpCount: 1,
    })
    expect(result.signals.length).toBeGreaterThan(0)
    for (const signal of result.signals) {
      expect(signal.value).toBeGreaterThanOrEqual(0)
      expect(signal.value).toBeLessThanOrEqual(1)
    }
  })
})
