import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { syncCompilationToSpotify, CompilationTrackSchema } from '../playlistSync'

const VALID_TRACKS = [
  { spotifyTrackUri: 'spotify:track:AbcDef123456', title: 'Track 1', artist: 'Artist 1' },
  { spotifyTrackUri: 'spotify:track:XyzWvu789012', title: 'Track 2', artist: 'Artist 2' },
]

describe('Spotify Playlist Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CompilationTrackSchema', () => {
    it('accepts a valid Spotify track URI', () => {
      const result = CompilationTrackSchema.safeParse(VALID_TRACKS[0])
      expect(result.success).toBe(true)
    })

    it('rejects an invalid Spotify URI', () => {
      const result = CompilationTrackSchema.safeParse({
        spotifyTrackUri: 'https://open.spotify.com/track/abc',
        title: 'Track',
        artist: 'Artist',
      })
      expect(result.success).toBe(false)
    })

    it('rejects a URI with path traversal characters', () => {
      const result = CompilationTrackSchema.safeParse({
        spotifyTrackUri: 'spotify:track:../../../etc/passwd',
        title: 'Attack',
        artist: 'Attacker',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('syncCompilationToSpotify', () => {
    it('creates a new playlist and adds tracks', async () => {
      mockFetch
        // POST create playlist
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({
            id: 'playlist123',
            external_urls: { spotify: 'https://open.spotify.com/playlist/playlist123' },
          })),
        } as unknown as Response)
        // PUT add tracks
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('{}'),
        } as unknown as Response)

      const url = await syncCompilationToSpotify(
        'compilation-id-1',
        'DarkTunes Vol. 1',
        VALID_TRACKS,
        'spotify_user_123',
        'access_token_abc',
      )

      expect(url).toBe('https://open.spotify.com/playlist/playlist123')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('updates an existing playlist when existingPlaylistId is provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('{}'),
      } as unknown as Response)

      const url = await syncCompilationToSpotify(
        'compilation-id-2',
        'DarkTunes Vol. 2',
        VALID_TRACKS,
        'spotify_user_123',
        'access_token_abc',
        'existing_playlist_id',
      )

      expect(url).toBe('https://open.spotify.com/playlist/existing_playlist_id')
      // Only one call — no create, just PUT tracks
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('rejects an invalid Spotify user ID containing path traversal', async () => {
      await expect(
        syncCompilationToSpotify(
          'comp-id',
          'Title',
          VALID_TRACKS,
          '../../../admin',
          'token',
        ),
      ).rejects.toThrow('Invalid request parameters')

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('throws when Spotify API returns an error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      } as unknown as Response)

      await expect(
        syncCompilationToSpotify(
          'comp-id',
          'Title',
          VALID_TRACKS,
          'valid_user',
          'bad_token',
        ),
      ).rejects.toThrow('Spotify API error 403')
    })
  })
})
