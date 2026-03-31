/**
 * @module domain/security/trustScore
 *
 * Progressive Trust Score — Sybil Resistance System.
 *
 * New accounts have zero effective voting power. Trust is earned gradually
 * through account age, OAuth verification, and completed voting cycles.
 * Bot flags reduce trust; multiple verified OAuth providers increase it.
 *
 * Why account aging?
 *   Mass account creation (Sybil attacks) is the principal threat to QV-based
 *   voting. A new account requires meaningful time investment before its votes
 *   carry weight, making large-scale Sybil attacks economically unattractive.
 *
 * Trust levels and their multipliers:
 * | Level       | Age              | Multiplier | Notes                        |
 * |-------------|------------------|------------|------------------------------|
 * | new         | Day 1–6          | 0.1        | Can browse; minimal weight   |
 * | building    | Day 7–29         | 0.25       | Requires ≥1 verified OAuth   |
 * | established | Day 30–89        | 0.5        | —                            |
 * | trusted     | Day 90–364       | 0.75       | —                            |
 * | veteran     | Day 365+         | 1.0        | Full voting weight           |
 *
 * Day 0 (same day as account creation): multiplier 0.0 — no vote weight.
 *
 * Adjustments applied after base multiplier:
 * - +0.1 bonus for 2+ verified OAuth providers (capped at 1.0).
 * - −0.15 per confirmed bot flag (clamped to 0.0 minimum).
 *
 * effectiveCredits = floor(100 * finalMultiplier)
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Factors used to compute the trust score for an account. */
export interface TrustFactors {
  /** Milliseconds since the account was created (Date.now() − createdAt). */
  accountAgeMs: number
  /** Whether the user has completed at least one OAuth login flow. */
  hasVerifiedOAuth: boolean
  /** Number of distinct OAuth providers linked to the account. */
  oauthProviderCount: number
  /** Number of completed monthly voting cycles. */
  votingCyclesCompleted: number
  /** Number of confirmed bot-detection flags on this account. */
  botFlagCount: number
  /** Profile completeness as a percentage (0–100). */
  profileCompletenessPercent: number
}

/** Result of the trust score calculation. */
export interface TrustResult {
  /** Final vote-weight multiplier in [0.0, 1.0]. */
  multiplier: number
  /** Named trust level based on account age and verifications. */
  level: 'new' | 'building' | 'established' | 'trusted' | 'veteran'
  /** Effective voice credits this period: floor(100 * multiplier). */
  effectiveCredits: number
  /** Human-readable reasons explaining each factor applied. */
  reasons: string[]
  /**
   * Optional message telling the user when they reach the next level,
   * e.g. "In 14 days you'll reach 'established'".
   */
  nextLevelAt?: string
}

/**
 * Calculates the progressive trust score for an account.
 *
 * Account age is clamped to ≥0 days to handle edge cases such as clock skew
 * or accounts whose `createdAt` timestamp is in the future.
 *
 * @param factors      - The trust factors for the account.
 * @param totalCredits - Optional override for the base credit pool (default: 100).
 * @returns TrustResult with the final multiplier, level, and transparency reasons.
 */
export function calculateTrustScore(factors: TrustFactors, totalCredits = 100): TrustResult {
  const ageDays = Math.max(0, Math.floor(factors.accountAgeMs / MS_PER_DAY))

  const { baseMultiplier, level } = resolveBaseMultiplier(ageDays, factors.hasVerifiedOAuth)
  const reasons: string[] = buildBaseReasons(ageDays, level, factors.hasVerifiedOAuth)

  let multiplier = baseMultiplier

  // OAuth bonus: +0.1 for 2+ providers
  if (factors.oauthProviderCount >= 2) {
    multiplier += 0.1
    reasons.push(`+0.1 bonus: ${factors.oauthProviderCount} verified OAuth providers linked.`)
  }

  // Bot flag penalty: −0.15 per flag
  if (factors.botFlagCount > 0) {
    const penalty = factors.botFlagCount * 0.15
    multiplier -= penalty
    reasons.push(`−${penalty.toFixed(2)} penalty: ${factors.botFlagCount} confirmed bot flag(s).`)
  }

  // Clamp to [0.0, 1.0]
  multiplier = Math.min(1.0, Math.max(0.0, multiplier))

  const effectiveCredits = Math.floor(totalCredits * multiplier)
  const nextLevelAt = buildNextLevelMessage(ageDays, level)

  return { multiplier, level, effectiveCredits, reasons, nextLevelAt }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

interface BaseResolution {
  baseMultiplier: number
  level: TrustResult['level']
}

function resolveBaseMultiplier(ageDays: number, hasVerifiedOAuth: boolean): BaseResolution {
  if (ageDays === 0) {
    return { baseMultiplier: 0.0, level: 'new' }
  }
  if (ageDays < 7) {
    return { baseMultiplier: 0.1, level: 'new' }
  }
  if (ageDays < 30) {
    // 'building' requires at least 1 verified OAuth; without it, stay at 'new' multiplier.
    const baseMultiplier = hasVerifiedOAuth ? 0.25 : 0.1
    return { baseMultiplier, level: 'building' }
  }
  if (ageDays < 90) {
    return { baseMultiplier: 0.5, level: 'established' }
  }
  if (ageDays < 365) {
    return { baseMultiplier: 0.75, level: 'trusted' }
  }
  return { baseMultiplier: 1.0, level: 'veteran' }
}

function buildBaseReasons(
  ageDays: number,
  level: TrustResult['level'],
  hasVerifiedOAuth: boolean,
): string[] {
  const reasons: string[] = []

  if (ageDays === 0) {
    reasons.push('Account created today. Votes have no weight on day 0.')
    return reasons
  }

  reasons.push(`Account age: ${ageDays} day(s) → level "${level}".`)

  if (level === 'building' && !hasVerifiedOAuth) {
    reasons.push('No verified OAuth provider found. Multiplier stays at 0.1 until at least one OAuth provider is linked.')
  }

  return reasons
}

/** Builds a human-readable "next level" hint for display in the fan profile. */
function buildNextLevelMessage(ageDays: number, level: TrustResult['level']): string | undefined {
  const thresholds: Record<Exclude<TrustResult['level'], 'veteran'>, number> = {
    new: 7,
    building: 30,
    established: 90,
    trusted: 365,
  }

  if (level === 'veteran') return undefined

  const nextThreshold = thresholds[level]
  const daysRemaining = nextThreshold - ageDays

  const nextLevel: Record<Exclude<TrustResult['level'], 'veteran'>, TrustResult['level']> = {
    new: 'building',
    building: 'established',
    established: 'trusted',
    trusted: 'veteran',
  }

  return `In ${daysRemaining} day(s) you'll reach '${nextLevel[level]}'.`
}
