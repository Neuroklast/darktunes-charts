import { describe, it, expect } from 'vitest'
import {
  calculateTierPrice,
  calculateYearlyTierPrice,
  compareBillingCycles,
  TIER_MONTHLY_PRICE_EUR,
  DEFAULT_YEARLY_DISCOUNT_PERCENT,
} from '@/domain/payment/tierPricing'

describe('calculateTierPrice', () => {
  it('returns zero cost for a single (free) category', () => {
    const result = calculateTierPrice('Micro', 1)
    expect(result.totalCents).toBe(0)
    expect(result.totalEur).toBe('0.00')
    expect(result.paidCategories).toBe(0)
    expect(result.freeCategories).toBe(1)
  })

  it('charges Micro tier correctly for 2 categories (1 paid)', () => {
    const result = calculateTierPrice('Micro', 2)
    expect(result.totalCents).toBe(500) // €5 × 100
    expect(result.totalEur).toBe('5.00')
    expect(result.paidCategories).toBe(1)
    expect(result.pricePerCategoryEurCents).toBe(500)
  })

  it('charges Emerging tier for 3 categories (2 paid)', () => {
    const result = calculateTierPrice('Emerging', 3)
    expect(result.totalCents).toBe(3000) // €15 × 2 × 100
    expect(result.totalEur).toBe('30.00')
    expect(result.paidCategories).toBe(2)
  })

  it('charges Established tier correctly', () => {
    const result = calculateTierPrice('Established', 2)
    expect(result.totalCents).toBe(3500) // €35
    expect(result.totalEur).toBe('35.00')
  })

  it('charges International tier correctly', () => {
    const result = calculateTierPrice('International', 2)
    expect(result.totalCents).toBe(7500) // €75
    expect(result.totalEur).toBe('75.00')
  })

  it('charges Macro tier correctly', () => {
    const result = calculateTierPrice('Macro', 2)
    expect(result.totalCents).toBe(15000) // €150
    expect(result.totalEur).toBe('150.00')
  })

  it('throws RangeError for zero categories', () => {
    expect(() => calculateTierPrice('Micro', 0)).toThrow(RangeError)
  })

  it('throws RangeError for negative categories', () => {
    expect(() => calculateTierPrice('Micro', -1)).toThrow(RangeError)
  })

  it('TIER_MONTHLY_PRICE_EUR matches spec §3.1 pricing', () => {
    expect(TIER_MONTHLY_PRICE_EUR.Micro).toBe(5)
    expect(TIER_MONTHLY_PRICE_EUR.Emerging).toBe(15)
    expect(TIER_MONTHLY_PRICE_EUR.Established).toBe(35)
    expect(TIER_MONTHLY_PRICE_EUR.International).toBe(75)
    expect(TIER_MONTHLY_PRICE_EUR.Macro).toBe(150)
  })

  it('financial tier has NO effect on ranking — pricing is purely administrative', () => {
    // Validate that pricing result contains no ranking-related fields
    const result = calculateTierPrice('Macro', 3)
    expect(result).not.toHaveProperty('rankingWeight')
    expect(result).not.toHaveProperty('votingBonus')
    expect(result).not.toHaveProperty('chartScore')
  })
})

describe('calculateYearlyTierPrice', () => {
  it('applies default 15% discount to Micro tier with 2 categories', () => {
    // Monthly: €5 × 1 paid = €5/mo = €60/yr
    // Yearly with 15% off: €60 × 0.85 = €51.00
    const result = calculateYearlyTierPrice('Micro', 2)
    expect(result.totalCents).toBe(5100)
    expect(result.totalEur).toBe('51.00')
    expect(result.paidCategories).toBe(1)
  })

  it('applies default 15% discount to Emerging tier with 3 categories', () => {
    // Monthly: €15 × 2 paid = €30/mo = €360/yr
    // Yearly with 15% off: €360 × 0.85 = €306.00
    const result = calculateYearlyTierPrice('Emerging', 3)
    expect(result.totalCents).toBe(30600)
    expect(result.totalEur).toBe('306.00')
  })

  it('returns zero for a single (free) category regardless of discount', () => {
    const result = calculateYearlyTierPrice('Macro', 1, 20)
    expect(result.totalCents).toBe(0)
    expect(result.totalEur).toBe('0.00')
  })

  it('accepts a custom discount of 20%', () => {
    // Monthly: €35 × 1 paid = €35/mo = €420/yr
    // Yearly with 20% off: €420 × 0.80 = €336.00
    const result = calculateYearlyTierPrice('Established', 2, 20)
    expect(result.totalCents).toBe(33600)
    expect(result.totalEur).toBe('336.00')
  })

  it('accepts 0% discount (no savings)', () => {
    // Monthly: €5 × 1 = €5/mo = €60/yr, 0% discount = €60
    const result = calculateYearlyTierPrice('Micro', 2, 0)
    expect(result.totalCents).toBe(6000)
    expect(result.totalEur).toBe('60.00')
  })

  it('accepts 100% discount (fully free)', () => {
    const result = calculateYearlyTierPrice('Macro', 3, 100)
    expect(result.totalCents).toBe(0)
    expect(result.totalEur).toBe('0.00')
  })

  it('throws RangeError for discount below 0', () => {
    expect(() => calculateYearlyTierPrice('Micro', 2, -1)).toThrow(RangeError)
  })

  it('throws RangeError for discount above 100', () => {
    expect(() => calculateYearlyTierPrice('Micro', 2, 101)).toThrow(RangeError)
  })

  it('throws RangeError for zero categories', () => {
    expect(() => calculateYearlyTierPrice('Micro', 0)).toThrow(RangeError)
  })
})

describe('compareBillingCycles', () => {
  it('returns correct monthly and yearly breakdowns for Micro tier', () => {
    const comparison = compareBillingCycles('Micro', 2)
    // Monthly: €5
    expect(comparison.monthly.totalCents).toBe(500)
    // Yearly: €5 × 12 × 0.85 = €51
    expect(comparison.yearly.totalCents).toBe(5100)
    expect(comparison.discountPercent).toBe(DEFAULT_YEARLY_DISCOUNT_PERCENT)
  })

  it('calculates savings correctly', () => {
    const comparison = compareBillingCycles('Emerging', 3)
    // Monthly: €30/mo → €360/yr
    // Yearly: €360 × 0.85 = €306
    // Savings: €360 − €306 = €54
    expect(comparison.yearlySavingsCents).toBe(5400)
    expect(comparison.yearlySavingsEur).toBe('54.00')
  })

  it('shows zero savings for a single (free) category', () => {
    const comparison = compareBillingCycles('Macro', 1)
    expect(comparison.yearlySavingsCents).toBe(0)
    expect(comparison.yearlySavingsEur).toBe('0.00')
  })

  it('respects custom discount percentage', () => {
    const comparison = compareBillingCycles('International', 2, 10)
    // Monthly: €75/mo → €900/yr
    // Yearly with 10%: €900 × 0.90 = €810
    // Savings: €900 − €810 = €90
    expect(comparison.yearly.totalCents).toBe(81000)
    expect(comparison.yearlySavingsCents).toBe(9000)
    expect(comparison.yearlySavingsEur).toBe('90.00')
    expect(comparison.discountPercent).toBe(10)
  })

  it('yearly pricing has NO effect on ranking — pricing is purely administrative', () => {
    const comparison = compareBillingCycles('Macro', 3)
    expect(comparison.yearly).not.toHaveProperty('rankingWeight')
    expect(comparison.yearly).not.toHaveProperty('votingBonus')
    expect(comparison.yearly).not.toHaveProperty('chartScore')
  })
})
