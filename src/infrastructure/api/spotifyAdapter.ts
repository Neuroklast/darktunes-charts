/**
 * Spotify Web API adapter.
 *
 * Handles OAuth 2.0 Client Credentials flow for server-side API calls.
 * Only read-only, non-user-specific endpoints are used (monthly listener counts),
 * so the simpler client_credentials grant is appropriate here.
 *
 * Rate limits: Spotify enforces per-application rate limits (typically
 * ~100 requests/second). In production, monthly listener data should be
 * cached in the database and refreshed on a daily cron schedule rather than
 * fetched on every request.
 *
 * @see https://developer.spotify.com/documentation/web-api
 */

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

export interface SpotifyArtist {
  id: string
  name: string
  followers: { total: number }
  genres: string[]
  images: Array<{ url: string; height: number; width: number }>
  popularity: number
  external_urls: { spotify: string }
}

export interface SpotifyMonthlyListeners {
  artistId: string
  /** Spotify's popularity score (0–100) used as proxy for monthly listeners. */
  popularity: number
  /** Followers count. */
  followers: number
}

/** Buffer time before token expiry to trigger a proactive refresh, avoiding race conditions. */
const TOKEN_REFRESH_BUFFER_MS = 60_000

/** Next.js ISR cache duration for Spotify artist data (24 hours). */
const SPOTIFY_CACHE_DURATION_SECONDS = 86_400

/** In-memory token cache for the Client Credentials grant. */
let cachedToken: { token: string; expiresAt: number } | null = null



/**
 * Fetches a Spotify API access token using the Client Credentials flow.
 * Tokens are cached in memory and reused until 60 seconds before expiry.
 *
 * @throws Error if SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is missing.
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now()

  if (cachedToken && cachedToken.expiresAt > now + TOKEN_REFRESH_BUFFER_MS) {
    return cachedToken.token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }
  const expiresAt = now + data.expires_in * 1000

  cachedToken = { token: data.access_token, expiresAt }
  return data.access_token
}

/**
 * Fetches artist data from the Spotify Web API.
 *
 * @param artistId - Spotify artist ID (e.g. "4Z8W4fKeB5YxbusRsdQVPb").
 * @returns Artist data including popularity and follower count.
 * @throws Error on network failure or 4xx/5xx response.
 */
export async function fetchSpotifyArtist(artistId: string): Promise<SpotifyArtist> {
  const token = await getAccessToken()

  const response = await fetch(`${SPOTIFY_API_BASE}/artists/${encodeURIComponent(artistId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: SPOTIFY_CACHE_DURATION_SECONDS },
  })

  if (!response.ok) {
    throw new Error(`Spotify artist fetch failed for ${artistId}: ${response.status}`)
  }

  return (await response.json()) as SpotifyArtist
}

/**
 * Retrieves the monthly listener proxy (popularity + follower count) for a Spotify artist.
 *
 * Note: Spotify's public API does not expose monthly listener counts directly.
 * The popularity score (0–100) and follower count serve as reasonable proxies
 * for relative listener size and are used by the tier classification system.
 *
 * @param artistId - Spotify artist ID.
 * @returns Monthly listener proxy metrics.
 */
export async function getMonthlyListeners(artistId: string): Promise<SpotifyMonthlyListeners> {
  const artist = await fetchSpotifyArtist(artistId)

  return {
    artistId,
    popularity: artist.popularity,
    followers: artist.followers.total,
  }
}
