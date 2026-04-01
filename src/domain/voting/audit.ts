import { v4 as uuidv4 } from 'uuid'
import type { TransparencyLogEntry, BotDetectionAlert } from '@/lib/types'

/**
 * Creates a transparency log entry for a submitted vote.
 *
 * Every vote is persisted with an audit ID and full metadata so that any community
 * member can verify vote integrity without revealing individual identities.
 * The `finalContribution` reflects the actual chart impact after weight adjustments.
 *
 * @param trackId - The track that received the vote.
 * @param userId - Hashed or anonymous user identifier (never the raw PII value).
 * @param voteType - Which voting pillar this vote belongs to.
 * @param rawVotes - Raw vote count before weighting.
 * @param creditsSpent - Voice credits spent (fan votes only; pass `undefined` for DJ/peer).
 * @param weight - Anti-manipulation weight applied (1.0 = full weight, < 1.0 = penalised).
 * @param reason - Optional human-readable explanation for non-standard weights.
 * @returns A complete transparency log entry ready for storage and public display.
 */
export function createTransparencyLogEntry(
  trackId: string,
  userId: string,
  voteType: 'fan' | 'dj',
  rawVotes: number,
  creditsSpent: number | undefined,
  weight: number,
  reason?: string
): TransparencyLogEntry {
  const finalContribution = rawVotes * weight
  return {
    id: uuidv4(),
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
 * Detection triggers when ≥ 100 votes arrive within a 60-second window.
 * Severity escalates based on the ratio of new accounts (< 7 days old) and
 * the concentration of votes on suspicious IP addresses (> 5 votes/IP).
 *
 * Flagged votes are quarantined pending manual admin review and do not count
 * towards rankings until cleared (see `quarantineVotes`).
 *
 * @param trackId - Track being inspected for suspicious activity.
 * @param bandId - Band owning the track (used for alert routing).
 * @param voteEvents - Recent vote events with optional metadata for analysis.
 * @returns A BotDetectionAlert if suspicious activity is detected; `null` otherwise.
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
    id: uuidv4(),
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
 * This function is immutable: it produces two new arrays and does not modify
 * the input `allVotes` array.
 *
 * @param alert - The bot detection alert defining the suspicious time window and track.
 * @param allVotes - Full list of transparency log entries for the current voting period.
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
