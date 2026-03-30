import { describe, it, expect } from 'vitest'
import {
  TIER_THRESHOLDS,
  TIER_PRICING_EUR,
  getTierFromListeners,
  getTierPriceEur,
} from '@/domain/tiers'

describe('domain/tiers (Single Source of Truth)', () => {
  describe('TIER_THRESHOLDS', () => {
    it('defines ascending thresholds for all five tiers', () => {
      expect(TIER_THRESHOLDS.Micro).toBe(10_000)
      expect(TIER_THRESHOLDS.Emerging).toBe(50_000)
      expect(TIER_THRESHOLDS.Established).toBe(250_000)
      expect(TIER_THRESHOLDS.International).toBe(1_000_000)
      expect(TIER_THRESHOLDS.Macro).toBe(Infinity)
    })

    it('thresholds are in strictly ascending order', () => {
      const values = [
        TIER_THRESHOLDS.Micro,
        TIER_THRESHOLDS.Emerging,
        TIER_THRESHOLDS.Established,
        TIER_THRESHOLDS.International,
      ]
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1])
      }
    })
  })

  describe('TIER_PRICING_EUR', () => {
    it('matches Spec §3.1 pricing for all tiers', () => {
      expect(TIER_PRICING_EUR.Micro).toBe(5)
      expect(TIER_PRICING_EUR.Emerging).toBe(15)
      expect(TIER_PRICING_EUR.Established).toBe(35)
      expect(TIER_PRICING_EUR.International).toBe(75)
      expect(TIER_PRICING_EUR.Macro).toBe(150)
    })

    it('prices are in strictly ascending order (cross-subsidization)', () => {
      const values = [
        TIER_PRICING_EUR.Micro,
        TIER_PRICING_EUR.Emerging,
        TIER_PRICING_EUR.Established,
        TIER_PRICING_EUR.International,
        TIER_PRICING_EUR.Macro,
      ]
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1])
      }
    })
  })

  describe('getTierFromListeners', () => {
    it('classifies 0 listeners as Micro', () => {
      expect(getTierFromListeners(0)).toBe('Micro')
    })

    it('classifies exactly 10,000 as Micro (boundary — exclusive upper bound)', () => {
      expect(getTierFromListeners(10_000)).toBe('Micro')
    })

    it('classifies 10,001 as Emerging', () => {
      expect(getTierFromListeners(10_001)).toBe('Emerging')
    })

    it('classifies exactly 50,000 as Emerging', () => {
      expect(getTierFromListeners(50_000)).toBe('Emerging')
    })

    it('classifies 50,001 as Established', () => {
      expect(getTierFromListeners(50_001)).toBe('Established')
    })

    it('classifies exactly 250,000 as Established', () => {
      expect(getTierFromListeners(250_000)).toBe('Established')
    })

    it('classifies 250,001 as International', () => {
      expect(getTierFromListeners(250_001)).toBe('International')
    })

    it('classifies exactly 1,000,000 as International', () => {
      expect(getTierFromListeners(1_000_000)).toBe('International')
    })

    it('classifies 1,000,001 as Macro', () => {
      expect(getTierFromListeners(1_000_001)).toBe('Macro')
    })

    it('throws RangeError for negative listeners', () => {
      expect(() => getTierFromListeners(-1)).toThrow(RangeError)
    })
  })

  describe('getTierPriceEur', () => {
    it('returns correct EUR price for each tier', () => {
      expect(getTierPriceEur('Micro')).toBe(5)
      expect(getTierPriceEur('Emerging')).toBe(15)
      expect(getTierPriceEur('Established')).toBe(35)
      expect(getTierPriceEur('International')).toBe(75)
      expect(getTierPriceEur('Macro')).toBe(150)
    })
  })

  describe('cross-module consistency', () => {
    it('TIER_PRICING_EUR values match getTierPriceEur for all tiers', () => {
      const tiers = ['Micro', 'Emerging', 'Established', 'International', 'Macro'] as const
      for (const tier of tiers) {
        expect(getTierPriceEur(tier)).toBe(TIER_PRICING_EUR[tier])
      }
    })
  })
})
