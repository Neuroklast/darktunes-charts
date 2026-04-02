import { describe, it, expect } from 'vitest'
import {
  validateWeeklyBooking,
  getWeekStart,
  isWeekBoundary,
  MS_PER_WEEK,
} from '../index'

// Helper: create a Monday 00:00:00 UTC date for a given ISO string
function monday(isoDate: string): Date {
  return new Date(isoDate + 'T00:00:00.000Z')
}

// A known Monday: 2026-01-05
const MONDAY_2026_01_05 = monday('2026-01-05')
// The following Monday: 2026-01-12
const MONDAY_2026_01_12 = monday('2026-01-12')
// A Wednesday: 2026-01-07
const WEDNESDAY_2026_01_07 = new Date('2026-01-07T00:00:00.000Z')

describe('isWeekBoundary', () => {
  it('returns true for Monday 00:00:00 UTC', () => {
    expect(isWeekBoundary(MONDAY_2026_01_05)).toBe(true)
  })

  it('returns false for Wednesday', () => {
    expect(isWeekBoundary(WEDNESDAY_2026_01_07)).toBe(false)
  })

  it('returns false for Monday with non-zero hours', () => {
    const mondayNoon = new Date('2026-01-05T12:00:00.000Z')
    expect(isWeekBoundary(mondayNoon)).toBe(false)
  })

  it('returns false for Monday with non-zero minutes', () => {
    const mondayWithMinutes = new Date('2026-01-05T00:30:00.000Z')
    expect(isWeekBoundary(mondayWithMinutes)).toBe(false)
  })

  it('returns false for Sunday', () => {
    const sunday = new Date('2026-01-04T00:00:00.000Z')
    expect(isWeekBoundary(sunday)).toBe(false)
  })
})

describe('getWeekStart', () => {
  it('returns the same Monday for a Monday input', () => {
    const result = getWeekStart(MONDAY_2026_01_05)
    expect(result.toISOString()).toBe('2026-01-05T00:00:00.000Z')
  })

  it('returns the preceding Monday for a Wednesday input', () => {
    const result = getWeekStart(WEDNESDAY_2026_01_07)
    expect(result.toISOString()).toBe('2026-01-05T00:00:00.000Z')
  })

  it('returns the preceding Monday for a Sunday input', () => {
    const sunday = new Date('2026-01-11T00:00:00.000Z')
    const result = getWeekStart(sunday)
    expect(result.toISOString()).toBe('2026-01-05T00:00:00.000Z')
  })

  it('returns the same Monday for a Saturday input', () => {
    const saturday = new Date('2026-01-10T00:00:00.000Z')
    const result = getWeekStart(saturday)
    expect(result.toISOString()).toBe('2026-01-05T00:00:00.000Z')
  })
})

describe('validateWeeklyBooking', () => {
  // Use a fixed "now" = Wednesday 2026-01-07 to make tests deterministic
  const NOW = WEDNESDAY_2026_01_07

  it('accepts a valid 1-week booking starting this Monday', () => {
    const result = validateWeeklyBooking(MONDAY_2026_01_05, 1, NOW)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.endDate?.toISOString()).toBe('2026-01-12T00:00:00.000Z')
  })

  it('accepts a valid 3-week booking starting next Monday', () => {
    const result = validateWeeklyBooking(MONDAY_2026_01_12, 3, NOW)
    expect(result.valid).toBe(true)
    expect(result.endDate?.getTime()).toBe(MONDAY_2026_01_12.getTime() + 3 * MS_PER_WEEK)
  })

  it('rejects a startDate that is not a week boundary (Wednesday)', () => {
    const result = validateWeeklyBooking(WEDNESDAY_2026_01_07, 1, NOW)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Monday/)
  })

  it('rejects weekCount of 0', () => {
    const result = validateWeeklyBooking(MONDAY_2026_01_05, 0, NOW)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/minimum 1/)
  })

  it('rejects negative weekCount', () => {
    const result = validateWeeklyBooking(MONDAY_2026_01_05, -2, NOW)
    expect(result.valid).toBe(false)
  })

  it('rejects a startDate in the past (before current week)', () => {
    // Past Monday: 2025-12-29
    const pastMonday = new Date('2025-12-29T00:00:00.000Z')
    const result = validateWeeklyBooking(pastMonday, 1, NOW)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/past/)
  })

  it('rejects a startDate with non-zero time component', () => {
    const mondayNoon = new Date('2026-01-05T12:00:00.000Z')
    const result = validateWeeklyBooking(mondayNoon, 1, NOW)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Monday/)
  })

  it('computes endDate correctly for 2 weeks', () => {
    const result = validateWeeklyBooking(MONDAY_2026_01_05, 2, NOW)
    expect(result.valid).toBe(true)
    expect(result.endDate?.toISOString()).toBe('2026-01-19T00:00:00.000Z')
  })
})
