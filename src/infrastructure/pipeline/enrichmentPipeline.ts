/**
 * Track Enrichment Pipeline
 *
 * Orchestrates three automated bots after a track is submitted:
 *   1. Metadata Bot  — iTunes Search API → artwork, ISRC, preview URL
 *   2. Link Bot      — Odesli API        → universal streaming links
 *   3. Tier-Check Bot — Spotify API      → SML proxy → tier classification
 *
 * Each bot is independently fault-tolerant: failure in one does not abort
 * the others. All errors are collected and returned in EnrichmentResult.
 *
 * This function is called asynchronously from the cron job and NEVER
 * directly from a user-facing API route to prevent blocking.
 */

import { searchItunesTracks } from '@/lib/itunesApi'
import { fetchOdesliBySpotifyId } from '@/lib/odesliApi'
import { getMonthlyListeners } from '@/infrastructure/api/spotifyAdapter'
import type { EnrichmentResult } from '@/domain/releases/index'

/** Derive the Tier from Spotify follower count (used as SML proxy). */
function classifyTier(followers: number): string {
  if (followers >= 1_000_000) return 'MACRO'
  if (followers >= 250_000) return 'INTERNATIONAL'
  if (followers >= 50_000) return 'ESTABLISHED'
  if (followers >= 10_000) return 'EMERGING'
  return 'MICRO'
}

export interface TrackEnrichmentInput {
  trackId: string
  title: string
  artistName: string
  spotifyTrackId?: string
  spotifyArtistId?: string
  isrc?: string
}

/**
 * Runs the full enrichment pipeline for a submitted track.
 *
 * @param input - Track identifiers and search metadata
 * @returns     - Aggregated enrichment result with error list
 */
export async function enrichTrack(input: TrackEnrichmentInput): Promise<EnrichmentResult> {
  const errors: string[] = []
  let metadataSource: EnrichmentResult['metadataSource'] = 'none'
  let streamingLinksCount = 0
  let tierUpdated = false

  // ── Bot 1: Metadata (iTunes) ───────────────────────────────────────────────
  try {
    const term = `${input.artistName} ${input.title}`
    const tracks = await searchItunesTracks(term, 1)
    if (tracks.length > 0) {
      metadataSource = 'itunes'
      // TODO: await prisma.track.update({ where: { id: input.trackId }, data: { coverArtUrl: tracks[0]?.artworkUrl100, itunesTrackId: String(tracks[0]?.trackId) } })
    }
  } catch (err) {
    errors.push(`Metadata bot: ${err instanceof Error ? err.message : String(err)}`)
  }

  // ── Bot 2: Streaming Links (Odesli) ───────────────────────────────────────
  if (input.spotifyTrackId) {
    try {
      const odesli = await fetchOdesliBySpotifyId(input.spotifyTrackId)
      if (odesli) {
        const platforms = Object.keys(odesli.linksByPlatform)
        streamingLinksCount = platforms.length
        // TODO: await prisma.trackStreamingLink.createMany({ data: platforms.map(p => ({ trackId: input.trackId, platform: p, url: odesli.linksByPlatform[p]!.url })), skipDuplicates: true })
      }
    } catch (err) {
      errors.push(`Link bot: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  // ── Bot 3: Tier Check (Spotify) ────────────────────────────────────────────
  if (input.spotifyArtistId) {
    try {
      const listeners = await getMonthlyListeners(input.spotifyArtistId)
      const tier = classifyTier(listeners.followers)
      tierUpdated = true
      // TODO: await prisma.band.update({ where: { id: ... }, data: { tier, spotifyMonthlyListeners: listeners.followers } })
      void tier // suppress unused-variable warning until DB writes are enabled
    } catch (err) {
      errors.push(`Tier-check bot: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return {
    trackId: input.trackId,
    enrichedAt: new Date(),
    metadataSource,
    streamingLinksCount,
    tierUpdated,
    errors,
  }
}
