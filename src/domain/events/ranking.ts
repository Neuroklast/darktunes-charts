/**
 * Event ranking module.
 *
 * Events are ranked by the number of attendee intents (RSVPs) registered
 * by platform users. Future extensions may incorporate geographical proximity,
 * band tier, and social graph signals, but the current implementation provides
 * a transparent, intent-count–based baseline that users can trust.
 */

export interface EventWithIntents {
  id: string
  name: string
  venue: string
  city: string
  country: string
  date: Date
  description?: string
  imageUrl?: string
  intentCount: number
}

export interface RankedEvent extends EventWithIntents {
  rank: number
}

/**
 * Ranks events by attendee intent count (descending).
 *
 * Ties are broken by event date (earlier events rank higher for the same
 * intent count, as they have had less time to accumulate RSVPs).
 *
 * @param events - Events with their intent counts already aggregated.
 * @returns Events with assigned ranks, sorted descending by intent count.
 */
export function rankEvents(events: EventWithIntents[]): RankedEvent[] {
  const sorted = [...events].sort((a, b) => {
    if (b.intentCount !== a.intentCount) {
      return b.intentCount - a.intentCount
    }
    // Tiebreaker: earlier date first (urgency).
    return a.date.getTime() - b.date.getTime()
  })

  let rank = 1
  return sorted.map((event, i) => {
    const prev = sorted[i - 1]
    if (prev && prev.intentCount === event.intentCount) {
      // Same rank as previous (shared rank, no skip).
    } else {
      rank = i + 1
    }
    return { ...event, rank }
  })
}

/**
 * Filters events to only those occurring in the future.
 *
 * @param events - All events.
 * @param now - Reference point (defaults to current time).
 * @returns Events whose date is strictly after now.
 */
export function filterUpcomingEvents(
  events: EventWithIntents[],
  now: Date = new Date()
): EventWithIntents[] {
  return events.filter(e => e.date > now)
}
