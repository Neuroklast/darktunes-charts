/**
 * @module domain/voting/quorum
 *
 * DJ Quorum System with graceful weight degradation.
 *
 * The Schulze method used for DJ ballots is statistically volatile when fewer
 * than five ballots are present. This module defines quorum thresholds and a
 * degradation strategy that reduces (and eventually zeroes) the DJ pillar weight
 * when quorum is not met, redistributing the displaced weight entirely to the
 * Fan pillar so that the combined weights always sum to 1.0.
 *
 * Quorum levels:
 * - full      (≥10 ballots): DJ weight unchanged.
 * - partial   (≥5,  <10): DJ weight × 0.5; remainder redistributed to fan.
 * - minimum   (≥3,  <5): DJ weight × 0.25; remainder redistributed to fan.
 * - insufficient (<3):  DJ weight zeroed; 100 % redistributed to fan.
 */

import type { PillarWeights } from './combined'

/** Ballot thresholds for each quorum level. */
export const DJ_QUORUM = {
  full: 10,
  partial: 5,
  minimum: 3,
} as const

export interface QuorumStatus {
  ballotCount: number
  level: 'full' | 'partial' | 'minimum' | 'insufficient'
  effectiveDJWeightMultiplier: number
  adjustedWeights: PillarWeights
  warning?: string
}

/**
 * Evaluates the DJ quorum and returns adjusted pillar weights.
 *
 * When DJ quorum is not fully met, the DJ weight is reduced by the specified
 * multiplier and the entire remainder is redistributed to the Fan pillar.
 *
 * The `adjustedWeights` property always sums exactly to 1.0.
 *
 * @param ballotCount  - Number of valid DJ ballots cast in the current period.
 * @param baseWeights  - The category-specific base weights (fan + dj = 1.0).
 * @returns QuorumStatus with adjusted weights and a transparency warning when needed.
 */
export function evaluateQuorum(ballotCount: number, baseWeights: PillarWeights): QuorumStatus {
  const clampedCount = Math.max(0, ballotCount)

  const level = resolveLevel(clampedCount)
  const multiplier = MULTIPLIER_BY_LEVEL[level]

  const adjustedWeights = computeAdjustedWeights(baseWeights, multiplier)

  return {
    ballotCount: clampedCount,
    level,
    effectiveDJWeightMultiplier: multiplier,
    adjustedWeights,
    warning: buildWarning(level, clampedCount),
  }
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

const MULTIPLIER_BY_LEVEL: Record<QuorumStatus['level'], number> = {
  full: 1.0,
  partial: 0.5,
  minimum: 0.25,
  insufficient: 0.0,
}

function resolveLevel(ballotCount: number): QuorumStatus['level'] {
  if (ballotCount >= DJ_QUORUM.full) return 'full'
  if (ballotCount >= DJ_QUORUM.partial) return 'partial'
  if (ballotCount >= DJ_QUORUM.minimum) return 'minimum'
  return 'insufficient'
}

/**
 * Redistributes the displaced DJ weight entirely to the Fan pillar.
 *
 * The displaced amount is `djWeight * (1 - multiplier)`.
 * All displaced weight goes to fan since peer pillar no longer exists.
 */
function computeAdjustedWeights(base: PillarWeights, djMultiplier: number): PillarWeights {
  const effectiveDJ = base.dj * djMultiplier
  const displaced = base.dj - effectiveDJ

  return { fan: base.fan + displaced, dj: effectiveDJ }
}

function buildWarning(level: QuorumStatus['level'], ballotCount: number): string | undefined {
  switch (level) {
    case 'full':
      return undefined
    case 'partial':
      return `DJ quorum partial: ${ballotCount} ballots (minimum for full weight: ${DJ_QUORUM.full}). DJ weight halved.`
    case 'minimum':
      return `DJ quorum minimum: ${ballotCount} ballots (minimum for partial weight: ${DJ_QUORUM.partial}). DJ weight reduced to 25 %.`
    case 'insufficient':
      return `DJ quorum not met: ${ballotCount} ballot(s) (minimum: ${DJ_QUORUM.minimum}). DJ scores excluded from ranking.`
  }
}
