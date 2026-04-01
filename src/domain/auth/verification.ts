/**
 * @module domain/auth/verification
 *
 * DJ verification request processing and validation.
 * DJs must prove their activity through a minimum of 3 events in the last 12 months
 * to receive verified DJ status on the platform.
 */

/** A single DJ event entry used as proof of activity. */
export interface DJEvent {
  eventName: string
  venue: string
  date: Date
  proofUrl?: string
}

/** A DJ verification request submitted by a user seeking DJ status. */
export interface DJVerificationRequest {
  userId: string
  realName: string
  djName: string
  eventHistory: DJEvent[]
  submittedAt: Date
}

/** Current status of a DJ verification request. */
export type DJVerificationStatus = 'pending' | 'approved' | 'rejected'

/** Minimum number of events in the last 12 months required for DJ verification. */
const MIN_RECENT_EVENTS = 3

/** Number of months to look back when counting recent events. */
const RECENT_MONTHS = 12

/**
 * Returns the cutoff date for "recent" events (12 months ago from now).
 */
function getRecentCutoffDate(): Date {
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - RECENT_MONTHS)
  return cutoff
}

/**
 * Validates a DJ verification application.
 *
 * Rules:
 * - `userId` and `djName` must be non-empty.
 * - `realName` must be at least 2 characters.
 * - `eventHistory` must contain at least 3 events within the last 12 months.
 * - Each event must have a non-empty `eventName`, `venue`, and valid `date`.
 *
 * @param request - The DJ verification request to validate.
 * @returns Validation result with `valid` flag and `errors` array.
 */
export function validateDJApplication(
  request: DJVerificationRequest,
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!request.userId || request.userId.trim().length === 0) {
    errors.push('User ID is required.')
  }
  if (!request.djName || request.djName.trim().length === 0) {
    errors.push('DJ name is required.')
  }
  if (!request.realName || request.realName.trim().length < 2) {
    errors.push('Real name must be at least 2 characters.')
  }

  const cutoff = getRecentCutoffDate()
  const recentEvents = request.eventHistory.filter(event => {
    if (!(event.date instanceof Date) || isNaN(event.date.getTime())) return false
    return event.date >= cutoff
  })

  if (recentEvents.length < MIN_RECENT_EVENTS) {
    errors.push(
      `At least ${MIN_RECENT_EVENTS} events in the last ${RECENT_MONTHS} months are required. ` +
      `Found: ${recentEvents.length}.`,
    )
  }

  for (const [i, event] of request.eventHistory.entries()) {
    if (!event.eventName || event.eventName.trim().length === 0) {
      errors.push(`Event #${i + 1}: event name is required.`)
    }
    if (!event.venue || event.venue.trim().length === 0) {
      errors.push(`Event #${i + 1}: venue is required.`)
    }
    if (!(event.date instanceof Date) || isNaN(event.date.getTime())) {
      errors.push(`Event #${i + 1}: valid date is required.`)
    }
  }

  return { valid: errors.length === 0, errors }
}
