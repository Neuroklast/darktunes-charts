/**
 * Release Management Pipeline — Domain Types
 *
 * Defines the data contracts for the hybrid track ingestion pipeline:
 * Self-service submission → Metadata Bot → Link Bot → Tier-Check Bot
 */

import { z } from 'zod'

/** Allowed genre values — mirrors the Prisma Genre enum. */
export const GENRE_VALUES = [
  'GOTH', 'METAL', 'DARK_ELECTRO', 'POST_PUNK', 'INDUSTRIAL',
  'DARKWAVE', 'EBM', 'SYMPHONIC_METAL', 'AGGROTECH', 'NEOFOLK',
] as const

export type Genre = typeof GENRE_VALUES[number]

/** Zod schema for validating a track submission. */
export const TrackSubmissionSchema = z.object({
  /** The submitting band's database ID. */
  bandId: z.string().uuid(),
  /** Track title — used for iTunes search if no direct ID provided. */
  title: z.string().min(1).max(200),
  /** Primary genre category for this submission. */
  genre: z.enum(GENRE_VALUES),
  /**
   * Optional ISRC — if provided, used as the canonical deduplication key.
   * Format: 12 characters — CC XXX YY NNNNN (no hyphens stored)
   *   CC     = ISO 3166-1 alpha-2 country code (registrant country)
   *   XXX    = 3-char alphanumeric registrant code (assigned by IFPI)
   *   YY     = 2-digit year of reference
   *   NNNNN  = 5-digit designation code (sequential within registrant/year)
   * Example: DEA712345678 → DE (Germany) + A71 (registrant) + 23 (2023) + 45678
   */
  isrc: z.string().regex(/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/, 'Invalid ISRC format').optional(),
  /** Spotify track URL or ID — triggers the Odesli + Tier-Check bots. */
  spotifyTrackId: z.string().optional(),
  /** iTunes track ID — if provided, skips the metadata search step. */
  itunesTrackId: z.string().optional(),
})

export type TrackSubmission = z.infer<typeof TrackSubmissionSchema>

/** Result of the enrichment pipeline for a single track. */
export interface EnrichmentResult {
  trackId: string
  enrichedAt: Date
  metadataSource: 'itunes' | 'manual' | 'none'
  streamingLinksCount: number
  tierUpdated: boolean
  errors: string[]
}

/** Status of a track in the enrichment queue. */
export type EnrichmentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED'

/** Scouting suggestion produced by the Discovery Bot. */
export interface ScoutingSuggestion {
  spotifyTrackId: string
  spotifyArtistId: string
  artistName: string
  trackName: string
  genre: string
  spotifyMonthlyListeners: number
  releaseDate: string
  artworkUrl: string
  previewUrl?: string
  reason: 'new_release' | 'velocity_spike' | 'genre_match'
  confidenceScore: number
}
