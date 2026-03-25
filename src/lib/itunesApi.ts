import type { ItunesTrack } from './types'

/** iTunes Search API base URL — no auth required for read-only lookups. */
const ITUNES_API_BASE = 'https://itunes.apple.com'

/** Minimum number of results per iTunes search request. */
const MIN_SEARCH_LIMIT = 1

/** Maximum number of results per iTunes search request (Apple's documented cap). */
const MAX_SEARCH_LIMIT = 200

/**
 * Searches the iTunes Search API for tracks matching a given query.
 *
 * Used to fetch artwork, preview URLs, genre labels, and purchase links for
 * tracks submitted to the darkTunes platform. iTunes artwork URLs support
 * resolution replacement (e.g., replace `100x100` with `600x600`).
 *
 * Rate limit: Apple does not publish an official rate limit but the API
 * is intended for low-volume lookups. Batch requests where possible.
 *
 * @param term - Search term (typically "Artist Track Title").
 * @param limit - Maximum number of results (1–200, default 5).
 * @param country - ISO 3166-1 alpha-2 country code for regional catalogue (default 'DE').
 * @returns Array of matched iTunes tracks, empty array on failure.
 *
 * @example
 * const results = await searchItunesTracks('Rammstein Sonne', 3)
 * results[0]?.artworkUrl100  // → 100px artwork URL
 */
export async function searchItunesTracks(
  term: string,
  limit = 5,
  country = 'DE',
): Promise<ItunesTrack[]> {
  try {
    const params = new URLSearchParams({
      term,
      country,
      media: 'music',
      entity: 'song',
      limit: String(Math.min(Math.max(limit, MIN_SEARCH_LIMIT), MAX_SEARCH_LIMIT)),
    })

    const response = await fetch(
      `${ITUNES_API_BASE}/search?${params.toString()}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8_000),
      },
    )

    if (!response.ok) {
      console.error(`[iTunes] HTTP ${response.status} for term: "${term}"`)
      return []
    }

    const data: unknown = await response.json()
    return extractItunesTracks(data)
  } catch (error) {
    console.error('[iTunes] Search failed:', error)
    return []
  }
}

/**
 * Looks up a specific track by its iTunes track ID.
 *
 * @param trackId - Numeric iTunes track ID.
 * @param country - ISO 3166-1 alpha-2 country code (default 'DE').
 * @returns The matched ItunesTrack or null if not found.
 */
export async function lookupItunesTrack(
  trackId: number,
  country = 'DE',
): Promise<ItunesTrack | null> {
  try {
    const params = new URLSearchParams({
      id: String(trackId),
      country,
      entity: 'song',
    })

    const response = await fetch(
      `${ITUNES_API_BASE}/lookup?${params.toString()}`,
      {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8_000),
      },
    )

    if (!response.ok) {
      console.error(`[iTunes] HTTP ${response.status} for ID: ${trackId}`)
      return null
    }

    const data: unknown = await response.json()
    const results = extractItunesTracks(data)
    return results[0] ?? null
  } catch (error) {
    console.error('[iTunes] Lookup failed:', error)
    return null
  }
}

/**
 * Upgrades an iTunes artwork URL to high resolution (600×600).
 *
 * Apple's API returns 100×100 thumbnails by default. The resolution suffix
 * can safely be replaced to retrieve the larger source image.
 *
 * @param url100 - The 100×100 artwork URL from iTunes.
 * @returns A 600×600 artwork URL.
 */
export function getHighResArtwork(url100: string): string {
  return url100.replace('100x100', '600x600')
}

/**
 * Type-guard / extractor for the raw iTunes Search API JSON response.
 *
 * @param data - Raw parsed JSON from the iTunes API.
 * @returns Array of validated ItunesTrack objects.
 */
function extractItunesTracks(data: unknown): ItunesTrack[] {
  if (
    typeof data !== 'object' ||
    data === null ||
    !('results' in data) ||
    !Array.isArray((data as Record<string, unknown>).results)
  ) {
    console.error('[iTunes] Unexpected response shape:', data)
    return []
  }

  const raw = (data as { results: unknown[] }).results
  const tracks: ItunesTrack[] = []

  for (const item of raw) {
    if (
      typeof item === 'object' &&
      item !== null &&
      'trackId' in item &&
      'trackName' in item &&
      'artistName' in item &&
      'artworkUrl100' in item
    ) {
      tracks.push(item as ItunesTrack)
    }
  }

  return tracks
}
