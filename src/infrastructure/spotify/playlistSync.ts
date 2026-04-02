/**
 * @module infrastructure/spotify/playlistSync
 *
 * Synchronises a DarkTunes compilation to a Spotify playlist via the
 * Spotify Web API using the Authorization Code Flow (user OAuth).
 *
 * This module requires USER-level OAuth tokens (not client credentials),
 * because creating/modifying playlists requires `playlist-modify-public`
 * or `playlist-modify-private` scopes on behalf of a user.
 *
 * The calling endpoint is responsible for providing a valid access token
 * obtained through the Authorization Code Flow. Refresh token management
 * is out of scope for this module.
 *
 * @see https://developer.spotify.com/documentation/web-api/reference/create-playlist
 */

import { z } from 'zod'

const SPOTIFY_API = 'https://api.spotify.com/v1'

export const CompilationTrackSchema = z.object({
  spotifyTrackUri: z.string().regex(/^spotify:track:[A-Za-z0-9]+$/, 'Invalid Spotify track URI'),
  title: z.string().min(1),
  artist: z.string().min(1),
})

export type CompilationTrack = z.infer<typeof CompilationTrackSchema>

interface SpotifyPlaylist {
  id: string
  external_urls: { spotify: string }
}

async function spotifyFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<unknown> {
  const response = await fetch(`${SPOTIFY_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '(no body)')
    throw new Error(`Spotify API error ${response.status}: ${body}`)
  }

  const text = await response.text()
  return text ? (JSON.parse(text) as unknown) : null
}

/**
 * Creates or updates a Spotify playlist from a compilation's track list.
 *
 * If `existingPlaylistId` is provided, the function replaces all tracks
 * in the existing playlist. Otherwise, a new playlist is created.
 *
 * @param compilationId      - DarkTunes compilation UUID (used for playlist description).
 * @param compilationTitle   - Human-readable playlist title.
 * @param tracks             - Ordered list of tracks with Spotify URIs.
 * @param spotifyUserId      - Spotify user ID of the playlist owner.
 * @param accessToken        - User OAuth access token with playlist-modify-public scope.
 * @param existingPlaylistId - Optional Spotify playlist ID to update instead of creating.
 * @returns The Spotify playlist URL.
 */
export async function syncCompilationToSpotify(
  compilationId: string,
  compilationTitle: string,
  tracks: CompilationTrack[],
  spotifyUserId: string,
  accessToken: string,
  existingPlaylistId?: string,
): Promise<string> {
  // Validate all track URIs before making any API calls
  const validatedTracks = tracks.map((t) => CompilationTrackSchema.parse(t))
  const uris = validatedTracks.map((t) => t.spotifyTrackUri)

  let playlistId = existingPlaylistId

  if (!playlistId) {
    // A10: SSRF — sanitise the Spotify user ID to prevent URL path injection.
    // Only alphanumeric, underscore, and hyphen characters are valid Spotify user IDs.
    const safeUserId = spotifyUserId.replace(/[^A-Za-z0-9_-]/g, '')
    if (safeUserId !== spotifyUserId) {
      throw new Error('Invalid request parameters')
    }

    const created = await spotifyFetch(
      `/users/${safeUserId}/playlists`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          name: compilationTitle,
          description: `DarkTunes Compilation ${compilationId} — community-curated dark music.`,
          public: true,
        }),
      },
    ) as SpotifyPlaylist

    playlistId = created.id
  }

  // Replace all tracks in the playlist (batched at 100 per Spotify API limit)
  const BATCH_SIZE = 100
  for (let i = 0; i < uris.length; i += BATCH_SIZE) {
    const batch = uris.slice(i, i + BATCH_SIZE)
    const method = i === 0 ? 'PUT' : 'POST'
    await spotifyFetch(`/playlists/${playlistId}/tracks`, accessToken, {
      method,
      body: JSON.stringify({ uris: batch }),
    })
  }

  return `https://open.spotify.com/playlist/${playlistId}`
}
