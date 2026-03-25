import { describe, it, expect } from 'vitest'
import { getCategoryMetadata, canBandCompeteInCategory, calculateCategoryScore } from '../categories'

describe('getCategoryMetadata', () => {
  it('returns track metadata', () => {
    const meta = getCategoryMetadata('track')
    expect(meta.id).toBe('track')
    expect(meta.name).toBe('Track of the Month')
    expect(meta.fanWeight + meta.djWeight + meta.peerWeight).toBeCloseTo(1.0)
  })

  it('returns underground-anthem with tier restriction', () => {
    const meta = getCategoryMetadata('underground-anthem')
    expect(meta.tierRestriction).toContain('Micro')
    expect(meta.tierRestriction).toContain('Emerging')
    expect(meta.maxListeners).toBe(10000)
  })
})

describe('canBandCompeteInCategory', () => {
  it('allows Micro band in underground-anthem', () => {
    expect(canBandCompeteInCategory('underground-anthem', 'Micro', 5_000)).toBe(true)
  })

  it('blocks Macro band in underground-anthem', () => {
    expect(canBandCompeteInCategory('underground-anthem', 'Macro', 2_000_000)).toBe(false)
  })

  it('blocks band over maxListeners in underground-anthem', () => {
    expect(canBandCompeteInCategory('underground-anthem', 'Emerging', 15_000)).toBe(false)
  })

  it('allows any band in track category', () => {
    expect(canBandCompeteInCategory('track', 'Macro', 5_000_000)).toBe(true)
    expect(canBandCompeteInCategory('track', 'Micro', 100)).toBe(true)
  })
})

describe('calculateCategoryScore', () => {
  it('returns 0 for all zero inputs', () => {
    expect(calculateCategoryScore('track', 0, 0, 0)).toBe(0)
  })

  it('returns weighted composite score', () => {
    const score = calculateCategoryScore('track', 100, 100, 100)
    expect(score).toBeCloseTo(100)
  })

  it('respects different weights per category', () => {
    const trackScore = calculateCategoryScore('track', 100, 0, 0)
    const coverArtScore = calculateCategoryScore('best-cover-art', 100, 0, 0)
    expect(coverArtScore).toBeGreaterThan(trackScore)
  })
})
