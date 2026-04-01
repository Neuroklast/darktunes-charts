import { describe, it, expect } from 'vitest'
import { computeCharts, computeAllCharts } from '../computation'
import type { FanVoteInput, DJBallotInput, ReleaseInput } from '../computation'

const PERIOD_ID = 'period-uuid-001'
const CATEGORY_ID = 'track'
const PERIOD_END = new Date('2026-04-30T23:59:59Z')

const RELEASE_A = 'release-aaa-001'
const RELEASE_B = 'release-bbb-002'
const RELEASE_C = 'release-ccc-003'

const releases: ReleaseInput[] = [
  { id: RELEASE_A, title: 'Dark Horizon', releaseDate: new Date('2026-04-10'), bandName: 'Blutengel' },
  { id: RELEASE_B, title: 'Iron Chains', releaseDate: new Date('2026-04-05'), bandName: 'Combichrist' },
  { id: RELEASE_C, title: 'Hollow Ground', releaseDate: new Date('2026-03-15'), bandName: 'And One' },
]

function makeVotes(releaseId: string, votes: number, count: number): FanVoteInput[] {
  return Array.from({ length: count }, (_, i) => ({
    userId: `fan-user-${i + 1}`,
    releaseId,
    votes,
    creditsSpent: votes * votes,
    createdAt: new Date(`2026-04-${String(i + 1).padStart(2, '0')}T10:00:00Z`),
  }))
}

describe('computeCharts', () => {
  it('returns empty entries when no votes and no ballots', () => {
    const result = computeCharts(PERIOD_ID, CATEGORY_ID, [], [], releases, PERIOD_END)
    expect(result.entries).toHaveLength(0)
    expect(result.quorumMet).toBe(false)
  })

  it('ranks releases by fan votes when no DJ ballots', () => {
    const fanVotes: FanVoteInput[] = [
      ...makeVotes(RELEASE_A, 5, 10),
      ...makeVotes(RELEASE_B, 3, 5),
      ...makeVotes(RELEASE_C, 1, 2),
    ]

    const result = computeCharts(PERIOD_ID, CATEGORY_ID, fanVotes, [], releases, PERIOD_END)

    expect(result.entries.length).toBeGreaterThan(0)
    expect(result.entries[0]?.releaseId).toBe(RELEASE_A)
    expect(result.entries[result.entries.length - 1]?.releaseId).toBe(RELEASE_C)
  })

  it('assigns rank 1 to the top-scored entry', () => {
    const fanVotes = makeVotes(RELEASE_A, 10, 20)
    const result = computeCharts(PERIOD_ID, CATEGORY_ID, fanVotes, [], releases, PERIOD_END)
    expect(result.entries[0]?.rank).toBe(1)
  })

  it('applies DJ Schulze rankings when ballots are present', () => {
    const djBallots: DJBallotInput[] = [
      { djId: 'dj-1', rankings: [RELEASE_B, RELEASE_A, RELEASE_C], createdAt: new Date() },
      { djId: 'dj-2', rankings: [RELEASE_B, RELEASE_C, RELEASE_A], createdAt: new Date() },
      { djId: 'dj-3', rankings: [RELEASE_B, RELEASE_A, RELEASE_C], createdAt: new Date() },
    ]

    const result = computeCharts(PERIOD_ID, CATEGORY_ID, [], djBallots, releases, PERIOD_END)
    expect(result.entries[0]?.releaseId).toBe(RELEASE_B)
  })

  it('includes transparency metadata in each entry', () => {
    const fanVotes = makeVotes(RELEASE_A, 3, 5)
    const result = computeCharts(PERIOD_ID, CATEGORY_ID, fanVotes, [], releases, PERIOD_END)

    expect(result.entries.length).toBeGreaterThan(0)
    const entry = result.entries[0]
    if (entry) {
      expect(entry.scores).toBeDefined()
      expect(entry.scores.appliedWeights).toBeDefined()
      expect(entry.scores.appliedWeights.fan + entry.scores.appliedWeights.dj).toBeCloseTo(1.0)
      expect(entry.metadata).toBeDefined()
      expect(entry.metadata.computedAt).toBeDefined()
    }
  })

  it('quorumMet is false when fan count is below 50', () => {
    const fanVotes = makeVotes(RELEASE_A, 1, 10)
    const result = computeCharts(PERIOD_ID, CATEGORY_ID, fanVotes, [], releases, PERIOD_END)
    expect(result.quorumMet).toBe(false)
  })

  it('returns correct categoryId and votingPeriodId in result', () => {
    const result = computeCharts(PERIOD_ID, 'album', [], [], releases, PERIOD_END)
    expect(result.categoryId).toBe('album')
    expect(result.votingPeriodId).toBe(PERIOD_ID)
  })
})

describe('computeAllCharts', () => {
  it('returns results for all chart-eligible categories', () => {
    const results = computeAllCharts(
      PERIOD_ID,
      new Map(),
      new Map(),
      releases,
      PERIOD_END,
    )

    expect(results.length).toBeGreaterThan(0)
    for (const result of results) {
      expect(result.votingPeriodId).toBe(PERIOD_ID)
      expect(result.categoryId).toBeTruthy()
    }
  })

  it('passes fan votes to the correct category', () => {
    const trackVotes = makeVotes(RELEASE_A, 5, 3)
    const allFanVotes = new Map<string, FanVoteInput[]>([['track', trackVotes]])

    const results = computeAllCharts(PERIOD_ID, allFanVotes, new Map(), releases, PERIOD_END)
    const trackResult = results.find((r) => r.categoryId === 'track')

    expect(trackResult).toBeDefined()
    expect(trackResult!.entries.length).toBeGreaterThan(0)
  })
})
