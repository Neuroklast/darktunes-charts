/**
 * @module domain/voting
 *
 * Pure domain layer for all voting business logic.
 * Zero React dependencies; zero external I/O.
 *
 * Sub-modules:
 * - `quadratic`  — Quadratic Voting (fan pillar): cost function, budget validation
 * - `schulze`    — Schulze Beatpath method (DJ pillar): ranked-choice Condorcet voting
 * - `tiers`      — Five-tier band classification and progressive pricing
 * - `audit`      — Transparency log and bot detection
 * - `prediction` — AI breakthrough prediction algorithm
 */

export {
  MONTHLY_CREDIT_BUDGET,
  calculateQuadraticCost,
  calculateMaxVotesForCredits,
  validateFanVotes,
} from './quadratic'

export type { SchulzeResult, BallotRanking } from './schulze'
export {
  calculateSchulzeMethod,
  calculateSchulzeWinner,
  getPairwiseComparison,
} from './schulze'

export type { CategoryCostItem, SubmissionCostResult } from './tiers'
export {
  getTierFromListeners,
  calculateCategoryPrice,
  calculateSubmissionCost,
} from './tiers'

export {
  createTransparencyLogEntry,
  detectBotActivity,
  quarantineVotes,
} from './audit'

export type { AIPredictionFactors, AIPredictionResult } from './prediction'
export { generateAIPrediction } from './prediction'

export type { DecayWindow } from './temporalDecay'
export {
  DEFAULT_DECAY_WINDOWS,
  MINIMUM_TEMPORAL_WEIGHT,
  calculateTemporalWeight,
} from './temporalDecay'
