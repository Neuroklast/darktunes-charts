import { describe, it, expect } from 'vitest'
import { calculateTierPrice, TIER_MONTHLY_PRICE_EUR } from '@/domain/payment/tierPricing'

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
