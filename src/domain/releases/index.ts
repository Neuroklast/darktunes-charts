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

// ─── Release Domain Model (ADR-016) ──────────────────────────────────────────

import type { AllCategory } from '@/lib/types'
import type { GenreTag } from '@/domain/genres'
import { CATEGORY_DEFINITIONS } from '@/domain/categories'

/** Supported streaming/distribution platforms. */
export type PlatformName =
  | 'spotify'
  | 'apple-music'
  | 'youtube-music'
  | 'bandcamp'
  | 'tidal'
  | 'deezer'

/** A link to a release on a specific streaming platform. */
export interface PlatformLink {
  platform: PlatformName
  url: string
}

/** Release type — full album, extended play, or single. */
export type ReleaseType = 'album' | 'ep' | 'single'

/**
 * A music release submitted to the darkTunes Charts platform.
 * DJs vote on releases (not individual tracks) for the Schulze ranked-choice ballot.
 */
export interface Release {
  id: string
  bandId: string
  title: string
  type: ReleaseType
  releaseDate: Date
  trackCount: number
  genres: GenreTag[]
  streamingLinks: PlatformLink[]
  coverArtUrl: string
  submittedToCategories: AllCategory[]
}

/**
 * Validates a release before it is persisted or submitted.
 *
 * Rules:
 * - `id`, `bandId`, `title`, `coverArtUrl` must be non-empty strings.
 * - `trackCount` must be a positive integer.
 * - `genres` must have 1–3 entries.
 * - `submittedToCategories` must be non-empty.
 * - `releaseDate` must be a valid Date.
 *
 * @param release - The release to validate.
 * @returns Validation result with `valid` flag and `errors` array.
 */
export function validateRelease(release: Release): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!release.id || release.id.trim().length === 0) {
    errors.push('Release ID is required.')
  }
  if (!release.bandId || release.bandId.trim().length === 0) {
    errors.push('Band ID is required.')
  }
  if (!release.title || release.title.trim().length === 0) {
    errors.push('Title is required.')
  }
  if (!release.coverArtUrl || release.coverArtUrl.trim().length === 0) {
    errors.push('Cover art URL is required.')
  }
  if (!Number.isInteger(release.trackCount) || release.trackCount < 1) {
    errors.push('Track count must be a positive integer.')
  }
  if (release.genres.length === 0) {
    errors.push('At least one genre is required.')
  }
  if (release.genres.length > 3) {
    errors.push('A release may have at most 3 genres.')
  }
  if (release.submittedToCategories.length === 0) {
    errors.push('At least one chart category must be selected.')
  }
  if (!(release.releaseDate instanceof Date) || isNaN(release.releaseDate.getTime())) {
    errors.push('Release date must be a valid date.')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Determines whether a release may be submitted to a specific chart category.
 *
 * Category eligibility depends on release type:
 * - Albums/EPs → album-oriented and general categories.
 * - Singles → track-oriented and general categories.
 * - Community/open categories accept any release type.
 *
 * @param release  - The release to check.
 * @param category - The target chart category.
 * @returns `true` if the release type is compatible with the category.
 */
export function canSubmitToCategory(release: Release, category: AllCategory): boolean {
  const meta = CATEGORY_DEFINITIONS[category]

  // Community categories are open to all release types
  if (meta.group === 'community') return true

  // Album-specific categories require album or EP
  if (category === 'album' || category === 'dark-concept') {
    return release.type === 'album' || release.type === 'ep'
  }

  // Track-specific categories require single
  if (category === 'track' || category === 'underground-anthem') {
    return release.type === 'single'
  }

  // All other categories (visuals, music performance, etc.) accept any type
  return true
}
