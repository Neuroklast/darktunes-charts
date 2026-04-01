/**
 * @module infrastructure/spotify/service
 *
 * Pure service functions for Spotify data access and band tier management.
 *
 * Responsibilities:
 * - URI parsing (extracts artist IDs from `spotify:artist:<id>` URIs)
 * - Thin wrappers around SpotifyClient for callers that only have a URI
 * - Band tier refresh: reads from DB, fetches Spotify, writes updated tier back
 *
 * The batch refresh (`refreshAllBandTiers`) inserts a 100 ms delay between
 * each band to avoid saturating the Spotify rate limit during cron runs.
 */

import { prisma } from '@/lib/prisma'
import { getTierFromListeners } from '@/domain/tiers'
import type { Tier } from '@/lib/types'
import { spotifyClient } from './client'
import type { SpotifyArtistData, SpotifyTrackData } from './client'

// Re-export for convenience so callers only need this module.
export type { SpotifyArtistData, SpotifyTrackData }

// ─── URI helpers ──────────────────────────────────────────────────────────────

/**
 * Extracts the artist ID from a Spotify URI.
 *
 * Expected format: `spotify:artist:<ARTIST_ID>`
 *
 * @param spotifyUri - Full Spotify artist URI.
 * @returns The bare artist ID string.
 * @throws {Error} If the URI does not match the expected format.
 */
function extractArtistIdFromUri(spotifyUri: string): string {
  const parts = spotifyUri.split(':')
  const [scheme, type, id] = parts

  if (parts.length !== 3 || scheme !== 'spotify' || type !== 'artist' || !id) {
    throw new Error(`Invalid Spotify URI format: "${spotifyUri}". Expected "spotify:artist:<id>"`)
  }

  return id
}

// ─── Public service functions ─────────────────────────────────────────────────

/**
 * Fetches Spotify artist data by Spotify URI.
 *
 * @param spotifyUri - Full Spotify artist URI (e.g. `spotify:artist:4Z8W4fKeB5YxbusRsdQVPb`).
 * @returns Normalized Spotify artist data.
 */
export async function getArtistByUri(spotifyUri: string): Promise<SpotifyArtistData> {
  const artistId = extractArtistIdFromUri(spotifyUri)
  return spotifyClient.fetchArtist(artistId)
}

/**
 * Fetches an artist's top tracks by Spotify URI.
 *
 * @param spotifyUri - Full Spotify artist URI.
 * @returns Array of normalized track data (up to 10).
 */
export async function getArtistTopTracks(spotifyUri: string): Promise<SpotifyTrackData[]> {
  const artistId = extractArtistIdFromUri(spotifyUri)
  return spotifyClient.fetchArtistTopTracks(artistId)
}

/**
 * Searches Spotify for artists matching the given query.
 *
 * @param query - Free-text search string.
 * @returns Up to 10 matching artists.
 */
export async function searchArtist(query: string): Promise<SpotifyArtistData[]> {
  return spotifyClient.searchArtist(query)
}

// ─── Tier refresh ─────────────────────────────────────────────────────────────

/** Minimum delay between Spotify API calls during batch refresh. */
const RATE_LIMIT_DELAY_MS = 100

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Maps a domain Tier value (Pascal case) to the Prisma enum string (UPPERCASE).
 *
 * Using an explicit map rather than `.toUpperCase()` makes the mapping intention
 * clear and ensures an early error if the domain Tier type ever diverges from
 * what the Prisma schema expects.
 *
 * Domain:  'Micro' | 'Emerging' | 'Established' | 'International' | 'Macro'
 * Prisma:  'MICRO' | 'EMERGING' | 'ESTABLISHED' | 'INTERNATIONAL' | 'MACRO'
 */
const TIER_TO_PRISMA_TIER: Readonly<Record<Tier, string>> = {
  Micro: 'MICRO',
  Emerging: 'EMERGING',
  Established: 'ESTABLISHED',
  International: 'INTERNATIONAL',
  Macro: 'MACRO',
}

function tierToPrismaTier(tier: Tier): string {
  const mapped = TIER_TO_PRISMA_TIER[tier]
  if (!mapped) {
    throw new Error(`Unknown tier value: "${String(tier)}"`)
  }
  return mapped
}

/**
 * Refreshes the tier classification for a single band.
 *
 * Flow:
 * 1. Loads the band record (id + spotifyUri) from the database.
 * 2. Fetches current follower count from Spotify (used as monthly-listener proxy).
 * 3. Derives the new tier via `getTierFromListeners`.
 * 4. Persists `spotifyMonthlyListeners` and `tier` back to the database.
 *
 * @param bandId - Internal database ID of the band.
 * @returns Object with the new tier label and raw listener count.
 * @throws {Error} If the band is not found or has no `spotifyUri`.
 */
export async function refreshBandTier(
  bandId: string,
): Promise<{ bandId: string; newTier: string; listeners: number }> {
  const band = await prisma.band.findUnique({
    where: { id: bandId },
    select: { id: true, spotifyUri: true },
  })

  if (!band) {
    throw new Error(`Band not found: ${bandId}`)
  }

  if (!band.spotifyUri) {
    throw new Error(`Band ${bandId} has no Spotify URI`)
  }

  const artistData = await getArtistByUri(band.spotifyUri)
  // Spotify's public API does not expose monthly listeners directly;
  // follower count is the best available proxy.
  const listeners = artistData.followers
  const newTier: Tier = getTierFromListeners(listeners)

  await prisma.band.update({
    where: { id: bandId },
    data: {
      spotifyMonthlyListeners: listeners,
      tier: tierToPrismaTier(newTier) as never,
    },
  })

  return { bandId, newTier, listeners }
}

/**
 * Refreshes tier classifications for all bands that have a `spotifyUri`.
 *
 * Errors for individual bands are caught and counted rather than propagated,
 * so a single failing band does not abort the entire batch.
 *
 * A 100 ms pause is inserted between API calls to stay within Spotify's
 * rate limits during the weekly cron run.
 *
 * @returns Summary with the number of successfully updated and failed bands.
 */
export async function refreshAllBandTiers(): Promise<{ updated: number; failed: number }> {
  const bands = await prisma.band.findMany({
    where: { spotifyUri: { not: null } },
    select: { id: true },
  })

  let updated = 0
  let failed = 0

  for (const band of bands) {
    try {
      await refreshBandTier(band.id)
      updated++
    } catch {
      failed++
    }

    await delay(RATE_LIMIT_DELAY_MS)
  }

  return { updated, failed }
}
