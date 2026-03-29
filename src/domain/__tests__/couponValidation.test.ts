import { describe, it, expect } from 'vitest'
import {
  validateCoupon,
  applyDiscount,
  type CouponRecord,
} from '@/domain/payment/couponValidation'
import { calculateTierPrice } from '@/domain/payment/tierPricing'

/**
 * Helper: creates a valid coupon record with sensible defaults.
 * Individual test cases override specific fields as needed.
 */
function makeCoupon(overrides: Partial<CouponRecord> = {}): CouponRecord {
  return {
    id: 'coupon-001',
    code: 'FESTIVAL2026',
    discountPercent: 20,
    maxUses: 100,
    currentUses: 0,
    validUntil: new Date('2027-01-01T00:00:00Z'),
    partnerId: 'partner-001',
    partnerName: 'WGT Festival',
    isActive: true,
    ...overrides,
  }
}

// ── validateCoupon ──────────────────────────────────────────────────────────

describe('validateCoupon', () => {
  const now = new Date('2026-06-15T12:00:00Z')

  it('returns valid result for a fully valid coupon', () => {
    const result = validateCoupon(makeCoupon(), now)
    expect(result).toEqual({
      valid: true,
      discountPercent: 20,
      partnerName: 'WGT Festival',
      couponId: 'coupon-001',
    })
  })

  it('returns NOT_FOUND when coupon is null', () => {
    const result = validateCoupon(null, now)
    expect(result).toEqual({ valid: false, reason: 'NOT_FOUND' })
  })

  it('returns INACTIVE when coupon is deactivated', () => {
    const result = validateCoupon(makeCoupon({ isActive: false }), now)
    expect(result).toEqual({ valid: false, reason: 'INACTIVE' })
  })

  it('returns EXPIRED when current date equals validUntil', () => {
    const expiry = new Date('2026-06-15T12:00:00Z')
    const result = validateCoupon(makeCoupon({ validUntil: expiry }), now)
    expect(result).toEqual({ valid: false, reason: 'EXPIRED' })
  })

  it('returns EXPIRED when current date is after validUntil', () => {
    const expiry = new Date('2026-01-01T00:00:00Z')
    const result = validateCoupon(makeCoupon({ validUntil: expiry }), now)
    expect(result).toEqual({ valid: false, reason: 'EXPIRED' })
  })

  it('returns MAX_USES_REACHED when currentUses equals maxUses', () => {
    const result = validateCoupon(makeCoupon({ currentUses: 100, maxUses: 100 }), now)
    expect(result).toEqual({ valid: false, reason: 'MAX_USES_REACHED' })
  })

  it('returns MAX_USES_REACHED when currentUses exceeds maxUses', () => {
    const result = validateCoupon(makeCoupon({ currentUses: 101, maxUses: 100 }), now)
    expect(result).toEqual({ valid: false, reason: 'MAX_USES_REACHED' })
  })

  it('returns INVALID_DISCOUNT when discountPercent is 0', () => {
    const result = validateCoupon(makeCoupon({ discountPercent: 0 }), now)
    expect(result).toEqual({ valid: false, reason: 'INVALID_DISCOUNT' })
  })

  it('returns INVALID_DISCOUNT when discountPercent exceeds 100', () => {
    const result = validateCoupon(makeCoupon({ discountPercent: 101 }), now)
    expect(result).toEqual({ valid: false, reason: 'INVALID_DISCOUNT' })
  })

  it('returns INVALID_DISCOUNT when discountPercent is negative', () => {
    const result = validateCoupon(makeCoupon({ discountPercent: -5 }), now)
    expect(result).toEqual({ valid: false, reason: 'INVALID_DISCOUNT' })
  })

  it('accepts 100% discount', () => {
    const result = validateCoupon(makeCoupon({ discountPercent: 100 }), now)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.discountPercent).toBe(100)
    }
  })

  it('accepts 1% discount (minimum)', () => {
    const result = validateCoupon(makeCoupon({ discountPercent: 1 }), now)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.discountPercent).toBe(1)
    }
  })

  it('is valid when currentUses is one below maxUses', () => {
    const result = validateCoupon(makeCoupon({ currentUses: 99, maxUses: 100 }), now)
    expect(result.valid).toBe(true)
  })

  it('uses current time as default when now parameter is omitted', () => {
    const farFutureCoupon = makeCoupon({ validUntil: new Date('2099-01-01T00:00:00Z') })
    const result = validateCoupon(farFutureCoupon)
    expect(result.valid).toBe(true)
  })

  it('prioritises INACTIVE over other failures', () => {
    const result = validateCoupon(
      makeCoupon({
        isActive: false,
        validUntil: new Date('2020-01-01T00:00:00Z'),
        currentUses: 200,
      }),
      now
    )
    expect(result).toEqual({ valid: false, reason: 'INACTIVE' })
  })
})

// ── applyDiscount ───────────────────────────────────────────────────────────

describe('applyDiscount', () => {
  it('applies 20% discount to Micro tier with 3 categories', () => {
    const pricing = calculateTierPrice('Micro', 3) // 2 paid × 500 = 1000 cents
    const result = applyDiscount(pricing, 20)
    expect(result.originalTotalCents).toBe(1000)
    expect(result.discountPercent).toBe(20)
    expect(result.discountCents).toBe(200)
    expect(result.finalTotalCents).toBe(800)
    expect(result.finalTotalEur).toBe('8.00')
  })

  it('applies 50% discount to Established tier', () => {
    const pricing = calculateTierPrice('Established', 2) // 1 paid × 3500 = 3500 cents
    const result = applyDiscount(pricing, 50)
    expect(result.discountCents).toBe(1750)
    expect(result.finalTotalCents).toBe(1750)
    expect(result.finalTotalEur).toBe('17.50')
  })

  it('applies 100% discount (free)', () => {
    const pricing = calculateTierPrice('International', 2) // 7500 cents
    const result = applyDiscount(pricing, 100)
    expect(result.discountCents).toBe(7500)
    expect(result.finalTotalCents).toBe(0)
    expect(result.finalTotalEur).toBe('0.00')
  })

  it('applies 1% discount (minimum)', () => {
    const pricing = calculateTierPrice('Macro', 2) // 15000 cents
    const result = applyDiscount(pricing, 1)
    expect(result.discountCents).toBe(150)
    expect(result.finalTotalCents).toBe(14850)
    expect(result.finalTotalEur).toBe('148.50')
  })

  it('floors fractional cent discounts (never under-charges)', () => {
    // 3 × 500 = 1500 cents, 33% discount = 495.0 cents → floor = 495
    const pricing = calculateTierPrice('Micro', 4)
    const result = applyDiscount(pricing, 33)
    expect(result.discountCents).toBe(495)
    expect(result.finalTotalCents).toBe(1005)
  })

  it('throws RangeError for 0% discount', () => {
    const pricing = calculateTierPrice('Micro', 2)
    expect(() => applyDiscount(pricing, 0)).toThrow(RangeError)
  })

  it('throws RangeError for negative discount', () => {
    const pricing = calculateTierPrice('Micro', 2)
    expect(() => applyDiscount(pricing, -10)).toThrow(RangeError)
  })

  it('throws RangeError for discount over 100%', () => {
    const pricing = calculateTierPrice('Micro', 2)
    expect(() => applyDiscount(pricing, 101)).toThrow(RangeError)
  })

  it('discount has ZERO effect on ranking — result contains no ranking fields', () => {
    const pricing = calculateTierPrice('Macro', 3)
    const result = applyDiscount(pricing, 25)
    expect(result).not.toHaveProperty('rankingWeight')
    expect(result).not.toHaveProperty('votingBonus')
    expect(result).not.toHaveProperty('chartScore')
  })
})
