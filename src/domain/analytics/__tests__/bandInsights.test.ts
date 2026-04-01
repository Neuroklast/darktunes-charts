import { describe, it, expect } from 'vitest'
import {
  calculateBandInsights,
  calculateRegionalBreakdown,
  calculateGenreOverlap,
  calculateVoteTrend,
  type BandInsightsInput,
  type RegionData,
  type OtherBandData,
  type TrendEntry,
} from '../bandInsights'

// ─── calculateBandInsights ────────────────────────────────────────────────────

describe('calculateBandInsights', () => {
  const baseInput: BandInsightsInput = {
    bandId: 'band-1',
    period: '2024-01',
    fanVotes: [
      { userId: 'u1', votes: 3 },
      { userId: 'u2', votes: 5 },
    ],
    djMentions: 7,
    chartResults: [
      { categoryId: 'cat-goth', rank: 2 },
      { categoryId: 'cat-metal', rank: 4 },
    ],
    regions: [],
  }

  it('aggregates total fan votes', () => {
    const result = calculateBandInsights(baseInput)
    expect(result.totalFanVotes).toBe(8)
  })

  it('passes through DJ mentions', () => {
    const result = calculateBandInsights(baseInput)
    expect(result.totalDJMentions).toBe(7)
  })

  it('calculates average chart position', () => {
    const result = calculateBandInsights(baseInput)
    expect(result.averageChartPosition).toBeCloseTo(3)
  })

  it('identifies best chart position', () => {
    const result = calculateBandInsights(baseInput)
    expect(result.bestChartPosition).toBe(2)
  })

  it('identifies best category', () => {
    const result = calculateBandInsights(baseInput)
    expect(result.bestCategory).toBe('cat-goth')
  })

  it('returns null breakdown when no regions qualify', () => {
    const input: BandInsightsInput = { ...baseInput, regions: [{ region: 'DE', count: 3 }] }
    const result = calculateBandInsights(input)
    expect(result.regionalBreakdown).toBeNull()
  })

  it('includes breakdown when regions have sufficient voters', () => {
    const input: BandInsightsInput = {
      ...baseInput,
      regions: [{ region: 'DE', count: 50 }],
    }
    const result = calculateBandInsights(input)
    expect(result.regionalBreakdown).not.toBeNull()
  })

  it('handles zero fan votes', () => {
    const input: BandInsightsInput = { ...baseInput, fanVotes: [] }
    const result = calculateBandInsights(input)
    expect(result.totalFanVotes).toBe(0)
  })

  it('returns null chart positions when no chart results', () => {
    const input: BandInsightsInput = { ...baseInput, chartResults: [] }
    const result = calculateBandInsights(input)
    expect(result.averageChartPosition).toBeNull()
    expect(result.bestChartPosition).toBeNull()
    expect(result.bestCategory).toBeNull()
  })
})

// ─── calculateRegionalBreakdown ───────────────────────────────────────────────

describe('calculateRegionalBreakdown', () => {
  it('returns null when no region meets threshold', () => {
    const regions: RegionData[] = [
      { region: 'DE', count: 5 },
      { region: 'AT', count: 3 },
    ]
    expect(calculateRegionalBreakdown(regions, 10)).toBeNull()
  })

  it('filters out regions below threshold', () => {
    const regions: RegionData[] = [
      { region: 'DE', count: 50 },
      { region: 'AT', count: 3 },
    ]
    const result = calculateRegionalBreakdown(regions, 10)
    expect(result).not.toBeNull()
    expect(result!.find((r) => r.region === 'AT')).toBeUndefined()
  })

  it('calculates percentages correctly', () => {
    const regions: RegionData[] = [
      { region: 'DE', count: 50 },
      { region: 'UK', count: 50 },
    ]
    const result = calculateRegionalBreakdown(regions, 10)!
    expect(result[0].percentage).toBeCloseTo(50)
    expect(result[1].percentage).toBeCloseTo(50)
  })

  it('handles empty regions array', () => {
    expect(calculateRegionalBreakdown([], 10)).toBeNull()
  })

  it('includes exactly one region when only one qualifies', () => {
    const regions: RegionData[] = [
      { region: 'DE', count: 100 },
      { region: 'AT', count: 2 },
    ]
    const result = calculateRegionalBreakdown(regions, 10)!
    expect(result).toHaveLength(1)
    expect(result[0].region).toBe('DE')
  })
})

// ─── calculateGenreOverlap ────────────────────────────────────────────────────

describe('calculateGenreOverlap', () => {
  it('returns zero overlap when no shared voters', () => {
    const bandGenres = ['goth', 'darkwave']
    const otherBandData: OtherBandData[] = [
      { genres: ['goth'], sharedVoterCount: 0, totalVoterCount: 100 },
    ]
    const result = calculateGenreOverlap(bandGenres, otherBandData)
    const gothEntry = result.find((e) => e.genre === 'goth')!
    expect(gothEntry.overlapScore).toBe(0)
  })

  it('calculates correct Jaccard score', () => {
    const bandGenres = ['goth']
    const otherBandData: OtherBandData[] = [
      { genres: ['goth'], sharedVoterCount: 50, totalVoterCount: 100 },
    ]
    const result = calculateGenreOverlap(bandGenres, otherBandData)
    expect(result[0].overlapScore).toBeCloseTo(0.5)
  })

  it('sorts results by overlap score descending', () => {
    const bandGenres = ['goth', 'metal']
    const otherBandData: OtherBandData[] = [
      { genres: ['goth'], sharedVoterCount: 10, totalVoterCount: 100 },
      { genres: ['metal'], sharedVoterCount: 80, totalVoterCount: 100 },
    ]
    const result = calculateGenreOverlap(bandGenres, otherBandData)
    expect(result[0].genre).toBe('metal')
  })

  it('ignores bands with totalVoterCount = 0', () => {
    const bandGenres = ['goth']
    const otherBandData: OtherBandData[] = [
      { genres: ['goth'], sharedVoterCount: 0, totalVoterCount: 0 },
    ]
    const result = calculateGenreOverlap(bandGenres, otherBandData)
    expect(result[0].overlapScore).toBe(0)
  })

  it('handles band with no genres', () => {
    const result = calculateGenreOverlap([], [])
    expect(result).toEqual([])
  })
})

// ─── calculateVoteTrend ───────────────────────────────────────────────────────

describe('calculateVoteTrend', () => {
  it('sorts entries by period ascending', () => {
    const entries: TrendEntry[] = [
      { period: '2024-03', fanVotes: 10, djMentions: 2, chartPosition: 5 },
      { period: '2024-01', fanVotes: 5, djMentions: 1, chartPosition: null },
      { period: '2024-02', fanVotes: 8, djMentions: 3, chartPosition: 3 },
    ]
    const result = calculateVoteTrend(entries)
    expect(result[0].period).toBe('2024-01')
    expect(result[2].period).toBe('2024-03')
  })

  it('does not mutate original array', () => {
    const entries: TrendEntry[] = [
      { period: '2024-02', fanVotes: 1, djMentions: 0, chartPosition: null },
      { period: '2024-01', fanVotes: 2, djMentions: 0, chartPosition: null },
    ]
    calculateVoteTrend(entries)
    expect(entries[0].period).toBe('2024-02')
  })

  it('handles empty array', () => {
    expect(calculateVoteTrend([])).toEqual([])
  })
})
