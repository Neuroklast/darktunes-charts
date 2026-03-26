import { describe, it, expect } from 'vitest'
import {
  computeNormalisedEntropy,
  computeIntellectualDistanceBonus,
  applyIntellectualDistanceBonus,
  type GenreDistribution,
} from '../voting/intellectualDistance'

describe('computeNormalisedEntropy', () => {
  it('returns 0 for empty distribution', () => {
    expect(computeNormalisedEntropy({})).toBe(0)
  })

  it('returns 0 for single-genre distribution', () => {
    expect(computeNormalisedEntropy({ metal: 5 })).toBe(0)
  })

  it('returns 1 for perfectly uniform distribution', () => {
    const dist: GenreDistribution = { metal: 4, goth: 4, darkwave: 4, ebm: 4 }
    expect(computeNormalisedEntropy(dist)).toBeCloseTo(1.0)
  })

  it('returns value between 0 and 1 for skewed distribution', () => {
    const dist: GenreDistribution = { metal: 8, goth: 1, darkwave: 1 }
    const entropy = computeNormalisedEntropy(dist)
    expect(entropy).toBeGreaterThan(0)
    expect(entropy).toBeLessThan(1)
  })

  it('ignores genres with 0 votes', () => {
    const distWithZero: GenreDistribution = { metal: 5, goth: 0 }
    const distWithout: GenreDistribution = { metal: 5 }
    expect(computeNormalisedEntropy(distWithZero)).toBeCloseTo(
      computeNormalisedEntropy(distWithout)
    )
  })
})

describe('computeIntellectualDistanceBonus', () => {
  it('returns 1.0 (no bonus) for single-genre voter', () => {
    expect(computeIntellectualDistanceBonus({ metal: 10 })).toBe(1.0)
  })

  it('returns 1.15 (max bonus) for perfectly diverse voter', () => {
    const uniform: GenreDistribution = { a: 1, b: 1, c: 1, d: 1 }
    expect(computeIntellectualDistanceBonus(uniform)).toBeCloseTo(1.15)
  })

  it('returns value in [1.0, 1.15] for partially diverse voter', () => {
    const skewed: GenreDistribution = { metal: 7, goth: 2, darkwave: 1 }
    const bonus = computeIntellectualDistanceBonus(skewed)
    expect(bonus).toBeGreaterThanOrEqual(1.0)
    expect(bonus).toBeLessThanOrEqual(1.15)
  })
})

describe('applyIntellectualDistanceBonus', () => {
  it('does not mutate original votes', () => {
    const votes = [{ voterId: 'A', weight: 1.0 }]
    const map = new Map([['A', { metal: 5, goth: 5 }]])
    const original = JSON.stringify(votes)
    applyIntellectualDistanceBonus(votes, map)
    expect(JSON.stringify(votes)).toBe(original)
  })

  it('applies bonus to diverse voter', () => {
    const uniform: GenreDistribution = { a: 1, b: 1, c: 1, d: 1 }
    const votes = [{ voterId: 'A', weight: 1.0 }]
    const map = new Map([['A', uniform]])
    const result = applyIntellectualDistanceBonus(votes, map)
    expect(result[0]!.weight).toBeCloseTo(1.15)
  })

  it('does not change weight for voter with no genre data (defaults to 1.0)', () => {
    const votes = [{ voterId: 'A', weight: 0.8 }]
    const map = new Map<string, GenreDistribution>()
    const result = applyIntellectualDistanceBonus(votes, map)
    // Empty distribution → entropy 0 → bonus 1.0 → weight unchanged
    expect(result[0]!.weight).toBeCloseTo(0.8)
  })

  it('memoises bonus computation per voter', () => {
    const uniform: GenreDistribution = { a: 1, b: 1, c: 1, d: 1 }
    const votes = [
      { voterId: 'A', weight: 1.0 },
      { voterId: 'A', weight: 0.5 },
    ]
    const map = new Map([['A', uniform]])
    const result = applyIntellectualDistanceBonus(votes, map)
    // Both votes from A should each be multiplied by ~1.15
    expect(result[0]!.weight).toBeCloseTo(1.15)
    expect(result[1]!.weight).toBeCloseTo(0.575)
  })
})
