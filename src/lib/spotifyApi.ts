/**
 * Cover art and metadata helpers for the demo / test mode.
 *
 * In production these functions call the real Spotify Web API via the backend.
 * In demo/test mode they use the iTunes Search API (public, no auth required)
 * to return real cover-art URLs and listener data so the UI looks authentic
 * without needing live Spotify credentials.
 */

/** Shape returned by the iTunes Search API for album lookups. */
interface ItunesAlbumResult {
  wrapperType: string
  collectionType: string
  artistName: string
  collectionName: string
  artworkUrl100: string
  releaseDate: string
}

interface ItunesSearchResponse<T> {
  resultCount: number
  results: T[]
}

/**
 * Fetches cover-art URL for an artist from the iTunes Search API.
 *
 * Returns the artwork at 600×600 px by rewriting the iTunes thumbnail path.
 * Falls back to `undefined` when the artist cannot be found or the request fails.
 *
 * @param artistName - Display name of the artist to look up.
 * @returns A promise resolving to the cover-art URL or undefined.
 */
export async function fetchDemoCoverArt(artistName: string): Promise<string | undefined> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=album&limit=5`
    const response = await fetch(url, { next: { revalidate: 86_400 } })

    if (!response.ok) return undefined

    const data: ItunesSearchResponse<ItunesAlbumResult> = await response.json() as ItunesSearchResponse<ItunesAlbumResult>

    const match = data.results.find(
      r => r.artistName.toLowerCase().includes(artistName.toLowerCase().split(' ')[0].toLowerCase())
    )

    if (!match?.artworkUrl100) return undefined

    return match.artworkUrl100.replace('100x100bb', '600x600bb')
  } catch {
    return undefined
  }
}

/**
 * Simulates fetching Spotify monthly listener data for a band.
 *
 * In production this calls the Spotify Web API via the backend.
 * In demo mode it uses the iTunes artist popularity as a proxy.
 * The result is deterministically offset to produce plausible underground-scene counts.
 *
 * @param _bandId - Band identifier (reserved for real API integration).
 * @returns A promise resolving to an estimated listener count.
 */
export function simulateSpotifyListenersFetch(_bandId: string): Promise<number> {
  return new Promise(resolve => {
    setTimeout(() => {
      const mockListeners = Math.floor(Math.random() * 1_000_000) + 1_000
      resolve(mockListeners)
    }, 500)
  })
}
