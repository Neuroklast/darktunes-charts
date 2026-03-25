import type { OdesliResult } from './types'

/** Base URL for the Odesli (song.link) public API. */
const ODESLI_API_BASE = 'https://api.odesli.co'

/**
 * Default ISO 3166-1 alpha-2 country code for Odesli lookups.
 * Controls which regional catalogue variants are returned.
 */
const DEFAULT_USER_COUNTRY = 'DE'

/**
 * Looks up streaming links for a track via the Odesli (song.link) API.
 *
 * Odesli aggregates platform-specific URLs (Spotify, Apple Music, Bandcamp, YouTube, etc.)
 * from a single source URL. The response includes artwork and metadata from all matched
 * platform entities.
 *
 * @param url - A canonical streaming URL (Spotify, Apple Music, YouTube, etc.)
 * @returns Resolved Odesli result with platform links and entity metadata, or null on failure.
 *
 * @example
 * const result = await fetchOdesliLinks('https://open.spotify.com/track/...')
 * result?.linksByPlatform['appleMusic']?.url // → Apple Music link
 */
export async function fetchOdesliLinks(url: string): Promise<OdesliResult | null> {
  try {
    const params = new URLSearchParams({ url, userCountry: DEFAULT_USER_COUNTRY })
    const response = await fetch(`${ODESLI_API_BASE}/links?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    })

    if (!response.ok) {
      console.error(`[Odesli] HTTP ${response.status} for URL: ${url}`)
      return null
    }

    const data: unknown = await response.json()
    return validateOdesliResponse(data)
  } catch (error) {
    console.error('[Odesli] Fetch failed:', error)
    return null
  }
}

/**
 * Looks up Odesli data by Spotify track ID.
 *
 * Convenience wrapper that constructs the canonical Spotify URL before querying.
 *
 * @param spotifyTrackId - The Spotify track ID (not the full URL).
 * @returns Resolved Odesli result or null on failure.
 */
export async function fetchOdesliBySpotifyId(spotifyTrackId: string): Promise<OdesliResult | null> {
  const spotifyUrl = `https://open.spotify.com/track/${spotifyTrackId}`
  return fetchOdesliLinks(spotifyUrl)
}

/**
 * Extracts the best available artwork URL from an Odesli result.
 *
 * Prefers the thumbnail from the Spotify entity, falls back to the first
 * available entity's thumbnail in the result set.
 *
 * @param result - A valid Odesli API result.
 * @returns The highest-quality artwork URL available, or undefined if none found.
 */
export function getBestArtworkFromOdesli(result: OdesliResult): string | undefined {
  const entities = Object.values(result.entitiesByUniqueId)

  // Prefer Spotify entity thumbnail for consistency
  const spotifyEntity = entities.find(e => e.apiProvider === 'spotify')
  if (spotifyEntity?.thumbnailUrl) return spotifyEntity.thumbnailUrl

  // Fallback to first entity with a thumbnail
  const fallback = entities.find(e => e.thumbnailUrl)
  return fallback?.thumbnailUrl
}

/**
 * Type-guard / validator for the raw Odesli API JSON response.
 * Guards against malformed or unexpected API responses at the system boundary.
 *
 * @param data - Raw parsed JSON from the Odesli API.
 * @returns A typed OdesliResult or null if the structure is invalid.
 */
function validateOdesliResponse(data: unknown): OdesliResult | null {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('pageUrl' in data) ||
    !('linksByPlatform' in data) ||
    !('entitiesByUniqueId' in data)
  ) {
    console.error('[Odesli] Unexpected response shape:', data)
    return null
  }

  return data as OdesliResult
}
