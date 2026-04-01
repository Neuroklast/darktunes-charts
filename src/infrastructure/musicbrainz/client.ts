/**
 * @module infrastructure/musicbrainz/client
 *
 * Simple MusicBrainz Web API client (no authentication required).
 *
 * MusicBrainz requires a descriptive User-Agent header to identify the
 * consuming application. Requests without it are rate-limited more aggressively.
 *
 * @see https://musicbrainz.org/doc/MusicBrainz_API
 */

const MB_API_BASE = 'https://musicbrainz.org/ws/2'

/** User-Agent required by MusicBrainz API guidelines. */
const USER_AGENT = 'darktunes-charts/1.0 (https://darktunes-charts.vercel.app)'

// ─── Public interfaces ────────────────────────────────────────────────────────

export interface MusicBrainzArtist {
  id: string
  name: string
  country?: string
  genres: string[]
  disambiguation?: string
  type?: string
}

// ─── Raw MusicBrainz API shapes ───────────────────────────────────────────────

interface RawMBArtist {
  id: string
  name: string
  country?: string
  /** MusicBrainz exposes genres under "tags" in the JSON response. */
  tags?: Array<{ name: string; count: number }>
  disambiguation?: string
  type?: string
}

interface MBArtistSearchResponse {
  artists: RawMBArtist[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapArtist(raw: RawMBArtist): MusicBrainzArtist {
  return {
    id: raw.id,
    name: raw.name,
    country: raw.country,
    genres: (raw.tags ?? []).map((t) => t.name),
    disambiguation: raw.disambiguation,
    type: raw.type,
  }
}

const defaultHeaders = { 'User-Agent': USER_AGENT }

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Fetches a single artist from MusicBrainz by MBID.
 *
 * @param mbid - MusicBrainz artist identifier (UUID v4 format).
 * @returns Normalized artist record.
 * @throws {Error} On HTTP error.
 */
export async function getArtistByMBID(mbid: string): Promise<MusicBrainzArtist> {
  const response = await fetch(
    `${MB_API_BASE}/artist/${encodeURIComponent(mbid)}?fmt=json`,
    { headers: defaultHeaders },
  )

  if (!response.ok) {
    throw new Error(`MusicBrainz getArtistByMBID failed for ${mbid}: ${response.status}`)
  }

  return mapArtist((await response.json()) as RawMBArtist)
}

/**
 * Searches MusicBrainz for artists matching the given query string.
 *
 * Returns the first page of up to 10 results.
 *
 * @param query - Free-text search string (supports Lucene syntax).
 * @returns Array of normalized artist records.
 * @throws {Error} On HTTP error.
 */
export async function searchArtist(query: string): Promise<MusicBrainzArtist[]> {
  const response = await fetch(
    `${MB_API_BASE}/artist/?query=${encodeURIComponent(query)}&fmt=json&limit=10`,
    { headers: defaultHeaders },
  )

  if (!response.ok) {
    throw new Error(`MusicBrainz searchArtist failed: ${response.status}`)
  }

  const data = (await response.json()) as MBArtistSearchResponse
  return data.artists.map(mapArtist)
}
