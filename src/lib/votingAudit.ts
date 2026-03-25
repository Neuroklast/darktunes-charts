import type { TransparencyLogEntry, BotDetectionAlert } from './types'

/**
 * Creates a transparency log entry for a submitted vote.
 *
 * Every vote is persisted with an audit ID and full metadata so that any community
 * member can verify vote integrity without revealing individual identities.
 *
 * @param trackId - The track that received the vote.
 * @param userId - Hashed or anonymous user identifier.
 * @param voteType - Which voting pillar this vote belongs to.
 * @param rawVotes - Raw vote count before weighting.
 * @param creditsSpent - Voice credits spent (fan votes only; undefined for DJ/peer).
 * @param weight - Clique/anti-manipulation weight applied (1.0 = full weight).
 * @param reason - Optional explanation for non-standard weights.
 * @returns A complete transparency log entry ready for storage.
 */
export function createTransparencyLogEntry(
  trackId: string,
  userId: string,
  voteType: 'fan' | 'dj' | 'peer',
  rawVotes: number,
  creditsSpent: number | undefined,
  weight: number,
  reason?: string
): TransparencyLogEntry {
  const finalContribution = rawVotes * weight
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    timestamp: Date.now(),
    trackId,
    userId,
    voteType,
    rawVotes,
    creditsSpent,
    weight,
    finalContribution,
    reason,
  }
}

/**
 * Analyses recent vote events for a track and flags potential bot activity.
 *
 * Detection triggers when >= 100 votes arrive within 60 seconds. Severity escalates
 * based on the ratio of new accounts and concentration on suspicious IP addresses.
 * Flagged votes are quarantined pending manual review.
 *
 * @param trackId - Track being inspected.
 * @param bandId - Band owning the track.
 * @param voteEvents - Recent vote events with optional metadata.
 * @returns A BotDetectionAlert if suspicious activity is detected, otherwise null.
 */
export function detectBotActivity(
  trackId: string,
  bandId: string,
  voteEvents: Array<{ timestamp: number; userId: string; ip?: string; accountAge?: number }>
): BotDetectionAlert | null {
  const now = Date.now()
  const oneMinute = 60 * 1_000
  const recentVotes = voteEvents.filter(v => now - v.timestamp < oneMinute)

  if (recentVotes.length < 100) {
    return null
  }

  const newAccounts = recentVotes.filter(
    v => v.accountAge !== undefined && v.accountAge < 7 * 24 * 60 * 60 * 1_000
  )
  const newAccountRatio = newAccounts.length / recentVotes.length

  const suspiciousIPs = recentVotes
    .filter(v => v.ip !== undefined)
    .map(v => v.ip as string)
    .filter((ip, _idx, arr) => arr.filter(i => i === ip).length > 5)

  let severity: 'low' | 'medium' | 'high' = 'low'
  if (newAccountRatio > 0.7 && suspiciousIPs.length > 3) {
    severity = 'high'
  } else if (newAccountRatio > 0.5 || suspiciousIPs.length > 2) {
    severity = 'medium'
  }

  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    timestamp: now,
    trackId,
    bandId,
    alertType: 'velocity',
    severity,
    details: {
      votesCount: recentVotes.length,
      timeWindow: oneMinute,
      suspiciousIPs: Array.from(new Set(suspiciousIPs)),
      newAccountRatio,
    },
    status: 'flagged',
  }
}

/**
 * Separates votes into quarantined and clean sets based on a bot detection alert.
 *
 * Quarantined votes do not count towards rankings until cleared by an admin.
 * This ensures chart integrity even when manipulation is detected in real time.
 *
 * @param alert - The bot detection alert defining the suspicious time window.
 * @param allVotes - Full list of transparency log entries for this voting period.
 * @returns Two disjoint arrays: quarantined votes and clean votes.
 */
export function quarantineVotes(
  alert: BotDetectionAlert,
  allVotes: TransparencyLogEntry[]
): { quarantined: TransparencyLogEntry[]; clean: TransparencyLogEntry[] } {
  const quarantined = allVotes.filter(
    v =>
      v.trackId === alert.trackId &&
      v.timestamp > alert.timestamp - alert.details.timeWindow
  )

  const quarantinedIds = new Set(quarantined.map(v => v.id))
  const clean = allVotes.filter(v => !quarantinedIds.has(v.id))

  return { quarantined, clean }
}
