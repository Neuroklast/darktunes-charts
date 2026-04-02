/**
 * @module domain/market
 *
 * Domain types and pure logic for the Market Signal (Dark Market Index) feature.
 *
 * The Market Index provides bands and labels with an external performance signal
 * based on real platform data. It does NOT influence chart computation; it is
 * surfaced only in Pro/Pro+ dashboards and label analytics.
 *
 * Index calculation (0–100):
 * - Spotify monthly listeners (weight 0.40)
 * - YouTube view velocity, last 30 days (weight 0.30)
 * - Web-radio plays (weight 0.20)
 * - Bandcamp presence (weight 0.10, self-reported or API)
 *
 * Each raw value is normalised within its tier peer group before weighting,
 * so the score always reflects market position relative to peers.
 */

import { z } from 'zod'

// ─── Domain types ─────────────────────────────────────────────────────────────

/** Data sources that contribute to the Market Index. */
export type MarketDataSource = 'SPOTIFY' | 'YOUTUBE' | 'BANDCAMP' | 'WEBRADIO'

/** A single market data snapshot for a band from one source. */
export interface MarketSnapshotRecord {
  id: string
  bandId: string
  source: MarketDataSource
  /** Raw metric value (e.g. monthly listeners, play count). */
  value: number
  /** Optional source-specific metadata (e.g. track title for webradio plays). */
  metadata: Record<string, unknown> | null
  snapshotDate: Date
  createdAt: Date
}

/** Aggregated market signals for a single band. */
export interface BandMarketSignals {
  bandId: string
  spotifyMonthlyListeners: number | null
  youtubeViewVelocity: number | null
  webradioPlays: number | null
  bandcampPresence: number | null
}

/** Computed Market Index result for a band (0–100). */
export interface MarketIndexResult {
  bandId: string
  index: number
  breakdown: {
    spotify: number
    youtube: number
    webradio: number
    bandcamp: number
  }
  computedAt: Date
}

// ─── Weights ──────────────────────────────────────────────────────────────────

const WEIGHTS = {
  spotify: 0.4,
  youtube: 0.3,
  webradio: 0.2,
  bandcamp: 0.1,
} as const

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Normalises a raw metric value to a 0–100 score using a soft log scale.
 *
 * This prevents a single huge outlier from dominating the index.
 * Formula: `min(100, Math.log10(value + 1) / Math.log10(maxValue + 1) * 100)`
 *
 * @param value    - Raw metric value (≥ 0). Negative values are clamped to 0.
 * @param maxValue - Expected maximum value for this metric in the peer group.
 */
export function normaliseMetric(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0
  const safeValue = Math.max(0, value)
  const normalised = Math.log10(safeValue + 1) / Math.log10(maxValue + 1)
  return Math.min(100, normalised * 100)
}

/**
 * Computes the Dark Market Index (0–100) from a set of band market signals.
 *
 * @param signals   - Aggregated signals per data source.
 * @param peakValues - Expected peer-group maximum values per source, used for normalisation.
 */
export function computeMarketIndex(
  signals: BandMarketSignals,
  peakValues: { spotify: number; youtube: number; webradio: number; bandcamp: number },
): MarketIndexResult {
  const spotify = normaliseMetric(signals.spotifyMonthlyListeners ?? 0, peakValues.spotify)
  const youtube = normaliseMetric(signals.youtubeViewVelocity ?? 0, peakValues.youtube)
  const webradio = normaliseMetric(signals.webradioPlays ?? 0, peakValues.webradio)
  const bandcamp = normaliseMetric(signals.bandcampPresence ?? 0, peakValues.bandcamp)

  const index =
    spotify * WEIGHTS.spotify +
    youtube * WEIGHTS.youtube +
    webradio * WEIGHTS.webradio +
    bandcamp * WEIGHTS.bandcamp

  return {
    bandId: signals.bandId,
    index: Math.round(index * 10) / 10,
    breakdown: { spotify, youtube, webradio, bandcamp },
    computedAt: new Date(),
  }
}

// ─── Web-radio import schema ──────────────────────────────────────────────────

/**
 * Schema for a single web-radio import entry.
 *
 * Expected JSON format from partner radio stations or MI On Air exports.
 * Each entry represents one play event for one band.
 */
export const WebRadioImportEntrySchema = z.object({
  bandId: z.string().uuid('Invalid band ID'),
  stationName: z.string().min(1).max(200),
  /** ISO 8601 timestamp of when the song was played. */
  playedAt: z.string().datetime({ message: 'playedAt must be ISO 8601' }),
  /** Estimated concurrent listeners at time of play. */
  listenerCount: z.number().int().min(0).default(0),
  /** Optional song title for reference. */
  trackTitle: z.string().max(200).optional(),
})

export type WebRadioImportEntry = z.infer<typeof WebRadioImportEntrySchema>

export const WebRadioImportPayloadSchema = z.object({
  entries: z.array(WebRadioImportEntrySchema).min(1).max(500),
})

export type WebRadioImportPayload = z.infer<typeof WebRadioImportPayloadSchema>
