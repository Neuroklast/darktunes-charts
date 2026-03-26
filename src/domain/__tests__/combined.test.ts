import { describe, it, expect } from 'vitest'
import {
  minMaxNormalize,
  calculateCombinedScores,
  assignRanks,
  type TrackScores,
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

describe('calculateCombinedScores', () => {
  it('returns empty array for empty input', () => {
    expect(calculateCombinedScores([])).toEqual([])
  })

  it('produces combined score between 0 and 1', () => {
    const scores: TrackScores[] = [
      { trackId: 'a', fanScore: 100, djScore: 80, peerScore: 90 },
      { trackId: 'b', fanScore: 50, djScore: 60, peerScore: 40 },
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
      { trackId: 'low', fanScore: 0, djScore: 0, peerScore: 0 },
      { trackId: 'high', fanScore: 100, djScore: 100, peerScore: 100 },
    ]
    const result = calculateCombinedScores(scores)
    expect(result[0]!.trackId).toBe('high')
    expect(result[1]!.trackId).toBe('low')
  })

  it('top track gets combinedScore 1 when it wins all dimensions', () => {
    const scores: TrackScores[] = [
      { trackId: 'winner', fanScore: 100, djScore: 100, peerScore: 100 },
      { trackId: 'loser', fanScore: 0, djScore: 0, peerScore: 0 },
    ]
    const result = calculateCombinedScores(scores)
    expect(result[0]!.combinedScore).toBeCloseTo(1.0)
    expect(result[1]!.combinedScore).toBeCloseTo(0.0)
  })

  it('uses equal 1/3 weighting for each dimension', () => {
    const scores: TrackScores[] = [
      { trackId: 'a', fanScore: 100, djScore: 0, peerScore: 0 },
      { trackId: 'b', fanScore: 0, djScore: 100, peerScore: 0 },
      { trackId: 'c', fanScore: 0, djScore: 0, peerScore: 100 },
    ]
    const result = calculateCombinedScores(scores)
    // All three should have equal combined scores
    expect(result[0]!.combinedScore).toBeCloseTo(result[1]!.combinedScore, 5)
    expect(result[1]!.combinedScore).toBeCloseTo(result[2]!.combinedScore, 5)
  })

  it('includes normalized score fields', () => {
    const scores: TrackScores[] = [
      { trackId: 'a', fanScore: 100, djScore: 50, peerScore: 75 },
      { trackId: 'b', fanScore: 0, djScore: 0, peerScore: 0 },
    ]
    const result = calculateCombinedScores(scores)
    const top = result[0]!
    expect(top.normalizedFanScore).toBeDefined()
    expect(top.normalizedDJScore).toBeDefined()
    expect(top.normalizedPeerScore).toBeDefined()
  })
})

describe('assignRanks', () => {
  it('assigns rank 1 to the top track', () => {
    const scores: TrackScores[] = [
      { trackId: 'top', fanScore: 100, djScore: 100, peerScore: 100 },
      { trackId: 'mid', fanScore: 50, djScore: 50, peerScore: 50 },
    ]
    const combined = calculateCombinedScores(scores)
    const ranks = assignRanks(combined)
    expect(ranks.get('top')).toBe(1)
    expect(ranks.get('mid')).toBe(2)
  })

  it('assigns same rank to tied tracks', () => {
    const scores: TrackScores[] = [
      { trackId: 'a', fanScore: 100, djScore: 100, peerScore: 100 },
      { trackId: 'b', fanScore: 100, djScore: 100, peerScore: 100 },
      { trackId: 'c', fanScore: 0, djScore: 0, peerScore: 0 },
    ]
    const combined = calculateCombinedScores(scores)
    const ranks = assignRanks(combined)
    expect(ranks.get('a')).toBe(ranks.get('b'))
    expect(ranks.get('c')).toBe(3)
  })
})
