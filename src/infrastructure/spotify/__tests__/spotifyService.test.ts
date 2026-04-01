/**
 * @module infrastructure/spotify/__tests__/spotifyService.test
 *
 * Unit tests for the Spotify service layer.
 *
 * All network calls and Prisma interactions are mocked to ensure tests are
 * deterministic and do not require real credentials.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const { mockFetchArtist, mockFetchArtistTopTracks, mockSearchArtist } = vi.hoisted(() => ({
  mockFetchArtist: vi.fn(),
  mockFetchArtistTopTracks: vi.fn(),
  mockSearchArtist: vi.fn(),
}))

const { mockBandFindUnique, mockBandUpdate, mockBandFindMany } = vi.hoisted(() => ({
  mockBandFindUnique: vi.fn(),
  mockBandUpdate: vi.fn(),
  mockBandFindMany: vi.fn(),
}))

vi.mock('@/infrastructure/spotify/client', () => ({
  spotifyClient: {
    fetchArtist: mockFetchArtist,
    fetchArtistTopTracks: mockFetchArtistTopTracks,
    searchArtist: mockSearchArtist,
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    band: {
      findUnique: mockBandFindUnique,
      update: mockBandUpdate,
      findMany: mockBandFindMany,
    },
  },
}))

// Import after mocks are set up
import {
  getArtistByUri,
  getArtistTopTracks,
  searchArtist,
  refreshBandTier,
  refreshAllBandTiers,
} from '../service'
import type { SpotifyArtistData, SpotifyTrackData } from '../client'

// ─── Test data ────────────────────────────────────────────────────────────────

const mockArtist: SpotifyArtistData = {
  id: '4Z8W4fKeB5YxbusRsdQVPb',
  name: 'Bauhaus',
  uri: 'spotify:artist:4Z8W4fKeB5YxbusRsdQVPb',
  // 200,000 → Established (50,001–250,000)
  followers: 200_000,
  popularity: 72,
  genres: ['gothic rock', 'post-punk'],
  images: [{ url: 'https://i.scdn.co/image/test', height: 640, width: 640 }],
  externalUrl: 'https://open.spotify.com/artist/4Z8W4fKeB5YxbusRsdQVPb',
}

const mockTrack: SpotifyTrackData = {
  id: 'trackId123',
  name: 'Bela Lugosi\'s Dead',
  uri: 'spotify:track:trackId123',
  previewUrl: 'https://p.scdn.co/preview/test',
  externalUrl: 'https://open.spotify.com/track/trackId123',
  album: { id: 'albumId', name: 'In the Flat Field', imageUrl: 'https://i.scdn.co/image/album' },
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getArtistByUri', () => {
  it('extracts artist ID and delegates to spotifyClient.fetchArtist', async () => {
    mockFetchArtist.mockResolvedValue(mockArtist)

    const result = await getArtistByUri('spotify:artist:4Z8W4fKeB5YxbusRsdQVPb')

    expect(mockFetchArtist).toHaveBeenCalledWith('4Z8W4fKeB5YxbusRsdQVPb')
    expect(result).toEqual(mockArtist)
  })

  it('throws on invalid URI format', async () => {
    await expect(getArtistByUri('invalid-uri')).rejects.toThrow('Invalid Spotify URI format')
  })

  it('throws on URI with wrong type segment', async () => {
    await expect(getArtistByUri('spotify:track:someId')).rejects.toThrow(
      'Invalid Spotify URI format',
    )
  })

  it('throws on URI with empty artist ID', async () => {
    await expect(getArtistByUri('spotify:artist:')).rejects.toThrow('Invalid Spotify URI format')
  })
})

describe('getArtistTopTracks', () => {
  it('extracts artist ID and delegates to spotifyClient.fetchArtistTopTracks', async () => {
    mockFetchArtistTopTracks.mockResolvedValue([mockTrack])

    const result = await getArtistTopTracks('spotify:artist:4Z8W4fKeB5YxbusRsdQVPb')

    expect(mockFetchArtistTopTracks).toHaveBeenCalledWith('4Z8W4fKeB5YxbusRsdQVPb')
    expect(result).toEqual([mockTrack])
  })
})

describe('searchArtist', () => {
  it('delegates to spotifyClient.searchArtist', async () => {
    mockSearchArtist.mockResolvedValue([mockArtist])

    const result = await searchArtist('bauhaus')

    expect(mockSearchArtist).toHaveBeenCalledWith('bauhaus')
    expect(result).toEqual([mockArtist])
  })
})

describe('refreshBandTier', () => {
  it('fetches band, gets Spotify data, updates DB with correct tier', async () => {
    mockBandFindUnique.mockResolvedValue({
      id: 'band-1',
      spotifyUri: 'spotify:artist:4Z8W4fKeB5YxbusRsdQVPb',
    })
    mockFetchArtist.mockResolvedValue(mockArtist) // followers: 250_001 → Established
    mockBandUpdate.mockResolvedValue({})

    const result = await refreshBandTier('band-1')

    expect(mockBandFindUnique).toHaveBeenCalledWith({
      where: { id: 'band-1' },
      select: { id: true, spotifyUri: true },
    })
    expect(mockBandUpdate).toHaveBeenCalledWith({
      where: { id: 'band-1' },
      data: {
        spotifyMonthlyListeners: 200_000,
        tier: 'ESTABLISHED',
      },
    })
    expect(result).toEqual({ bandId: 'band-1', newTier: 'Established', listeners: 200_000 })
  })

  it('maps Micro tier correctly (followers ≤ 10_000)', async () => {
    mockBandFindUnique.mockResolvedValue({
      id: 'band-2',
      spotifyUri: 'spotify:artist:testId',
    })
    mockFetchArtist.mockResolvedValue({ ...mockArtist, followers: 5_000 })
    mockBandUpdate.mockResolvedValue({})

    const result = await refreshBandTier('band-2')

    expect(result.newTier).toBe('Micro')
    expect(mockBandUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tier: 'MICRO' }) }),
    )
  })

  it('maps Macro tier correctly (followers > 1_000_000)', async () => {
    mockBandFindUnique.mockResolvedValue({
      id: 'band-3',
      spotifyUri: 'spotify:artist:testId',
    })
    mockFetchArtist.mockResolvedValue({ ...mockArtist, followers: 2_000_000 })
    mockBandUpdate.mockResolvedValue({})

    const result = await refreshBandTier('band-3')

    expect(result.newTier).toBe('Macro')
    expect(mockBandUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tier: 'MACRO' }) }),
    )
  })

  it('throws when band is not found', async () => {
    mockBandFindUnique.mockResolvedValue(null)

    await expect(refreshBandTier('missing-id')).rejects.toThrow('Band not found: missing-id')
  })

  it('throws when band has no spotifyUri', async () => {
    mockBandFindUnique.mockResolvedValue({ id: 'band-4', spotifyUri: null })

    await expect(refreshBandTier('band-4')).rejects.toThrow('Band band-4 has no Spotify URI')
  })
})

describe('refreshAllBandTiers', () => {
  it('iterates all bands with spotifyUri and returns counts', async () => {
    mockBandFindMany.mockResolvedValue([{ id: 'band-a' }, { id: 'band-b' }])
    // band-a succeeds
    mockBandFindUnique
      .mockResolvedValueOnce({ id: 'band-a', spotifyUri: 'spotify:artist:aaaaa' })
      .mockResolvedValueOnce({ id: 'band-b', spotifyUri: 'spotify:artist:bbbbb' })
    mockFetchArtist.mockResolvedValue(mockArtist)
    mockBandUpdate.mockResolvedValue({})

    const result = await refreshAllBandTiers()

    expect(result.updated).toBe(2)
    expect(result.failed).toBe(0)
  })

  it('counts failures without throwing', async () => {
    mockBandFindMany.mockResolvedValue([{ id: 'band-x' }, { id: 'band-y' }])
    mockBandFindUnique
      .mockResolvedValueOnce({ id: 'band-x', spotifyUri: 'spotify:artist:xxxxx' })
      .mockResolvedValueOnce({ id: 'band-y', spotifyUri: 'spotify:artist:yyyyy' })
    // First band succeeds, second fails
    mockFetchArtist
      .mockResolvedValueOnce(mockArtist)
      .mockRejectedValueOnce(new Error('Spotify rate limit exceeded'))
    mockBandUpdate.mockResolvedValue({})

    const result = await refreshAllBandTiers()

    expect(result.updated).toBe(1)
    expect(result.failed).toBe(1)
  })

  it('returns zero counts when no bands have spotifyUri', async () => {
    mockBandFindMany.mockResolvedValue([])

    const result = await refreshAllBandTiers()

    expect(result).toEqual({ updated: 0, failed: 0 })
  })
})
