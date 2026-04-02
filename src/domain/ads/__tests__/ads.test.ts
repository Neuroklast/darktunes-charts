import { describe, it, expect } from 'vitest'
import {
  validateAdBooking,
  calculateBookingDays,
  calculateBookingCost,
  checkSlotAvailability,
  getAvailableSlotCount,
  MAX_BOOKING_DAYS,
  MIN_BOOKING_DAYS,
  SLOT_PRICES_EUR_CENTS,
  DEFAULT_MAX_CONCURRENT,
  type AdBookingStatus,
} from '../index'

// ─── calculateBookingDays ─────────────────────────────────────────────────────

describe('calculateBookingDays', () => {
  it('returns 1 for same-day booking', () => {
    expect(calculateBookingDays('2026-06-01', '2026-06-01')).toBe(1)
  })

  it('returns correct day count for multi-day booking', () => {
    expect(calculateBookingDays('2026-06-01', '2026-06-07')).toBe(7)
  })

  it('throws RangeError when end is before start', () => {
    expect(() => calculateBookingDays('2026-06-10', '2026-06-01')).toThrow(RangeError)
  })

  it('throws RangeError when duration exceeds MAX_BOOKING_DAYS', () => {
    const start = '2026-01-01'
    const end = new Date(new Date(start).getTime() + (MAX_BOOKING_DAYS + 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]!
    expect(() => calculateBookingDays(start, end)).toThrow(RangeError)
  })

  it('accepts booking exactly at MAX_BOOKING_DAYS', () => {
    const start = '2026-01-01'
    const end = new Date(new Date(start).getTime() + (MAX_BOOKING_DAYS - 1) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]!
    expect(() => calculateBookingDays(start, end)).not.toThrow()
  })
})

// ─── calculateBookingCost ─────────────────────────────────────────────────────

describe('calculateBookingCost', () => {
  it('calculates correct cost for HOME_HERO 3 days', () => {
    const expected = SLOT_PRICES_EUR_CENTS['HOME_HERO'] * 3
    expect(calculateBookingCost('HOME_HERO', 3)).toBe(expected)
  })

  it('calculates correct cost for NEW_AND_HOT_LIST 7 days', () => {
    const expected = SLOT_PRICES_EUR_CENTS['NEW_AND_HOT_LIST'] * 7
    expect(calculateBookingCost('NEW_AND_HOT_LIST', 7)).toBe(expected)
  })

  it('HOME_HERO is most expensive slot type', () => {
    const heroCost = SLOT_PRICES_EUR_CENTS['HOME_HERO']
    expect(heroCost).toBeGreaterThan(SLOT_PRICES_EUR_CENTS['HOME_SIDEBAR'])
    expect(heroCost).toBeGreaterThan(SLOT_PRICES_EUR_CENTS['GENRE_BANNER'])
    expect(heroCost).toBeGreaterThan(SLOT_PRICES_EUR_CENTS['NEW_AND_HOT_LIST'])
  })
})

// ─── checkSlotAvailability ────────────────────────────────────────────────────

describe('checkSlotAvailability', () => {
  const makeBooking = (start: string, end: string, status: AdBookingStatus = 'ACTIVE') => ({
    startDate: start,
    endDate: end,
    status,
  })

  it('returns true when no existing bookings', () => {
    expect(checkSlotAvailability([], 3, '2026-06-01', '2026-06-07')).toBe(true)
  })

  it('returns true when bookings do not overlap', () => {
    const existing = [makeBooking('2026-05-01', '2026-05-15')]
    expect(checkSlotAvailability(existing, 3, '2026-06-01', '2026-06-07')).toBe(true)
  })

  it('returns false when at maxConcurrent with overlapping booking', () => {
    const existing = [
      makeBooking('2026-06-01', '2026-06-07'),
      makeBooking('2026-06-01', '2026-06-07'),
      makeBooking('2026-06-01', '2026-06-07'),
    ]
    // maxConcurrent = 3, all 3 slots occupied
    expect(checkSlotAvailability(existing, 3, '2026-06-01', '2026-06-07')).toBe(false)
  })

  it('returns true when below maxConcurrent', () => {
    const existing = [
      makeBooking('2026-06-01', '2026-06-07'),
      makeBooking('2026-06-01', '2026-06-07'),
    ]
    // Only 2 of 3 slots used
    expect(checkSlotAvailability(existing, 3, '2026-06-01', '2026-06-07')).toBe(true)
  })

  it('excludes CANCELED and EXPIRED bookings from count', () => {
    const existing = [
      makeBooking('2026-06-01', '2026-06-07', 'CANCELED'),
      makeBooking('2026-06-01', '2026-06-07', 'EXPIRED'),
      makeBooking('2026-06-01', '2026-06-07', 'CANCELED'),
    ]
    // All are CANCELED/EXPIRED — should be available even with maxConcurrent=1
    expect(checkSlotAvailability(existing, 1, '2026-06-01', '2026-06-07')).toBe(true)
  })

  it('counts overlapping dates (partial overlap)', () => {
    const existing = [makeBooking('2026-06-03', '2026-06-10')]
    // Requested: June 1–5 overlaps with June 3–10
    expect(checkSlotAvailability(existing, 1, '2026-06-01', '2026-06-05')).toBe(false)
  })

  it('does not count adjacent (non-overlapping) bookings', () => {
    // Previous booking ends on June 01, new booking starts June 01 — same day
    // Should be treated as overlap (edge case: same-day boundary)
    const existing = [makeBooking('2026-05-25', '2026-06-01')]
    // June 01 to June 07 overlaps with May 25 – June 01 (end = June 01, start = June 01)
    expect(checkSlotAvailability(existing, 1, '2026-06-01', '2026-06-07')).toBe(false)
  })
})

// ─── getAvailableSlotCount ────────────────────────────────────────────────────

describe('getAvailableSlotCount', () => {
  it('returns maxConcurrent when no bookings', () => {
    expect(getAvailableSlotCount([], 5, '2026-06-01', '2026-06-07')).toBe(5)
  })

  it('returns correct available count with partial usage', () => {
    const existing = [
      { startDate: '2026-06-01', endDate: '2026-06-07', status: 'ACTIVE' as AdBookingStatus },
      { startDate: '2026-06-01', endDate: '2026-06-07', status: 'PAID' as AdBookingStatus },
    ]
    expect(getAvailableSlotCount(existing, 5, '2026-06-01', '2026-06-07')).toBe(3)
  })

  it('returns 0 when fully booked', () => {
    const existing = Array.from({ length: 3 }, () => ({
      startDate: '2026-06-01',
      endDate: '2026-06-07',
      status: 'ACTIVE' as AdBookingStatus,
    }))
    expect(getAvailableSlotCount(existing, 3, '2026-06-01', '2026-06-07')).toBe(0)
  })
})

// ─── validateAdBooking ────────────────────────────────────────────────────────

describe('validateAdBooking', () => {
  const validBooking = {
    slotType: 'HOME_HERO',
    bandId: '11111111-1111-1111-1111-111111111111',
    startDate: '2026-06-01',
    endDate: '2026-06-07',
    creative: {
      headline: 'New Album Out Now!',
      ctaUrl: 'https://band.com/album',
    },
    successUrl: 'https://darktunes.com/success',
    cancelUrl: 'https://darktunes.com/cancel',
  }

  it('accepts a valid booking', () => {
    const result = validateAdBooking(validBooking)
    expect(result.slotType).toBe('HOME_HERO')
  })

  it('rejects when neither bandId nor labelId provided', () => {
    const { bandId: _bandId, ...withoutBandId } = validBooking
    expect(() => validateAdBooking(withoutBandId)).toThrow()
  })

  it('rejects invalid slotType', () => {
    expect(() =>
      validateAdBooking({ ...validBooking, slotType: 'INVALID_SLOT' }),
    ).toThrow()
  })

  it('rejects headline exceeding 80 characters', () => {
    expect(() =>
      validateAdBooking({
        ...validBooking,
        creative: { ...validBooking.creative, headline: 'x'.repeat(81) },
      }),
    ).toThrow()
  })

  it('rejects invalid ctaUrl', () => {
    expect(() =>
      validateAdBooking({
        ...validBooking,
        creative: { ...validBooking.creative, ctaUrl: 'not-a-url' },
      }),
    ).toThrow()
  })

  it('AD BOOKING INVARIANT: has no chart-ranking fields (ADR-018)', () => {
    const result = validateAdBooking(validBooking)
    expect(result).not.toHaveProperty('chartScore')
    expect(result).not.toHaveProperty('rank')
    expect(result).not.toHaveProperty('fanVotes')
  })
})

// ─── Default concurrent limits ────────────────────────────────────────────────

describe('DEFAULT_MAX_CONCURRENT', () => {
  it('HOME_HERO has exactly 1 concurrent slot (exclusivity)', () => {
    expect(DEFAULT_MAX_CONCURRENT['HOME_HERO']).toBe(1)
  })

  it('NEW_AND_HOT_LIST allows the most concurrent bookings', () => {
    const counts = Object.values(DEFAULT_MAX_CONCURRENT)
    expect(DEFAULT_MAX_CONCURRENT['NEW_AND_HOT_LIST']).toBe(Math.max(...counts))
  })
})
