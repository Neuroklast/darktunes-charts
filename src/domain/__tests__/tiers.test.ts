import { describe, it, expect } from 'vitest'
import {
  TIER_THRESHOLDS,
  TIER_PRICING_EUR,
  getTierFromListeners,
} from '@/domain/tiers'

describe('domain/tiers — Single Source of Truth', () => {
  describe('TIER_THRESHOLDS', () => {
    it('defines five tiers with ascending thresholds', () => {
      expect(TIER_THRESHOLDS.Micro).toBe(10_000)
      expect(TIER_THRESHOLDS.Emerging).toBe(50_000)
      expect(TIER_THRESHOLDS.Established).toBe(250_000)
      expect(TIER_THRESHOLDS.International).toBe(1_000_000)
      expect(TIER_THRESHOLDS.Macro).toBe(Infinity)
    })
  })

  describe('TIER_PRICING_EUR', () => {
    it('matches spec §3.1 pricing per tier', () => {
      expect(TIER_PRICING_EUR.Micro).toBe(5)
      expect(TIER_PRICING_EUR.Emerging).toBe(15)
      expect(TIER_PRICING_EUR.Established).toBe(35)
      expect(TIER_PRICING_EUR.International).toBe(75)
      expect(TIER_PRICING_EUR.Macro).toBe(150)
    })
  })

  describe('getTierFromListeners', () => {
    it('returns Micro for 0 listeners', () => {
      expect(getTierFromListeners(0)).toBe('Micro')
    })

    it('returns Micro for exactly 10,000 listeners (exclusive boundary)', () => {
      expect(getTierFromListeners(10_000)).toBe('Micro')
    })

    it('returns Emerging for 10,001 listeners', () => {
      expect(getTierFromListeners(10_001)).toBe('Emerging')
    })

    it('returns Established for 50,001 listeners', () => {
      expect(getTierFromListeners(50_001)).toBe('Established')
    })

    it('returns International for 250,001 listeners', () => {
      expect(getTierFromListeners(250_001)).toBe('International')
    })

    it('returns Macro for 1,000,001 listeners', () => {
      expect(getTierFromListeners(1_000_001)).toBe('Macro')
    })

    it('throws RangeError for negative listeners', () => {
      expect(() => getTierFromListeners(-1)).toThrow(RangeError)
    })
  })

  describe('consistency with downstream modules', () => {
    it('voting/tiers re-exports the same getTierFromListeners', async () => {
      const { getTierFromListeners: votingFn } = await import('@/domain/voting/tiers')
      // Both references should produce identical results
      expect(votingFn(0)).toBe(getTierFromListeners(0))
      expect(votingFn(10_001)).toBe(getTierFromListeners(10_001))
      expect(votingFn(1_000_001)).toBe(getTierFromListeners(1_000_001))
    })

    it('payment/tierPricing TIER_MONTHLY_PRICE_EUR is the same object as TIER_PRICING_EUR', async () => {
      const { TIER_MONTHLY_PRICE_EUR } = await import('@/domain/payment/tierPricing')
      expect(TIER_MONTHLY_PRICE_EUR).toBe(TIER_PRICING_EUR)
    })
  })
})
