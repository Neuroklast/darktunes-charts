/**
 * @module domain/market
 *
 * Dark Market Index — Band & Label Market Intelligence.
 *
 * Aggregates signals from multiple platforms (Spotify, YouTube, web radio,
 * Bandcamp, manual entries) into a single normalised Market Index (0–100).
 *
 * **Architecture boundary:** This module MUST NOT import from `src/domain/charts/`.
 * The market index is a market-reach score, not a chart ranking. These are
 * deliberately decoupled per ADR-018 (Monetization Without Pay-to-Win).
 *
 * Access to market index data is gated by subscription tier (PRO / PRO_PLUS).
 * All accesses are written to AuditLog for compliance (ADR-018).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Platform source for a market signal. */
export type MarketSignalSource = 'spotify' | 'youtube' | 'webRadio' | 'bandcamp' | 'manual'

/**
 * A single market signal snapshot from one platform.
 *
 * @remarks
 * `value` is the raw platform metric (e.g. monthly listeners, play count, air plays).
 * `normalizedValue` is the 0–100 normalised representation used for index calculation.
 * Normalisation is performed by `normalizeSignal()` based on per-source thresholds.
 */
export interface MarketSignal {
  source: MarketSignalSource
  /** Raw platform metric value (e.g. 42000 monthly listeners, 150 radio plays). */
  value: number
  /** Platform-normalised 0–100 score. */
  normalizedValue: number
  /** ISO 8601 timestamp of when the signal was collected. */
  collectedAt: string
  /** Optional label shown in the UI (e.g. "Monthly Listeners", "Air Plays"). */
  label?: string
}

/** Source weights used in index computation. Must sum to 1.0. */
export interface SourceWeights {
  spotify: number
  youtube: number
  webRadio: number
  bandcamp: number
  manual: number
}

/**
 * Default source weights used in `computeMarketIndex()`.
 *
 * Rationale (ADR-018, calibrated for DACH dark music scene):
 * - Spotify (0.35) — largest verifiable audience reach metric; high reliability
 * - Web Radio (0.25) — scene-specific signal; Webradio plays are a strong
 *   indicator for dark music community traction (MI On Air data)
 * - YouTube (0.20) — secondary visual presence; lower scene-specificity
 * - Bandcamp (0.15) — direct-to-fan sales index; relevant for underground acts
 * - Manual (0.05) — user-entered, lowest reliability; small but non-zero weight
 *   so bands can provide data when API signals are unavailable
 *
 * Weights must sum to 1.0.
 */
export const DEFAULT_SOURCE_WEIGHTS: SourceWeights = {
  spotify:  0.35,
  youtube:  0.20,
  webRadio: 0.25,
  bandcamp: 0.15,
  manual:   0.05,
}

/** Breakdown of the market index per signal source. */
export interface MarketIndexBreakdown {
  source: MarketSignalSource
  contribution: number
  normalizedValue: number
  weight: number
  explanation: string
}

/**
 * The computed Dark Market Index for a band.
 *
 * @remarks
 * `value` is always in range [0, 100].
 * `components` lists each signal's contribution for transparency.
 * `explanations` contains human-readable reasons for the index value.
 */
export interface MarketIndex {
  /** Overall index score 0–100. */
  value: number
  /** Breakdown per signal source. */
  components: MarketIndexBreakdown[]
  /** Human-readable explanations for the score. */
  explanations: string[]
  /** ISO 8601 timestamp when the index was computed. */
  computedAt: string
  /** True if the index is based on fewer than 2 signal sources (low confidence). */
  isLowConfidence: boolean
}

/** Input for peer-group benchmark computation. */
export interface BenchmarkInput {
  bandId: string
  genreTags: string[]
  /** Prisma tier value. */
  tier: 'MICRO' | 'EMERGING' | 'ESTABLISHED' | 'INTERNATIONAL' | 'MACRO'
}

/** Percentile benchmarks relative to the peer group. */
export interface Benchmarks {
  /** The band's market index value. */
  bandIndex: number
  /** Peer group size (number of bands with same tier + overlapping genre). */
  peerGroupSize: number
  /** Percentile rank within the peer group (0–100). */
  percentile: number
  /** Peer group median index. */
  medianIndex: number
  /** Peer group 75th percentile index. */
  p75Index: number
  /** Descriptive tier label for the percentile. */
  rankLabel: 'bottom' | 'average' | 'above_average' | 'top'
}

// ─── Normalisation thresholds per source ──────────────────────────────────────

/**
 * Upper bounds used to normalise raw values to 0–100.
 * Values at or above the ceiling map to 100.
 *
 * @remarks
 * These are calibrated for the DACH dark music scene (ADR-018).
 * A "MACRO" act like Rammstein would score ~100 on Spotify;
 * an active micro act playing regional gigs might score 15–25.
 */
const NORMALISATION_CEILINGS: Record<MarketSignalSource, number> = {
  spotify:  500_000,   // monthly listeners
  youtube:  1_000_000, // monthly views (estimated)
  webRadio: 5_000,     // total air plays tracked per month
  bandcamp: 10_000,    // sales/downloads per month
  manual:   100,       // already 0–100 (user-entered)
}

/**
 * Normalises a raw signal value to 0–100 using a log-scaled curve.
 *
 * @remarks
 * Linear normalisation would compress smaller acts unfairly. Log scaling
 * ensures that growth from 1k→10k listeners is as visible as 100k→1M.
 * Manual signals are already in 0–100 range and are clamped directly.
 *
 * @param source - The signal source type.
 * @param rawValue - The raw platform metric value.
 * @returns Normalised value in range [0, 100].
 */
export function normalizeSignal(source: MarketSignalSource, rawValue: number): number {
  if (rawValue <= 0) return 0

  if (source === 'manual') {
    return Math.min(100, Math.max(0, rawValue))
  }

  const ceiling = NORMALISATION_CEILINGS[source]
  const logValue = Math.log10(rawValue + 1)
  const logCeiling = Math.log10(ceiling + 1)
  return Math.min(100, Math.round((logValue / logCeiling) * 100))
}

/** Signal strength tier labels (German) for UI explanations. */
const SIGNAL_TIER_LABELS = {
  VERY_STRONG: 'sehr stark',
  STRONG:      'stark',
  MEDIUM:      'mittel',
  LOW:         'gering',
  VERY_LOW:    'sehr gering',
} as const

/** Human-readable source labels (German) for UI explanations. */
const SOURCE_LABELS: Record<MarketSignalSource, string> = {
  spotify:  'Spotify-Reichweite',
  youtube:  'YouTube-Präsenz',
  webRadio: 'Webradio-Airplay',
  bandcamp: 'Bandcamp-Aktivität',
  manual:   'Manuelle Metriken',
}

/**
 * Returns a human-readable explanation for a signal's contribution.
 *
 * @param source - Signal source.
 * @param normalizedValue - Normalised 0–100 value.
 * @returns Human-readable description string.
 */
function buildExplanation(source: MarketSignalSource, normalizedValue: number): string {
  const tier =
    normalizedValue >= 80 ? SIGNAL_TIER_LABELS.VERY_STRONG :
    normalizedValue >= 60 ? SIGNAL_TIER_LABELS.STRONG :
    normalizedValue >= 40 ? SIGNAL_TIER_LABELS.MEDIUM :
    normalizedValue >= 20 ? SIGNAL_TIER_LABELS.LOW :
    SIGNAL_TIER_LABELS.VERY_LOW

  return `${SOURCE_LABELS[source]}: ${tier} (Score ${normalizedValue}/100)`
}

/**
 * Computes the Dark Market Index from a list of market signals.
 *
 * Signals are averaged per source (deduplication), then combined using
 * weighted average with `DEFAULT_SOURCE_WEIGHTS`. Sources with no signals
 * contribute 0 to the index (they do not inflate scores).
 *
 * **This index is intentionally isolated from chart scoring (ADR-018).**
 *
 * @param signals - Array of market signals from any sources.
 * @param weights - Optional custom source weights (must sum to 1.0). Defaults to `DEFAULT_SOURCE_WEIGHTS`.
 * @returns Computed `MarketIndex` with components and explanations.
 *
 * @example
 * const index = computeMarketIndex([
 *   { source: 'spotify', value: 45000, normalizedValue: 68, collectedAt: '...' },
 *   { source: 'webRadio', value: 120, normalizedValue: 45, collectedAt: '...' },
 * ])
 * // index.value → weighted combination of the two signals
 */
export function computeMarketIndex(
  signals: MarketSignal[],
  weights: SourceWeights = DEFAULT_SOURCE_WEIGHTS,
): MarketIndex {
  if (signals.length === 0) {
    return {
      value: 0,
      components: [],
      explanations: ['Keine Signaldaten verfügbar.'],
      computedAt: new Date().toISOString(),
      isLowConfidence: true,
    }
  }

  // Group signals by source and compute per-source average
  const bySource = new Map<MarketSignalSource, number[]>()
  for (const signal of signals) {
    const existing = bySource.get(signal.source) ?? []
    existing.push(signal.normalizedValue)
    bySource.set(signal.source, existing)
  }

  const components: MarketIndexBreakdown[] = []
  let weightedSum = 0
  let totalWeight = 0

  for (const [source, values] of bySource.entries()) {
    const avgNormalized = values.reduce((a, b) => a + b, 0) / values.length
    const weight = weights[source]
    const contribution = avgNormalized * weight

    weightedSum += contribution
    totalWeight += weight

    components.push({
      source,
      normalizedValue: Math.round(avgNormalized),
      weight,
      contribution: Math.round(contribution * 10) / 10,
      explanation: buildExplanation(source, Math.round(avgNormalized)),
    })
  }

  // Normalise by actual total weight (some sources may be missing).
  // Dividing by totalWeight rather than the full weight sum (1.0) ensures
  // the index represents performance *within available sources*, rather than
  // being deflated by missing sources. For example, a band with only Spotify
  // data gets a score relative to their Spotify performance, not penalised for
  // having no web radio data. The `isLowConfidence` flag communicates this.
  // Edge case: totalWeight = 0 can only occur if signals array is empty, but
  // the early-return above handles that case; the 0 fallback is a safety guard.
  const rawValue = totalWeight > 0 ? weightedSum / totalWeight : 0
  const indexValue = Math.min(100, Math.max(0, Math.round(rawValue)))

  const explanations = components.map(c => c.explanation)
  if (bySource.size < 2) {
    explanations.push('Hinweis: Nur eine Signalquelle verfügbar — niedriges Vertrauen.')
  }

  return {
    value: indexValue,
    components,
    explanations,
    computedAt: new Date().toISOString(),
    isLowConfidence: bySource.size < 2,
  }
}

/**
 * Computes peer-group percentile benchmarks for a band.
 *
 * In production this would query `MarketIndexSnapshot` for bands with
 * matching tier and genre tags. This implementation provides a deterministic
 * stub based on tier thresholds calibrated for the DACH dark music scene.
 *
 * @param input - Band identifiers for peer-group matching.
 * @param bandIndexValue - The band's current market index value.
 * @returns Benchmark percentile data relative to the peer group.
 */
export function computeBenchmarks(
  input: BenchmarkInput,
  bandIndexValue: number,
): Benchmarks {
  // Peer group medians by tier (calibrated for DACH dark music scene)
  const tierMedians: Record<BenchmarkInput['tier'], number> = {
    MICRO:         18,
    EMERGING:      34,
    ESTABLISHED:   52,
    INTERNATIONAL: 71,
    MACRO:         88,
  }

  const tierP75s: Record<BenchmarkInput['tier'], number> = {
    MICRO:         28,
    EMERGING:      48,
    ESTABLISHED:   65,
    INTERNATIONAL: 82,
    MACRO:         95,
  }

  const tierPeerGroupSizes: Record<BenchmarkInput['tier'], number> = {
    MICRO:         240,
    EMERGING:       85,
    ESTABLISHED:    32,
    INTERNATIONAL:  12,
    MACRO:           4,
  }

  const medianIndex = tierMedians[input.tier]
  const p75Index = tierP75s[input.tier]
  const peerGroupSize = tierPeerGroupSizes[input.tier]

  // Approximate percentile using tier distribution shape
  let percentile: number
  if (bandIndexValue <= 0) {
    percentile = 0
  } else if (bandIndexValue < medianIndex) {
    percentile = Math.round((bandIndexValue / medianIndex) * 50)
  } else if (bandIndexValue < p75Index) {
    percentile = Math.round(50 + ((bandIndexValue - medianIndex) / (p75Index - medianIndex)) * 25)
  } else {
    percentile = Math.min(99, Math.round(75 + ((bandIndexValue - p75Index) / (100 - p75Index)) * 24))
  }

  const rankLabel: Benchmarks['rankLabel'] =
    percentile >= 75 ? 'top' :
    percentile >= 50 ? 'above_average' :
    percentile >= 25 ? 'average' :
    'bottom'

  return {
    bandIndex: bandIndexValue,
    peerGroupSize,
    percentile,
    medianIndex,
    p75Index,
    rankLabel,
  }
}
