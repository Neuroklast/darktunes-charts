import { describe, it, expect } from 'vitest'
import {
  CATEGORY_DEFINITIONS,
  CATEGORY_GROUPS,
  MAX_CATEGORIES_PER_BAND,
  getCategoryMetadata,
  getCategoriesByGroup,
  getChartEligibleCategories,
  getCommunityAwardCategories,
  canBandCompeteInCategory,
  validateCategorySelection,
  calculateCategoryScore,
} from '../categories'
import type { Band, AllCategory } from '@/lib/types'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeBand(overrides: Partial<Band> = {}): Band {
  return {
    id: 'band-1',
    name: 'Test Band',
    genre: 'Metal',
    spotifyMonthlyListeners: 5_000,
    tier: 'Emerging',
    ...overrides,
  }
}

describe('CATEGORY_DEFINITIONS', () => {
  it('all categories have weights summing to 1.0', () => {
    for (const [id, meta] of Object.entries(CATEGORY_DEFINITIONS)) {
      const sum = meta.fanWeight + meta.djWeight + meta.peerWeight
      expect(sum, `weights for "${id}" should sum to 1.0`).toBeCloseTo(1.0)
    }
  })

  it('all categories have the chartEligible field defined', () => {
    for (const [id, meta] of Object.entries(CATEGORY_DEFINITIONS)) {
      expect(typeof meta.chartEligible, `"${id}" is missing chartEligible`).toBe('boolean')
    }
  })

  it('all music group categories are chart-eligible', () => {
    for (const catId of CATEGORY_GROUPS.music.categories) {
      expect(CATEGORY_DEFINITIONS[catId].chartEligible, `"${catId}" should be chart-eligible`).toBe(true)
    }
  })

  it('all visuals group categories are chart-eligible', () => {
    for (const catId of CATEGORY_GROUPS.visuals.categories) {
      expect(CATEGORY_DEFINITIONS[catId].chartEligible, `"${catId}" should be chart-eligible`).toBe(true)
    }
  })

  it('all community group categories are NOT chart-eligible', () => {
    for (const catId of CATEGORY_GROUPS.community.categories) {
      expect(CATEGORY_DEFINITIONS[catId].chartEligible, `"${catId}" should NOT be chart-eligible`).toBe(false)
    }
  })

  it('all newcomer group categories are chart-eligible', () => {
    for (const catId of CATEGORY_GROUPS.newcomer.categories) {
      expect(CATEGORY_DEFINITIONS[catId].chartEligible, `"${catId}" should be chart-eligible`).toBe(true)
    }
  })
})

describe('getChartEligibleCategories', () => {
  it('returns exactly 10 chart-eligible categories (5 music + 3 visuals + 2 newcomer)', () => {
    const result = getChartEligibleCategories()
    expect(result).toHaveLength(10)
  })

  it('contains no community categories', () => {
    const result = getChartEligibleCategories()
    const communityIds = CATEGORY_GROUPS.community.categories
    for (const meta of result) {
      expect(communityIds).not.toContain(meta.id)
    }
  })

  it('all returned categories have chartEligible = true', () => {
    const result = getChartEligibleCategories()
    for (const meta of result) {
      expect(meta.chartEligible).toBe(true)
    }
  })
})

describe('getCommunityAwardCategories', () => {
  it('returns exactly 3 community categories', () => {
    const result = getCommunityAwardCategories()
    expect(result).toHaveLength(3)
  })

  it('contains only community group categories', () => {
    const result = getCommunityAwardCategories()
    const communityIds: AllCategory[] = ['chronicler-night', 'dark-integrity', 'lyricist-shadows']
    for (const meta of result) {
      expect(communityIds).toContain(meta.id)
    }
  })

  it('all returned categories have chartEligible = false', () => {
    const result = getCommunityAwardCategories()
    for (const meta of result) {
      expect(meta.chartEligible).toBe(false)
    }
  })
})

describe('MAX_CATEGORIES_PER_BAND', () => {
  it('is set to 5', () => {
    expect(MAX_CATEGORIES_PER_BAND).toBe(5)
  })
})

describe('validateCategorySelection', () => {
  it('returns valid for 5 chart-eligible categories', () => {
    const band = makeBand({ tier: 'Established', spotifyMonthlyListeners: 50_000 })
    const result = validateCategorySelection(
      ['track', 'album', 'best-cover-art', 'best-merch', 'best-music-video'],
      band,
    )
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('returns invalid when more than 5 categories are selected', () => {
    const band = makeBand({ tier: 'Established', spotifyMonthlyListeners: 50_000 })
    const result = validateCategorySelection(
      ['track', 'album', 'best-cover-art', 'best-merch', 'best-music-video', 'voice-of-void'],
      band,
    )
    expect(result.valid).toBe(false)
    expect(result.error).toContain('5')
  })

  it('returns invalid for community category submissions', () => {
    const band = makeBand()
    const result = validateCategorySelection(['chronicler-night'], band)
    expect(result.valid).toBe(false)
    expect(result.ineligibleCategories).toHaveLength(1)
    expect(result.ineligibleCategories[0]!.id).toBe('chronicler-night')
    expect(result.ineligibleCategories[0]!.reason).toContain('Community')
  })

  it('returns invalid for dark-integrity (community category)', () => {
    const band = makeBand()
    const result = validateCategorySelection(['dark-integrity'], band)
    expect(result.valid).toBe(false)
    expect(result.ineligibleCategories[0]!.reason).toContain('Community')
  })

  it('returns invalid when tier restriction is not met', () => {
    // underground-anthem restricts to Micro and Emerging only
    const band = makeBand({ tier: 'Macro', spotifyMonthlyListeners: 5_000 })
    const result = validateCategorySelection(['underground-anthem'], band)
    expect(result.valid).toBe(false)
    const inelig = result.ineligibleCategories.find(c => c.id === 'underground-anthem')
    expect(inelig?.reason).toContain('Micro')
  })

  it('returns invalid when listener cap is exceeded', () => {
    const band = makeBand({ tier: 'Micro', spotifyMonthlyListeners: 20_000 })
    const result = validateCategorySelection(['underground-anthem'], band)
    expect(result.valid).toBe(false)
    const inelig = result.ineligibleCategories.find(c => c.id === 'underground-anthem')
    expect(inelig?.reason).toContain('10,000')
  })

  it('separates eligible and ineligible categories in the result', () => {
    const band = makeBand({ tier: 'Macro', spotifyMonthlyListeners: 100_000 })
    const result = validateCategorySelection(['track', 'underground-anthem'], band)
    expect(result.eligibleCategories).toContain('track')
    expect(result.ineligibleCategories.map(c => c.id)).toContain('underground-anthem')
  })
})

describe('canBandCompeteInCategory', () => {
  it('allows Micro band in underground-anthem with valid listeners', () => {
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

describe('getCategoryMetadata', () => {
  it('returns correct metadata with chartEligible for track', () => {
    const meta = getCategoryMetadata('track')
    expect(meta.id).toBe('track')
    expect(meta.chartEligible).toBe(true)
  })

  it('returns chartEligible = false for chronicler-night', () => {
    const meta = getCategoryMetadata('chronicler-night')
    expect(meta.chartEligible).toBe(false)
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
