import { describe, it, expect } from 'vitest'
import {
  calculateTemporalWeight,
  DEFAULT_DECAY_WINDOWS,
  MINIMUM_TEMPORAL_WEIGHT,
  type DecayWindow,
} from '../voting/temporalDecay'

/** Helper: returns a Date that is `days` before the given reference date. */
function daysBefore(reference: Date, days: number): Date {
  return new Date(reference.getTime() - days * 24 * 60 * 60 * 1000)
}

describe('calculateTemporalWeight', () => {
  const periodEnd = new Date('2026-03-30T00:00:00Z')

  // -----------------------------------------------------------------------
  // Default decay windows
  // -----------------------------------------------------------------------

  it('returns 1.0 for a vote cast on the same day as periodEnd', () => {
    expect(calculateTemporalWeight(periodEnd, periodEnd)).toBe(1.0)
  })

  it('returns 1.0 for a vote cast 3 days before periodEnd', () => {
    const vote = daysBefore(periodEnd, 3)
    expect(calculateTemporalWeight(vote, periodEnd)).toBe(1.0)
  })

  it('returns 1.0 for a vote cast exactly 7 days before periodEnd', () => {
    const vote = daysBefore(periodEnd, 7)
    expect(calculateTemporalWeight(vote, periodEnd)).toBe(1.0)
  })

  it('returns 0.9 for a vote cast 8 days before periodEnd', () => {
    const vote = daysBefore(periodEnd, 8)
    expect(calculateTemporalWeight(vote, periodEnd)).toBe(0.9)
  })

  it('returns 0.9 for a vote cast exactly 14 days before periodEnd', () => {
    const vote = daysBefore(periodEnd, 14)
    expect(calculateTemporalWeight(vote, periodEnd)).toBe(0.9)
  })

  it('returns 0.8 for a vote cast 15 days before periodEnd', () => {
    const vote = daysBefore(periodEnd, 15)
    expect(calculateTemporalWeight(vote, periodEnd)).toBe(0.8)
  })

  it('returns 0.8 for a vote cast exactly 21 days before periodEnd', () => {
    const vote = daysBefore(periodEnd, 21)
    expect(calculateTemporalWeight(vote, periodEnd)).toBe(0.8)
  })

  it('returns 0.7 for a vote cast 22 days before periodEnd', () => {
    const vote = daysBefore(periodEnd, 22)
    expect(calculateTemporalWeight(vote, periodEnd)).toBe(0.7)
  })

  it('returns 0.7 for a vote cast exactly 30 days before periodEnd', () => {
    const vote = daysBefore(periodEnd, 30)
    expect(calculateTemporalWeight(vote, periodEnd)).toBe(0.7)
  })

  it('returns MINIMUM_TEMPORAL_WEIGHT for a vote cast 60 days before periodEnd', () => {
    const vote = daysBefore(periodEnd, 60)
    expect(calculateTemporalWeight(vote, periodEnd)).toBe(MINIMUM_TEMPORAL_WEIGHT)
  })

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  it('returns 1.0 for a vote cast AFTER the period end', () => {
    const futureVote = new Date(periodEnd.getTime() + 1000)
    expect(calculateTemporalWeight(futureVote, periodEnd)).toBe(1.0)
  })

  it('accepts ISO-8601 string arguments', () => {
    const vote = '2026-03-28T12:00:00Z' // 1.5 days before
    const end = '2026-03-30T00:00:00Z'
    expect(calculateTemporalWeight(vote, end)).toBe(1.0)
  })

  it('accepts numeric (epoch ms) arguments', () => {
    const endMs = periodEnd.getTime()
    const voteMs = endMs - 10 * 24 * 60 * 60 * 1000 // 10 days before
    expect(calculateTemporalWeight(voteMs, endMs)).toBe(0.9)
  })

  it('throws RangeError for invalid date strings', () => {
    expect(() => calculateTemporalWeight('not-a-date', periodEnd)).toThrow(RangeError)
    expect(() => calculateTemporalWeight(periodEnd, 'invalid')).toThrow(RangeError)
  })

  // -----------------------------------------------------------------------
  // Custom windows
  // -----------------------------------------------------------------------

  it('supports custom decay windows', () => {
    const customWindows: DecayWindow[] = [
      { maxDaysBeforeEnd: 3, weight: 1.0 },
      { maxDaysBeforeEnd: 7, weight: 0.5 },
    ]

    const recent = daysBefore(periodEnd, 2)
    const older = daysBefore(periodEnd, 5)
    const veryOld = daysBefore(periodEnd, 10)

    expect(calculateTemporalWeight(recent, periodEnd, customWindows)).toBe(1.0)
    expect(calculateTemporalWeight(older, periodEnd, customWindows)).toBe(0.5)
    expect(calculateTemporalWeight(veryOld, periodEnd, customWindows)).toBe(MINIMUM_TEMPORAL_WEIGHT)
  })

  // -----------------------------------------------------------------------
  // Constants validation
  // -----------------------------------------------------------------------

  it('DEFAULT_DECAY_WINDOWS has 4 windows sorted ascending by maxDaysBeforeEnd', () => {
    expect(DEFAULT_DECAY_WINDOWS).toHaveLength(4)
    for (let i = 1; i < DEFAULT_DECAY_WINDOWS.length; i++) {
      expect(DEFAULT_DECAY_WINDOWS[i]!.maxDaysBeforeEnd)
        .toBeGreaterThan(DEFAULT_DECAY_WINDOWS[i - 1]!.maxDaysBeforeEnd)
    }
  })

  it('DEFAULT_DECAY_WINDOWS weights are monotonically decreasing', () => {
    for (let i = 1; i < DEFAULT_DECAY_WINDOWS.length; i++) {
      expect(DEFAULT_DECAY_WINDOWS[i]!.weight)
        .toBeLessThanOrEqual(DEFAULT_DECAY_WINDOWS[i - 1]!.weight)
    }
  })

  it('MINIMUM_TEMPORAL_WEIGHT equals the last window weight', () => {
    const lastWeight = DEFAULT_DECAY_WINDOWS[DEFAULT_DECAY_WINDOWS.length - 1]!.weight
    expect(MINIMUM_TEMPORAL_WEIGHT).toBe(lastWeight)
  })

  // -----------------------------------------------------------------------
  // Pure function guarantee
  // -----------------------------------------------------------------------

  it('is a pure function — same inputs yield same output', () => {
    const vote = daysBefore(periodEnd, 10)
    const w1 = calculateTemporalWeight(vote, periodEnd)
    const w2 = calculateTemporalWeight(vote, periodEnd)
    expect(w1).toBe(w2)
  })
})
