/**
 * Fingerprint Analysis — Spec §7.1
 *
 * Aggregates multiple behavioural signals into a single suspicion score (0–1).
 * A higher score indicates a higher likelihood of automated/bot behaviour.
 *
 * Design: All signals are normalised to [0, 1] before weighting.
 * Final score is the weighted average of all signals.
 */

export interface UserBehavior {
  /** Array of inter-vote interval durations in milliseconds. */
  voteIntervals: number[]
  /** Total duration of the voting session in milliseconds. */
  sessionDurationMs: number
  /** Number of votes cast in this session. */
  voteCount: number
  /** Whether mouse or scroll events were observed (false = likely headless browser). */
  hasMouseOrScrollEvents: boolean
  /** Unique IP addresses used during the session. */
  uniqueIpCount: number
}

export interface SuspicionSignal {
  name: string
  /** Normalised signal value in [0, 1] — 1 = maximally suspicious. */
  value: number
  weight: number
}

export interface FingerprintAnalysisResult {
  /** Aggregated suspicion score in [0, 1]. */
  suspicionScore: number
  /** Individual signal breakdown for transparency. */
  signals: SuspicionSignal[]
  /** Human-readable risk classification. */
  riskLevel: 'minimal' | 'low' | 'medium' | 'high' | 'critical'
}

/**
 * Calculates Shannon entropy of an array of numbers based on the frequency distribution
 * of unique values. Low entropy (≈ 0) means all values are identical (repetitive/bot-like).
 * High entropy means diverse values (human-like variation).
 *
 * Examples:
 * - [100, 100, 100] → H = 0 (all identical — suspicious)
 * - [100, 200, 300, 400] → H = 2 bits (fully diverse — human-like)
 *
 * @param values - Array of numeric values (e.g. inter-vote timing intervals).
 * @returns Entropy in bits; 0 if all values are identical or the array has ≤ 1 element.
 */
export function shannonEntropy(values: number[]): number {
  if (values.length <= 1) return 0

  // Count frequency of each unique value
  const counts = new Map<number, number>()
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }

  const total = values.length
  return (-[...counts.values()]
    .map((count) => count / total)
    .filter((p) => p > 0)
    .reduce((sum, p) => sum + p * Math.log2(p), 0)) || 0
}

/**
 * Normalises a value to [0, 1] using soft clamping.
 */
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

/**
 * Calculates a suspicion score from a user's behavioural fingerprint.
 *
 * Signals used:
 * 1. Vote timing regularity — low entropy of inter-vote intervals ≈ bot-like
 * 2. Session duration — extremely short sessions relative to vote count ≈ automated
 * 3. Mouse/scroll absence — headless browsers lack interaction events
 * 4. IP diversity — multiple IPs in one session ≈ VPN rotation
 *
 * @param behavior - Observed user behaviour during the voting session.
 * @returns Analysis result with aggregated score and per-signal breakdown.
 */
export function calculateSuspicionScore(behavior: UserBehavior): FingerprintAnalysisResult {
  const signals: SuspicionSignal[] = []

  // Signal 1: Vote timing regularity (low entropy = suspicious)
  if (behavior.voteIntervals.length >= 2) {
    const entropy = shannonEntropy(behavior.voteIntervals)
    // Entropy above 3 bits is human-like; below 0.5 is bot-like
    const timingRegularity = clamp01(1 - entropy / 3)
    signals.push({ name: 'vote_timing_regularity', value: timingRegularity, weight: 0.35 })
  }

  // Signal 2: Session duration vs vote count (< 100ms per vote = suspicious)
  if (behavior.voteCount > 0) {
    const msPerVote = behavior.sessionDurationMs / behavior.voteCount
    // 2000ms per vote = normal; < 200ms = very suspicious
    const speedSuspicion = clamp01(1 - msPerVote / 2000)
    signals.push({ name: 'voting_speed', value: speedSuspicion, weight: 0.30 })
  }

  // Signal 3: No mouse/scroll events (headless browser indicator)
  signals.push({
    name: 'no_interaction_events',
    value: behavior.hasMouseOrScrollEvents ? 0 : 1,
    weight: 0.25,
  })

  // Signal 4: IP diversity (> 1 IP in session = VPN rotation)
  const ipSuspicion = clamp01((behavior.uniqueIpCount - 1) / 3)
  signals.push({ name: 'ip_diversity', value: ipSuspicion, weight: 0.10 })

  // Weighted average
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0)
  const suspicionScore = totalWeight > 0
    ? signals.reduce((sum, s) => sum + s.value * s.weight, 0) / totalWeight
    : 0

  const riskLevel =
    suspicionScore >= 0.85 ? 'critical' :
    suspicionScore >= 0.65 ? 'high' :
    suspicionScore >= 0.40 ? 'medium' :
    suspicionScore >= 0.20 ? 'low' : 'minimal'

  return { suspicionScore, signals, riskLevel }
}
