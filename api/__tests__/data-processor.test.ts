import { describe, it, expect } from 'vitest'
import { computeChartEntries, normaliseFanCredits, groupTracksByGenre, filterTracksForCategory } from '../_lib/data-processor'
import type { Band, Track, FanVote } from '../../src/lib/types'

const mockBands: Band[] = [
  { id: 'b1', name: 'Band A', genre: 'Goth', spotifyMonthlyListeners: 5_000, tier: 'Micro' },
  { id: 'b2', name: 'Band B', genre: 'Metal', spotifyMonthlyListeners: 50_000, tier: 'Established' },
  { id: 'b3', name: 'Band C', genre: 'Dark Electro', spotifyMonthlyListeners: 200_000, tier: 'Established' },
]

const mockTracks: Track[] = [
  { id: 't1', bandId: 'b1', title: 'Track A', submittedAt: Date.now() - 1000, category: 'Goth' },
  { id: 't2', bandId: 'b2', title: 'Track B', submittedAt: Date.now() - 2000, category: 'Metal' },
  { id: 't3', bandId: 'b3', title: 'Track C', submittedAt: Date.now() - 3000, category: 'Dark Electro' },
]

const mockFanVotes: Record<string, FanVote> = {
  t1: { trackId: 't1', votes: 5, creditsSpent: 25 },
  t2: { trackId: 't2', votes: 3, creditsSpent: 9 },
}

describe('computeChartEntries', () => {
  it('returns one entry per track with matching band', () => {
    const entries = computeChartEntries(mockBands, mockTracks, mockFanVotes)
    expect(entries).toHaveLength(mockTracks.length)
  })

  it('assigns overallRank starting at 1', () => {
    const entries = computeChartEntries(mockBands, mockTracks, mockFanVotes)
    expect(entries[0].overallRank).toBe(1)
    expect(entries[entries.length - 1].overallRank).toBe(entries.length)
  })

  it('excludes tracks with no matching band', () => {
    const tracksWithOrphan: Track[] = [
      ...mockTracks,
      { id: 't-orphan', bandId: 'nonexistent', title: 'Orphan', submittedAt: Date.now(), category: 'Goth' },
    ]
    const entries = computeChartEntries(mockBands, tracksWithOrphan, mockFanVotes)
    expect(entries).toHaveLength(mockTracks.length)
  })

  it('respects limit option', () => {
    const entries = computeChartEntries(mockBands, mockTracks, mockFanVotes, { limit: 2 })
    expect(entries).toHaveLength(2)
  })

  it('returns empty array for empty inputs', () => {
    const entries = computeChartEntries([], [], {})
    expect(entries).toHaveLength(0)
  })

  it('correctly applies fan credits to entries', () => {
    const entries = computeChartEntries(mockBands, mockTracks, mockFanVotes)
    const t1Entry = entries.find((e) => e.track.id === 't1')
    expect(t1Entry?.fanCreditsSpent).toBe(25)
  })

  it('sets fanCreditsSpent to 0 for tracks without fan votes', () => {
    const entries = computeChartEntries(mockBands, mockTracks, {})
    for (const entry of entries) {
      expect(entry.fanCreditsSpent).toBe(0)
    }
  })
})

describe('normaliseFanCredits', () => {
  it('returns 100 for max credits', () => {
    expect(normaliseFanCredits(100)).toBe(100)
  })

  it('returns 0 for 0 credits', () => {
    expect(normaliseFanCredits(0)).toBe(0)
  })

  it('returns 50 for 50 credits', () => {
    expect(normaliseFanCredits(50)).toBe(50)
  })

  it('caps at 100 even for inputs above max', () => {
    expect(normaliseFanCredits(200)).toBe(100)
  })
})

describe('groupTracksByGenre', () => {
  it('groups tracks by their genre category', () => {
    const grouped = groupTracksByGenre(mockTracks)
    expect(Object.keys(grouped)).toHaveLength(3)
    expect(grouped['Goth']).toHaveLength(1)
    expect(grouped['Metal']).toHaveLength(1)
    expect(grouped['Dark Electro']).toHaveLength(1)
  })

  it('returns empty object for no tracks', () => {
    expect(groupTracksByGenre([])).toEqual({})
  })
})

describe('filterTracksForCategory', () => {
  it('returns all tracks for unrestricted category', () => {
    const result = filterTracksForCategory(mockTracks, mockBands, 'track')
    expect(result).toHaveLength(mockTracks.length)
  })

  it('filters out bands above maxListeners for underground-anthem', () => {
    const result = filterTracksForCategory(mockTracks, mockBands, 'underground-anthem')
    expect(result.every((t) => {
      const band = mockBands.find((b) => b.id === t.bandId)
      return band && band.spotifyMonthlyListeners <= 10_000
    })).toBe(true)
  })

  it('excludes tracks with no matching band', () => {
    const tracksWithOrphan: Track[] = [
      ...mockTracks,
      { id: 't-orphan', bandId: 'gone', title: 'Orphan', submittedAt: Date.now(), category: 'Goth' },
    ]
    const result = filterTracksForCategory(tracksWithOrphan, mockBands, 'track')
    expect(result.some((t) => t.id === 't-orphan')).toBe(false)
  })
})
