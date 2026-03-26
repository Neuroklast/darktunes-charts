import { describe, it, expect } from 'vitest'
import {
  rankEvents,
  filterUpcomingEvents,
  type EventWithIntents,
} from '../events/ranking'

const mockEvents: EventWithIntents[] = [
  {
    id: 'e1',
    name: 'Dark Festival',
    venue: 'Arena',
    city: 'Berlin',
    country: 'DE',
    date: new Date('2030-06-15'),
    intentCount: 150,
  },
  {
    id: 'e2',
    name: 'Gothic Night',
    venue: 'Club',
    city: 'Hamburg',
    country: 'DE',
    date: new Date('2030-07-20'),
    intentCount: 250,
  },
  {
    id: 'e3',
    name: 'Industrial Weekend',
    venue: 'Warehouse',
    city: 'Munich',
    country: 'DE',
    date: new Date('2030-05-10'),
    intentCount: 150, // Tie with e1
  },
]

describe('rankEvents', () => {
  it('returns empty array for empty input', () => {
    expect(rankEvents([])).toEqual([])
  })

  it('ranks by intent count descending', () => {
    const ranked = rankEvents(mockEvents)
    expect(ranked[0]!.id).toBe('e2') // 250 intents
    expect(ranked[0]!.rank).toBe(1)
  })

  it('breaks ties by date (earlier first)', () => {
    const tied = mockEvents.filter(e => ['e1', 'e3'].includes(e.id))
    const ranked = rankEvents(tied)
    // e3 is on May 10, e1 is on June 15 — e3 should rank higher on tie
    expect(ranked[0]!.id).toBe('e3')
  })

  it('assigns rank field to each event', () => {
    const ranked = rankEvents(mockEvents)
    for (const event of ranked) {
      expect(event.rank).toBeGreaterThan(0)
    }
  })

  it('does not mutate the input array', () => {
    const original = [...mockEvents]
    rankEvents(mockEvents)
    expect(mockEvents.map(e => e.id)).toEqual(original.map(e => e.id))
  })
})

describe('filterUpcomingEvents', () => {
  it('filters out past events', () => {
    const now = new Date('2030-06-01')
    const upcoming = filterUpcomingEvents(mockEvents, now)
    // e3 (May 10) is in the past
    expect(upcoming.some(e => e.id === 'e3')).toBe(false)
    expect(upcoming.some(e => e.id === 'e1')).toBe(true)
    expect(upcoming.some(e => e.id === 'e2')).toBe(true)
  })

  it('returns all events when all are in the future', () => {
    const past = new Date('2020-01-01')
    const upcoming = filterUpcomingEvents(mockEvents, past)
    expect(upcoming).toHaveLength(mockEvents.length)
  })

  it('returns empty for empty input', () => {
    expect(filterUpcomingEvents([], new Date())).toEqual([])
  })
})
