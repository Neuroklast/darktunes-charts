/**
 * @module infrastructure/spotify/client
 *
 * Spotify Web API client with OAuth Client Credentials flow, token caching,
 * and 429 rate-limit back-off.
 *
 * Token caching: tokens are reused until 60 seconds before expiry to avoid
 * race conditions on concurrent requests.
 *
 * Rate limiting: when Spotify returns a 429, the client records the retry-after
 * time and refuses further requests until that window has passed, propagating a
 * clear error to the caller.
 */

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

/** Seconds before token expiry at which a proactive refresh is triggered. */
const TOKEN_REFRESH_BUFFER_MS = 60_000

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface SpotifyArtistData {
  id: string
  name: string
  uri: string
  followers: number
  popularity: number
  genres: string[]
  images: Array<{ url: string; height: number; width: number }>
  externalUrl: string
}

export interface SpotifyTrackData {
  id: string
  name: string
  uri: string
  previewUrl: string | null
  externalUrl: string
  album: { id: string; name: string; imageUrl: string | null }
}

// ─── Raw Spotify API shapes ───────────────────────────────────────────────────

interface SpotifyTokenResponse {
  access_token: string
  expires_in: number
}

interface RawSpotifyArtist {
  id: string
  name: string
  uri: string
  followers: { total: number }
  popularity: number
  genres: string[]
  images: Array<{ url: string; height: number; width: number }>
  external_urls: { spotify: string }
}

interface RawSpotifyTrack {
  id: string
  name: string
  uri: string
  preview_url: string | null
  external_urls: { spotify: string }
  album: {
    id: string
    name: string
    images: Array<{ url: string; height: number; width: number }>
  }
}

interface SpotifyTopTracksResponse {
  tracks: RawSpotifyTrack[]
}

interface SpotifySearchResponse {
  artists: { items: RawSpotifyArtist[] }
}

// ─── SpotifyClient ────────────────────────────────────────────────────────────

class SpotifyClient {
  private tokenCache: { token: string; expiresAt: number } | null = null
  private rateLimitResetAt: number | null = null

  /**
   * Returns a valid access token, refreshing from the token endpoint when
   * the cached token is within the buffer window of expiry.
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now()

    if (this.tokenCache && this.tokenCache.expiresAt > now + TOKEN_REFRESH_BUFFER_MS) {
      return this.tokenCache.token
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

    const data = (await response.json()) as SpotifyTokenResponse
    const expiresAt = now + data.expires_in * 1000
    this.tokenCache = { token: data.access_token, expiresAt }
    return data.access_token
  }

  /**
   * Throws if a rate-limit back-off window is currently active.
   * Called before every API request.
   */
  private checkRateLimit(): void {
    if (this.rateLimitResetAt !== null && Date.now() < this.rateLimitResetAt) {
      const waitSec = Math.ceil((this.rateLimitResetAt - Date.now()) / 1000)
      throw new Error(`Spotify rate limit active. Retry after ${waitSec}s`)
    }
  }

  /**
   * Records the back-off window from a 429 response.
   * Uses the Retry-After header value (seconds) or defaults to 60 s.
   */
  private recordRateLimit(response: Response): void {
    const retryAfter = response.headers.get('Retry-After')
    const delaySec = retryAfter ? parseInt(retryAfter, 10) : 60
    this.rateLimitResetAt = Date.now() + delaySec * 1000
  }

  private mapArtist(raw: RawSpotifyArtist): SpotifyArtistData {
    return {
      id: raw.id,
      name: raw.name,
      uri: raw.uri,
      followers: raw.followers.total,
      popularity: raw.popularity,
      genres: raw.genres,
      images: raw.images,
      externalUrl: raw.external_urls.spotify,
    }
  }

  private mapTrack(raw: RawSpotifyTrack): SpotifyTrackData {
    return {
      id: raw.id,
      name: raw.name,
      uri: raw.uri,
      previewUrl: raw.preview_url,
      externalUrl: raw.external_urls.spotify,
      album: {
        id: raw.album.id,
        name: raw.album.name,
        imageUrl: raw.album.images[0]?.url ?? null,
      },
    }
  }

  /**
   * Fetches a single artist by their Spotify ID.
   *
   * @param artistId - Spotify artist ID (e.g. "4Z8W4fKeB5YxbusRsdQVPb").
   * @throws {Error} On 429 rate-limit or other HTTP error.
   */
  async fetchArtist(artistId: string): Promise<SpotifyArtistData> {
    this.checkRateLimit()
    const token = await this.getAccessToken()

    const response = await fetch(
      `${SPOTIFY_API_BASE}/artists/${encodeURIComponent(artistId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (response.status === 429) {
      this.recordRateLimit(response)
      throw new Error(`Spotify rate limit exceeded for artist ${artistId}`)
    }

    if (!response.ok) {
      throw new Error(`Spotify fetchArtist failed for ${artistId}: ${response.status}`)
    }

    return this.mapArtist((await response.json()) as RawSpotifyArtist)
  }

  /**
   * Fetches an artist's top tracks.
   *
   * @param artistId - Spotify artist ID.
   * @param market   - ISO 3166-1 alpha-2 market code (default: "DE").
   * @throws {Error} On 429 rate-limit or other HTTP error.
   */
  async fetchArtistTopTracks(artistId: string, market = 'DE'): Promise<SpotifyTrackData[]> {
    this.checkRateLimit()
    const token = await this.getAccessToken()

    const url =
      `${SPOTIFY_API_BASE}/artists/${encodeURIComponent(artistId)}/top-tracks?market=${market}`

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

    if (response.status === 429) {
      this.recordRateLimit(response)
      throw new Error(`Spotify rate limit exceeded for top-tracks ${artistId}`)
    }

    if (!response.ok) {
      throw new Error(`Spotify fetchArtistTopTracks failed for ${artistId}: ${response.status}`)
    }

    const data = (await response.json()) as SpotifyTopTracksResponse
    return data.tracks.map((t) => this.mapTrack(t))
  }

  /**
   * Searches for artists matching the given query.
   *
   * @param query - Free-text search string.
   * @returns Up to 10 matching artists.
   * @throws {Error} On 429 rate-limit or other HTTP error.
   */
  async searchArtist(query: string): Promise<SpotifyArtistData[]> {
    this.checkRateLimit()
    const token = await this.getAccessToken()

    const url =
      `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=artist&limit=10`

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

    if (response.status === 429) {
      this.recordRateLimit(response)
      throw new Error('Spotify rate limit exceeded for artist search')
    }

    if (!response.ok) {
      throw new Error(`Spotify searchArtist failed: ${response.status}`)
    }

    const data = (await response.json()) as SpotifySearchResponse
    return data.artists.items.map((a) => this.mapArtist(a))
  }
}

/** Singleton Spotify API client (shared across all server-side callers). */
export const spotifyClient = new SpotifyClient()
