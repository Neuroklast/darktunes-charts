/**
 * Bot Detection Algorithms — Spec §7.1
 *
 * Provides voting pattern analysis to detect automated or coordinated manipulation.
 * All functions are pure and side-effect-free; integration with the database
 * happens at the API layer.
 */

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface BotDetectionAlert {
  type: string
  severity: AlertSeverity
  /** Human-readable description of the detected pattern. */
  description: string
  /** IDs of affected voters or IPs. */
  affectedIds: string[]
  /** Unix timestamp when the suspicious activity was detected. */
  detectedAt: number
}

export interface VoteRecord {
  voterId: string
  /** IPv4 or IPv6 address. */
  ipAddress: string
  /** Unix timestamp (ms) when the vote was cast. */
  timestamp: number
  /** Serialised ballot for deduplication (e.g. JSON of track IDs). */
  ballotHash: string
  /** ISO 8601 date when the voter account was created. */
  accountCreatedAt: string
}

/** Maximum votes allowed per unique IP within the burst window. */
const BURST_VOTE_THRESHOLD = 10
/** Time window for burst detection in milliseconds (5 minutes). */
const BURST_WINDOW_MS = 5 * 60 * 1000
/** Minimum identical ballots to flag as suspicious. */
const IDENTICAL_BALLOT_THRESHOLD = 3
/** Account age threshold in milliseconds — accounts younger than this are considered new. */
const NEW_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000
/** Minimum new-account votes to trigger a mass-voting alert. */
const NEW_ACCOUNT_VOTE_THRESHOLD = 5
/** Night-time voting anomaly window (UTC hours 02:00–04:00). */
const ANOMALY_HOUR_START = 2
const ANOMALY_HOUR_END = 4
/** Minimum clustered night-time votes to trigger a time anomaly alert. */
const NIGHT_VOTE_THRESHOLD = 8

/**
 * Groups vote records by IP address and detects burst voting:
 * more than BURST_VOTE_THRESHOLD votes from the same IP within BURST_WINDOW_MS.
 */
function detectBurstVoting(votes: VoteRecord[]): BotDetectionAlert[] {
  const alerts: BotDetectionAlert[] = []
  const byIp = new Map<string, VoteRecord[]>()

  for (const vote of votes) {
    const existing = byIp.get(vote.ipAddress) ?? []
    existing.push(vote)
    byIp.set(vote.ipAddress, existing)
  }

  for (const [ip, ipVotes] of byIp.entries()) {
    const sorted = [...ipVotes].sort((a, b) => a.timestamp - b.timestamp)

    for (let i = 0; i < sorted.length; i++) {
      const windowStart = sorted[i].timestamp
      const windowVotes = sorted.filter(
        (v) => v.timestamp >= windowStart && v.timestamp <= windowStart + BURST_WINDOW_MS
      )
      if (windowVotes.length > BURST_VOTE_THRESHOLD) {
        alerts.push({
          type: 'BURST_VOTING',
          severity: windowVotes.length > BURST_VOTE_THRESHOLD * 2 ? 'critical' : 'high',
          description: `IP ${ip} cast ${windowVotes.length} votes within ${BURST_WINDOW_MS / 60_000} minutes`,
          affectedIds: [ip],
          detectedAt: Date.now(),
        })
        break // One alert per IP
      }
    }
  }

  return alerts
}

/**
 * Detects multiple voters submitting identical DJ ballots.
 * Identical ballot patterns are a strong signal of coordinated voting.
 */
function detectIdenticalBallots(votes: VoteRecord[]): BotDetectionAlert[] {
  const alerts: BotDetectionAlert[] = []
  const byHash = new Map<string, string[]>()

  for (const vote of votes) {
    if (!vote.ballotHash) continue
    const voters = byHash.get(vote.ballotHash) ?? []
    voters.push(vote.voterId)
    byHash.set(vote.ballotHash, voters)
  }

  for (const [hash, voterIds] of byHash.entries()) {
    if (voterIds.length >= IDENTICAL_BALLOT_THRESHOLD) {
      alerts.push({
        type: 'IDENTICAL_BALLOT',
        severity: voterIds.length >= IDENTICAL_BALLOT_THRESHOLD * 2 ? 'high' : 'medium',
        description: `${voterIds.length} users submitted identical ballot (hash: ${hash.slice(0, 8)}…)`,
        affectedIds: voterIds,
        detectedAt: Date.now(),
      })
    }
  }

  return alerts
}

/**
 * Detects new accounts (<24h old) casting many votes — a common bot pattern.
 */
function detectNewAccountMassVoting(votes: VoteRecord[]): BotDetectionAlert[] {
  const alerts: BotDetectionAlert[] = []
  const newAccountVotes = new Map<string, number>()

  for (const vote of votes) {
    const accountAge = vote.timestamp - new Date(vote.accountCreatedAt).getTime()
    if (accountAge < NEW_ACCOUNT_AGE_MS) {
      newAccountVotes.set(vote.voterId, (newAccountVotes.get(vote.voterId) ?? 0) + 1)
    }
  }

  for (const [voterId, count] of newAccountVotes.entries()) {
    if (count >= NEW_ACCOUNT_VOTE_THRESHOLD) {
      alerts.push({
        type: 'NEW_ACCOUNT_MASS_VOTING',
        severity: count >= NEW_ACCOUNT_VOTE_THRESHOLD * 2 ? 'high' : 'medium',
        description: `New account ${voterId} cast ${count} votes within 24h of registration`,
        affectedIds: [voterId],
        detectedAt: Date.now(),
      })
    }
  }

  return alerts
}

/**
 * Detects votes clustered in unusual hours (02:00–04:00 UTC),
 * which is atypical human behaviour for most locales.
 */
function detectTimeOfDayAnomaly(votes: VoteRecord[]): BotDetectionAlert[] {
  const nightVotes = votes.filter((vote) => {
    const hour = new Date(vote.timestamp).getUTCHours()
    return hour >= ANOMALY_HOUR_START && hour < ANOMALY_HOUR_END
  })

  if (nightVotes.length < NIGHT_VOTE_THRESHOLD) return []

  const affectedIds = [...new Set(nightVotes.map((v) => v.voterId))]

  return [
    {
      type: 'TIME_OF_DAY_ANOMALY',
      severity: 'low',
      description: `${nightVotes.length} votes cast between 02:00–04:00 UTC — unusual activity window`,
      affectedIds,
      detectedAt: Date.now(),
    },
  ]
}

/**
 * Runs all bot-detection heuristics over a set of vote records.
 *
 * Each heuristic is independent; multiple alerts can be generated for the
 * same voter if they exhibit several suspicious patterns simultaneously.
 *
 * @param votes - Array of vote records to analyse.
 * @returns Array of bot detection alerts, sorted by severity (critical first).
 */
export function analyzeVotingPatterns(votes: VoteRecord[]): BotDetectionAlert[] {
  if (votes.length === 0) return []

  const severityOrder: Record<AlertSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  }

  const allAlerts = [
    ...detectBurstVoting(votes),
    ...detectIdenticalBallots(votes),
    ...detectNewAccountMassVoting(votes),
    ...detectTimeOfDayAnomaly(votes),
  ]

  return allAlerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  )
}
