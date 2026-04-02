import { describe, it, expect } from 'vitest'
import {
  computeMarketIndex,
  computeBenchmarks,
  normalizeSignal,
  DEFAULT_SOURCE_WEIGHTS,
  type MarketSignal,
} from '../index'

// ─── normalizeSignal ──────────────────────────────────────────────────────────

describe('normalizeSignal', () => {
  it('returns 0 for zero or negative values', () => {
    expect(normalizeSignal('spotify', 0)).toBe(0)
    expect(normalizeSignal('spotify', -100)).toBe(0)
  })

  it('clamps manual signals to 0–100 without log scaling', () => {
    expect(normalizeSignal('manual', 75)).toBe(75)
    expect(normalizeSignal('manual', 110)).toBe(100)
    expect(normalizeSignal('manual', -5)).toBe(0)
  })

  it('returns 100 for values at or above the ceiling', () => {
    // 500_000 is the ceiling for Spotify
    expect(normalizeSignal('spotify', 500_000)).toBe(100)
    expect(normalizeSignal('spotify', 999_999)).toBe(100)
  })

  it('produces higher score for larger values (log-scaled)', () => {
    const low = normalizeSignal('spotify', 1_000)
    const mid = normalizeSignal('spotify', 50_000)
    const high = normalizeSignal('spotify', 250_000)
    expect(low).toBeLessThan(mid)
    expect(mid).toBeLessThan(high)
  })

  it('normalises web radio air plays correctly', () => {
    const result = normalizeSignal('webRadio', 100)
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThanOrEqual(100)
  })
})

// ─── computeMarketIndex ───────────────────────────────────────────────────────

describe('computeMarketIndex', () => {
  it('returns zero index with low confidence for empty signal array', () => {
    const result = computeMarketIndex([])
    expect(result.value).toBe(0)
    expect(result.isLowConfidence).toBe(true)
    expect(result.components).toHaveLength(0)
    expect(result.explanations.length).toBeGreaterThan(0)
  })

  it('is flagged as low confidence with only one signal source', () => {
    const signals: MarketSignal[] = [
      { source: 'spotify', value: 50_000, normalizedValue: 68, collectedAt: new Date().toISOString() },
    ]
    const result = computeMarketIndex(signals)
    expect(result.isLowConfidence).toBe(true)
  })

  it('is not low confidence with two or more signal sources', () => {
    const signals: MarketSignal[] = [
      { source: 'spotify', value: 50_000, normalizedValue: 68, collectedAt: new Date().toISOString() },
      { source: 'webRadio', value: 120, normalizedValue: 45, collectedAt: new Date().toISOString() },
    ]
    const result = computeMarketIndex(signals)
    expect(result.isLowConfidence).toBe(false)
  })

  it('returns a value in range [0, 100]', () => {
    const signals: MarketSignal[] = [
      { source: 'spotify', value: 200_000, normalizedValue: 88, collectedAt: new Date().toISOString() },
      { source: 'youtube', value: 500_000, normalizedValue: 72, collectedAt: new Date().toISOString() },
      { source: 'webRadio', value: 500, normalizedValue: 55, collectedAt: new Date().toISOString() },
      { source: 'bandcamp', value: 1_500, normalizedValue: 42, collectedAt: new Date().toISOString() },
      { source: 'manual', value: 60, normalizedValue: 60, collectedAt: new Date().toISOString() },
    ]
    const result = computeMarketIndex(signals)
    expect(result.value).toBeGreaterThanOrEqual(0)
    expect(result.value).toBeLessThanOrEqual(100)
  })

  it('produces a higher index for higher signals', () => {
    const lowSignals: MarketSignal[] = [
      { source: 'spotify', value: 1_000, normalizedValue: normalizeSignal('spotify', 1_000), collectedAt: new Date().toISOString() },
      { source: 'webRadio', value: 10, normalizedValue: normalizeSignal('webRadio', 10), collectedAt: new Date().toISOString() },
    ]
    const highSignals: MarketSignal[] = [
      { source: 'spotify', value: 300_000, normalizedValue: normalizeSignal('spotify', 300_000), collectedAt: new Date().toISOString() },
      { source: 'webRadio', value: 2_000, normalizedValue: normalizeSignal('webRadio', 2_000), collectedAt: new Date().toISOString() },
    ]
    const low = computeMarketIndex(lowSignals)
    const high = computeMarketIndex(highSignals)
    expect(high.value).toBeGreaterThan(low.value)
  })

  it('averages multiple signals from the same source', () => {
    const signals: MarketSignal[] = [
      { source: 'spotify', value: 10_000, normalizedValue: 40, collectedAt: new Date().toISOString() },
      { source: 'spotify', value: 90_000, normalizedValue: 80, collectedAt: new Date().toISOString() },
    ]
    // Average of 40 and 80 = 60, weighted by spotify weight 0.35 / 0.35 = 60
    const result = computeMarketIndex(signals, DEFAULT_SOURCE_WEIGHTS)
    // Index = 60 (only spotify source)
    expect(result.components).toHaveLength(1)
    expect(result.components[0]?.normalizedValue).toBe(60)
  })

  it('includes one component per unique source', () => {
    const signals: MarketSignal[] = [
      { source: 'spotify', value: 50_000, normalizedValue: 68, collectedAt: new Date().toISOString() },
      { source: 'bandcamp', value: 500, normalizedValue: 35, collectedAt: new Date().toISOString() },
      { source: 'manual', value: 70, normalizedValue: 70, collectedAt: new Date().toISOString() },
    ]
    const result = computeMarketIndex(signals)
    expect(result.components).toHaveLength(3)
  })

  it('includes computedAt timestamp', () => {
    const result = computeMarketIndex([])
    expect(result.computedAt).toBeTruthy()
    expect(() => new Date(result.computedAt)).not.toThrow()
  })

  it('never exceeds 100 even with all max signals', () => {
    const signals: MarketSignal[] = [
      { source: 'spotify', value: 999_999, normalizedValue: 100, collectedAt: new Date().toISOString() },
      { source: 'youtube', value: 999_999, normalizedValue: 100, collectedAt: new Date().toISOString() },
      { source: 'webRadio', value: 999_999, normalizedValue: 100, collectedAt: new Date().toISOString() },
      { source: 'bandcamp', value: 999_999, normalizedValue: 100, collectedAt: new Date().toISOString() },
      { source: 'manual', value: 100, normalizedValue: 100, collectedAt: new Date().toISOString() },
    ]
    const result = computeMarketIndex(signals)
    expect(result.value).toBe(100)
  })

  it('is ISOLATED from chart scoring — has no chart-related properties', () => {
    const result = computeMarketIndex([])
    // Verify the index has no chart-ranking fields (ADR-018 boundary)
    expect(result).not.toHaveProperty('chartScore')
    expect(result).not.toHaveProperty('rank')
    expect(result).not.toHaveProperty('fanVotes')
    expect(result).not.toHaveProperty('djBallot')
  })
})

// ─── computeBenchmarks ────────────────────────────────────────────────────────

describe('computeBenchmarks', () => {
  it('returns 0 percentile for zero index', () => {
    const result = computeBenchmarks({ bandId: 'test', genreTags: ['GOTH'], tier: 'MICRO' }, 0)
    expect(result.percentile).toBe(0)
  })

  it('returns top rank label for bands above 75th percentile', () => {
    // MICRO tier median=18, p75=28; value of 90 should be well above 75th
    const result = computeBenchmarks({ bandId: 'test', genreTags: ['GOTH'], tier: 'MICRO' }, 90)
    expect(result.rankLabel).toBe('top')
    expect(result.percentile).toBeGreaterThanOrEqual(75)
  })

  it('returns average rank for bands near median', () => {
    const result = computeBenchmarks({ bandId: 'test', genreTags: ['EBM'], tier: 'EMERGING' }, 34)
    // 34 is the exact median for EMERGING → 50th percentile
    expect(result.percentile).toBe(50)
    expect(result.rankLabel).toBe('above_average')
  })

  it('returns bottom rank for bands well below median', () => {
    const result = computeBenchmarks({ bandId: 'test', genreTags: ['DARKWAVE'], tier: 'ESTABLISHED' }, 5)
    expect(result.rankLabel).toBe('bottom')
  })

  it('includes peer group size', () => {
    const result = computeBenchmarks({ bandId: 'test', genreTags: ['GOTH'], tier: 'MICRO' }, 50)
    expect(result.peerGroupSize).toBeGreaterThan(0)
  })

  it('returns medianIndex and p75Index for the tier', () => {
    const result = computeBenchmarks({ bandId: 'test', genreTags: ['GOTH'], tier: 'ESTABLISHED' }, 50)
    expect(result.medianIndex).toBe(52)
    expect(result.p75Index).toBe(65)
  })

  it('returns the band index value unchanged', () => {
    const result = computeBenchmarks({ bandId: 'test', genreTags: ['GOTH'], tier: 'MICRO' }, 42)
    expect(result.bandIndex).toBe(42)
  })
})
