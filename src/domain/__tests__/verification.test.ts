import { describe, it, expect } from 'vitest'
import { validateDJApplication, type DJVerificationRequest } from '../auth/verification'

function makeRequest(overrides: Partial<DJVerificationRequest> = {}): DJVerificationRequest {
  const now = new Date()
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const nineMonthsAgo = new Date(now)
  nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9)

  return {
    userId: 'user-1',
    realName: 'Max Mustermann',
    djName: 'DJ Nachtschatten',
    eventHistory: [
      { eventName: 'Gothic Pogo Party', venue: 'Kulttempel Oberhausen', date: threeMonthsAgo },
      { eventName: 'Schwarze Nacht', venue: 'Nachtleben Frankfurt', date: sixMonthsAgo },
      { eventName: 'Dunkel&Schön', venue: 'Moritzbastei Leipzig', date: nineMonthsAgo },
    ],
    submittedAt: now,
    ...overrides,
  }
}

describe('validateDJApplication', () => {
  it('accepts a valid application with 3 recent events', () => {
    const result = validateDJApplication(makeRequest())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects missing userId', () => {
    const result = validateDJApplication(makeRequest({ userId: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('User ID'))).toBe(true)
  })

  it('rejects missing djName', () => {
    const result = validateDJApplication(makeRequest({ djName: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('DJ name'))).toBe(true)
  })

  it('rejects short realName', () => {
    const result = validateDJApplication(makeRequest({ realName: 'X' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Real name'))).toBe(true)
  })

  it('rejects fewer than 3 recent events', () => {
    const now = new Date()
    const twoYearsAgo = new Date(now)
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const result = validateDJApplication(makeRequest({
      eventHistory: [
        { eventName: 'Old Event', venue: 'Old Venue', date: twoYearsAgo },
      ],
    }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('At least 3 events'))).toBe(true)
  })

  it('rejects events with missing event names', () => {
    const now = new Date()
    const recentDate = new Date(now)
    recentDate.setMonth(recentDate.getMonth() - 1)

    const result = validateDJApplication(makeRequest({
      eventHistory: [
        { eventName: '', venue: 'Venue', date: recentDate },
        { eventName: 'Event 2', venue: 'Venue 2', date: recentDate },
        { eventName: 'Event 3', venue: 'Venue 3', date: recentDate },
      ],
    }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Event #1: event name'))).toBe(true)
  })

  it('rejects events with missing venue', () => {
    const now = new Date()
    const recentDate = new Date(now)
    recentDate.setMonth(recentDate.getMonth() - 1)

    const result = validateDJApplication(makeRequest({
      eventHistory: [
        { eventName: 'Event 1', venue: '', date: recentDate },
        { eventName: 'Event 2', venue: 'Venue 2', date: recentDate },
        { eventName: 'Event 3', venue: 'Venue 3', date: recentDate },
      ],
    }))
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('venue'))).toBe(true)
  })
})
