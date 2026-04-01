import { describe, it, expect } from 'vitest'
import {
  selectChartTracks,
  selectCurators,
  validateCompilation,
  finalizeCompilation,
  type ChartResultEntry,
  type DJProfile,
  type Compilation,
  type CompilationTrack,
} from '../index'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeChartEntry(
  overrides: Partial<ChartResultEntry> = {},
  index = 0,
): ChartResultEntry {
  return {
    releaseId: `release-${index}`,
    rank: index + 1,
    categoryId: 'cat-goth',
    bandName: `Band ${index}`,
    trackTitle: `Track ${index}`,
    genres: ['goth'],
    ...overrides,
  }
}

function makeDJProfile(overrides: Partial<DJProfile> = {}, index = 0): DJProfile {
  return {
    userId: `dj-${index}`,
    djName: `DJ ${index}`,
    monthsActive: 24,
    ballotsSubmitted: 5,
    ...overrides,
  }
}

function makeCompilation(overrides: Partial<Compilation> = {}): Compilation {
  const tracks: CompilationTrack[] = Array.from({ length: 18 }, (_, i) => ({
    position: i + 1,
    releaseId: `r-${i}`,
    trackTitle: `T${i}`,
    bandName: `Band${i}`,
    source: i < 11 ? ('chart' as const) : ('curator-pick' as const),
  }))

  return {
    id: 'comp-1',
    title: 'Test Compilation',
    period: '2024-Q1',
    status: 'curating',
    tracks,
    curators: [
      { userId: 'u1', djName: 'DJ A', picks: 2 },
      { userId: 'u2', djName: 'DJ B', picks: 3 },
      { userId: 'u3', djName: 'DJ C', picks: 2 },
    ],
    createdAt: new Date(),
    ...overrides,
  }
}

// ─── selectChartTracks ────────────────────────────────────────────────────────

describe('selectChartTracks', () => {
  it('returns top N tracks sorted by rank', () => {
    const entries = [3, 1, 2].map((rank, i) =>
      makeChartEntry({ rank, bandName: `Band ${i}`, releaseId: `r-${i}` }, i),
    )
    const result = selectChartTracks(entries, 2)
    expect(result).toHaveLength(2)
    expect(result[0].chartRank).toBe(1)
    expect(result[1].chartRank).toBe(2)
  })

  it('respects max 2 tracks per band', () => {
    const entries = [1, 2, 3, 4].map((rank) =>
      makeChartEntry({ rank, bandName: 'SameBand', releaseId: `r-${rank}` }),
    )
    const result = selectChartTracks(entries, 4)
    const sameBandCount = result.filter((t) => t.bandName === 'SameBand').length
    expect(sameBandCount).toBeLessThanOrEqual(2)
  })

  it('assigns sequential position numbers', () => {
    const entries = Array.from({ length: 5 }, (_, i) => makeChartEntry({}, i))
    const result = selectChartTracks(entries, 5)
    result.forEach((t, i) => expect(t.position).toBe(i + 1))
  })

  it('sets source to "chart" for all tracks', () => {
    const entries = Array.from({ length: 3 }, (_, i) => makeChartEntry({}, i))
    const result = selectChartTracks(entries, 3)
    expect(result.every((t) => t.source === 'chart')).toBe(true)
  })

  it('returns fewer tracks than requested when pool is small', () => {
    const entries = [makeChartEntry({}, 0)]
    const result = selectChartTracks(entries, 10)
    expect(result).toHaveLength(1)
  })

  it('handles empty input', () => {
    expect(selectChartTracks([], 5)).toEqual([])
  })
})

// ─── selectCurators ───────────────────────────────────────────────────────────

describe('selectCurators', () => {
  it('returns exactly 3 curators from an eligible pool', () => {
    const pool = Array.from({ length: 10 }, (_, i) => makeDJProfile({}, i))
    const result = selectCurators(pool, [])
    expect(result).toHaveLength(3)
  })

  it('excludes DJs in previousCurators', () => {
    const pool = Array.from({ length: 10 }, (_, i) => makeDJProfile({}, i))
    const previous = ['dj-0', 'dj-1', 'dj-2']
    const result = selectCurators(pool, previous)
    const resultIds = result.map((c) => c.userId)
    for (const prev of previous) {
      expect(resultIds).not.toContain(prev)
    }
  })

  it('excludes DJs with fewer than 12 months active', () => {
    const pool = [
      makeDJProfile({ userId: 'ineligible', monthsActive: 6 }),
      ...Array.from({ length: 5 }, (_, i) => makeDJProfile({}, i)),
    ]
    const result = selectCurators(pool, [])
    expect(result.map((c) => c.userId)).not.toContain('ineligible')
  })

  it('excludes DJs with fewer than 3 ballots submitted', () => {
    const pool = [
      makeDJProfile({ userId: 'low-ballots', ballotsSubmitted: 2 }),
      ...Array.from({ length: 5 }, (_, i) => makeDJProfile({}, i)),
    ]
    const result = selectCurators(pool, [])
    expect(result.map((c) => c.userId)).not.toContain('low-ballots')
  })

  it('is deterministic for same inputs', () => {
    const pool = Array.from({ length: 10 }, (_, i) => makeDJProfile({}, i))
    const r1 = selectCurators(pool, ['dj-5'])
    const r2 = selectCurators(pool, ['dj-5'])
    expect(r1.map((c) => c.userId)).toEqual(r2.map((c) => c.userId))
  })

  it('initialises picks to 0', () => {
    const pool = Array.from({ length: 5 }, (_, i) => makeDJProfile({}, i))
    const result = selectCurators(pool, [])
    expect(result.every((c) => c.picks === 0)).toBe(true)
  })

  it('returns fewer than 3 when pool is too small', () => {
    const pool = [makeDJProfile({}, 0)]
    const result = selectCurators(pool, [])
    expect(result).toHaveLength(1)
  })
})

// ─── validateCompilation ──────────────────────────────────────────────────────

describe('validateCompilation', () => {
  it('passes a valid compilation', () => {
    const comp = makeCompilation()
    const { valid, errors } = validateCompilation(comp)
    expect(valid).toBe(true)
    expect(errors).toHaveLength(0)
  })

  it('fails when tracks < 15', () => {
    const tracks: CompilationTrack[] = Array.from({ length: 10 }, (_, i) => ({
      position: i + 1,
      releaseId: `r-${i}`,
      trackTitle: `T${i}`,
      bandName: `Band${i}`,
      source: 'chart' as const,
    }))
    const comp = makeCompilation({ tracks })
    const { valid, errors } = validateCompilation(comp)
    expect(valid).toBe(false)
    expect(errors.some((e) => e.includes('15–20'))).toBe(true)
  })

  it('fails when tracks > 20', () => {
    const tracks: CompilationTrack[] = Array.from({ length: 21 }, (_, i) => ({
      position: i + 1,
      releaseId: `r-${i}`,
      trackTitle: `T${i}`,
      bandName: `Band${i}`,
      source: 'chart' as const,
    }))
    const comp = makeCompilation({ tracks })
    const { valid, errors } = validateCompilation(comp)
    expect(valid).toBe(false)
    expect(errors.some((e) => e.includes('15–20'))).toBe(true)
  })

  it('fails when chart ratio < 50%', () => {
    const tracks: CompilationTrack[] = Array.from({ length: 16 }, (_, i) => ({
      position: i + 1,
      releaseId: `r-${i}`,
      trackTitle: `T${i}`,
      bandName: `Band${i}`,
      source: 'curator-pick' as const,
    }))
    const comp = makeCompilation({ tracks })
    const { valid, errors } = validateCompilation(comp)
    expect(valid).toBe(false)
    expect(errors.some((e) => e.includes('50–70%'))).toBe(true)
  })

  it('fails when a band appears more than twice', () => {
    const tracks: CompilationTrack[] = Array.from({ length: 16 }, (_, i) => ({
      position: i + 1,
      releaseId: `r-${i}`,
      trackTitle: `T${i}`,
      bandName: i < 3 ? 'OverUsedBand' : `Band${i}`,
      source: i < 10 ? ('chart' as const) : ('curator-pick' as const),
    }))
    const comp = makeCompilation({ tracks })
    const { errors } = validateCompilation(comp)
    expect(errors.some((e) => e.includes('OverUsedBand'))).toBe(true)
  })

  it('fails when a curator has zero picks', () => {
    const comp = makeCompilation({
      curators: [
        { userId: 'u1', djName: 'DJ A', picks: 0 },
        { userId: 'u2', djName: 'DJ B', picks: 3 },
        { userId: 'u3', djName: 'DJ C', picks: 2 },
      ],
    })
    const { valid, errors } = validateCompilation(comp)
    expect(valid).toBe(false)
    expect(errors.some((e) => e.includes('DJ A'))).toBe(true)
  })
})

// ─── finalizeCompilation ──────────────────────────────────────────────────────

describe('finalizeCompilation', () => {
  it('returns a new compilation with status finalized', () => {
    const comp = makeCompilation({ status: 'curating' })
    const result = finalizeCompilation(comp)
    expect(result.status).toBe('finalized')
  })

  it('does not mutate the original compilation', () => {
    const comp = makeCompilation({ status: 'curating' })
    finalizeCompilation(comp)
    expect(comp.status).toBe('curating')
  })

  it('throws when compilation is already published', () => {
    const comp = makeCompilation({ status: 'published' })
    expect(() => finalizeCompilation(comp)).toThrow()
  })

  it('can finalize a draft compilation', () => {
    const comp = makeCompilation({ status: 'draft' })
    expect(finalizeCompilation(comp).status).toBe('finalized')
  })
})
