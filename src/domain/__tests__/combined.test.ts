import { describe, it, expect } from 'vitest'
import {
  minMaxNormalize,
  calculateCombinedScores,
  calculateWeightedScore,
  resolveWeights,
  assignRanks,
  type TrackScores,
  type PillarWeights,
} from '../voting/combined'

describe('minMaxNormalize', () => {
  it('returns empty array for empty input', () => {
    expect(minMaxNormalize([])).toEqual([])
  })

  it('normalizes values to [0, 1]', () => {
    const result = minMaxNormalize([0, 50, 100])
    expect(result[0]).toBeCloseTo(0)
    expect(result[1]).toBeCloseTo(0.5)
    expect(result[2]).toBeCloseTo(1.0)
  })

  it('returns 0.5 for all-same values (zero range)', () => {
    const result = minMaxNormalize([5, 5, 5])
    expect(result).toEqual([0.5, 0.5, 0.5])
  })

  it('handles single value', () => {
    const result = minMaxNormalize([42])
    expect(result).toEqual([0.5])
  })

  it('handles negative values', () => {
    const result = minMaxNormalize([-10, 0, 10])
    expect(result[0]).toBeCloseTo(0)
    expect(result[1]).toBeCloseTo(0.5)
    expect(result[2]).toBeCloseTo(1.0)
  })
})

describe('resolveWeights', () => {
  it('returns equal 1/2 weights when no categoryId is provided', () => {
    const weights = resolveWeights()
    expect(weights.fan).toBeCloseTo(0.5)
    expect(weights.dj).toBeCloseTo(0.5)
  })

  it('returns category-specific weights for best-cover-art (80/20)', () => {
    const weights = resolveWeights('best-cover-art')
    expect(weights.fan).toBeCloseTo(0.80)
    expect(weights.dj).toBeCloseTo(0.20)
  })

  it('returns category-specific weights for voice-of-void (35/65)', () => {
    const weights = resolveWeights('voice-of-void')
    expect(weights.fan).toBeCloseTo(0.35)
    expect(weights.dj).toBeCloseTo(0.65)
  })
})

describe('calculateWeightedScore', () => {
  it('returns weighted combination of two normalised scores', () => {
    const weights: PillarWeights = { fan: 0.80, dj: 0.20 }
    const score = calculateWeightedScore(1, 1, weights)
    expect(score).toBeCloseTo(1.0)
  })

  it('applies zero weight correctly', () => {
    const weights: PillarWeights = { fan: 1, dj: 0 }
    expect(calculateWeightedScore(0.5, 0.9, weights)).toBeCloseTo(0.5)
  })

  it('returns 0 for all-zero inputs', () => {
    const weights: PillarWeights = { fan: 0.55, dj: 0.45 }
    expect(calculateWeightedScore(0, 0, weights)).toBe(0)
  })
})

describe('calculateCombinedScores', () => {
  it('returns empty array for empty input', () => {
    expect(calculateCombinedScores([])).toEqual([])
  })

  it('produces combined score between 0 and 1', () => {
    const scores: TrackScores[] = [
      { trackId: 'a', fanScore: 100, djScore: 80 },
      { trackId: 'b', fanScore: 50, djScore: 60 },
    ]
    const result = calculateCombinedScores(scores)
    expect(result).toHaveLength(2)
    for (const s of result) {
      expect(s.combinedScore).toBeGreaterThanOrEqual(0)
      expect(s.combinedScore).toBeLessThanOrEqual(1)
    }
  })

  it('sorts by combined score descending', () => {
    const scores: TrackScores[] = [
      { trackId: 'low', fanScore: 0, djScore: 0 },
      { trackId: 'high', fanScore: 100, djScore: 100 },
    ]
    const result = calculateCombinedScores(scores)
    expect(result[0]!.trackId).toBe('high')
    expect(result[1]!.trackId).toBe('low')
  })

  it('top track gets combinedScore 1 when it wins all dimensions', () => {
    const scores: TrackScores[] = [
      { trackId: 'winner', fanScore: 100, djScore: 100 },
      { trackId: 'loser', fanScore: 0, djScore: 0 },
    ]
    const result = calculateCombinedScores(scores)
    expect(result[0]!.combinedScore).toBeCloseTo(1.0)
    expect(result[1]!.combinedScore).toBeCloseTo(0.0)
  })

  it('uses equal 1/2 weighting for each dimension when no categoryId', () => {
    const scores: TrackScores[] = [
      { trackId: 'a', fanScore: 100, djScore: 0 },
      { trackId: 'b', fanScore: 0, djScore: 100 },
    ]
    const result = calculateCombinedScores(scores)
    // Both should have equal combined scores
    expect(result[0]!.combinedScore).toBeCloseTo(result[1]!.combinedScore, 5)
  })

  it('includes normalized score fields', () => {
    const scores: TrackScores[] = [
      { trackId: 'a', fanScore: 100, djScore: 50 },
      { trackId: 'b', fanScore: 0, djScore: 0 },
    ]
    const result = calculateCombinedScores(scores)
    const top = result[0]!
    expect(top.normalizedFanScore).toBeDefined()
    expect(top.normalizedDJScore).toBeDefined()
  })

  it('includes appliedWeights in results summing to 1.0', () => {
    const scores: TrackScores[] = [
      { trackId: 'a', fanScore: 80, djScore: 60 },
      { trackId: 'b', fanScore: 40, djScore: 30 },
    ]
    const result = calculateCombinedScores(scores)
    for (const r of result) {
      expect(r.appliedWeights).toBeDefined()
      expect(r.appliedWeights.fan + r.appliedWeights.dj).toBeCloseTo(1.0)
    }
  })

  it('applies 80/20 weights for best-cover-art category', () => {
    // Track A dominates fan score; Track B dominates DJ.
    // With best-cover-art weights (fan=0.8), Track A should win.
    const scores: TrackScores[] = [
      { trackId: 'fan-winner', fanScore: 100, djScore: 0 },
      { trackId: 'dj-winner', fanScore: 0, djScore: 100 },
    ]
    const result = calculateCombinedScores(scores, 'best-cover-art')
    expect(result[0]!.trackId).toBe('fan-winner')
    expect(result[0]!.appliedWeights.fan).toBeCloseTo(0.80)
    expect(result[0]!.appliedWeights.dj).toBeCloseTo(0.20)
  })

  it('applies 35/65 weights for voice-of-void category', () => {
    // Track B dominates DJ score; with voice-of-void weights (dj=0.65), Track B should win.
    const scores: TrackScores[] = [
      { trackId: 'fan-winner', fanScore: 100, djScore: 0 },
      { trackId: 'dj-winner', fanScore: 0, djScore: 100 },
    ]
    const result = calculateCombinedScores(scores, 'voice-of-void')
    expect(result[0]!.trackId).toBe('dj-winner')
    expect(result[0]!.appliedWeights.dj).toBeCloseTo(0.65)
  })

  it('backward compat: equal 0.5 weights when no categoryId (undefined)', () => {
    const scores: TrackScores[] = [
      { trackId: 'x', fanScore: 50, djScore: 50 },
    ]
    const result = calculateCombinedScores(scores, undefined)
    expect(result[0]!.appliedWeights.fan).toBeCloseTo(0.5)
    expect(result[0]!.appliedWeights.dj).toBeCloseTo(0.5)
  })

  it('integration: full pipeline from raw scores through category-weighted combination', () => {
    // Simulate best-cover-art period with 5 tracks
    const scores: TrackScores[] = [
      { trackId: 'fan-heavy', fanScore: 9000, djScore: 10 },
      { trackId: 'dj-heavy', fanScore: 100, djScore: 80 },
      { trackId: 'balanced', fanScore: 3000, djScore: 40 },
      { trackId: 'zero', fanScore: 0, djScore: 0 },
    ]
    const result = calculateCombinedScores(scores, 'best-cover-art')
    expect(result).toHaveLength(4)
    // fan-heavy should rank first due to 80% fan weight
    expect(result[0]!.trackId).toBe('fan-heavy')
    // All combined scores in [0, 1]
    for (const r of result) {
      expect(r.combinedScore).toBeGreaterThanOrEqual(0)
      expect(r.combinedScore).toBeLessThanOrEqual(1)
    }
    // Weights are consistently 80/20
    for (const r of result) {
      expect(r.appliedWeights.fan).toBeCloseTo(0.80)
    }
  })
})

describe('assignRanks', () => {
  it('assigns rank 1 to the top track', () => {
    const scores: TrackScores[] = [
      { trackId: 'top', fanScore: 100, djScore: 100 },
      { trackId: 'mid', fanScore: 50, djScore: 50 },
    ]
    const combined = calculateCombinedScores(scores)
    const ranks = assignRanks(combined)
    expect(ranks.get('top')).toBe(1)
    expect(ranks.get('mid')).toBe(2)
  })

  it('assigns same rank to tied tracks', () => {
    const scores: TrackScores[] = [
      { trackId: 'a', fanScore: 100, djScore: 100 },
      { trackId: 'b', fanScore: 100, djScore: 100 },
      { trackId: 'c', fanScore: 0, djScore: 0 },
    ]
    const combined = calculateCombinedScores(scores)
    const ranks = assignRanks(combined)
    expect(ranks.get('a')).toBe(ranks.get('b'))
    expect(ranks.get('c')).toBe(3)
  })
})


