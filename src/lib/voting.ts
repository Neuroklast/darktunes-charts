/**
 * @deprecated Import directly from `@/domain/voting` in new code.
 *
 * This module is a backward-compatibility shim. All business logic has been
 * moved to the domain layer (`src/domain/voting/`). Existing imports from
 * `@/lib/voting` continue to work without changes.
 */

// Quadratic Voting
export {
  MONTHLY_CREDIT_BUDGET,
  calculateQuadraticCost,
  calculateMaxVotesForCredits,
  validateFanVotes,
} from '@/domain/voting/quadratic'

// Schulze Method
export {
  calculateSchulzeWinner,
} from '@/domain/voting/schulze'

// Peer / Anti-Collusion
export {
  calculateCliqueCoefficient,
  applyCliqueWeighting,
} from '@/domain/voting/peer'

// Tier Classification & Pricing
export {
  getTierFromListeners,
  calculateCategoryPrice,
  calculateSubmissionCost,
} from '@/domain/voting/tiers'

// Audit & Bot Detection
export {
  createTransparencyLogEntry,
  detectBotActivity,
  quarantineVotes,
} from './votingAudit'

// AI Prediction
export { generateAIPrediction } from './aiPrediction'
export type { AIPredictionFactors, AIPredictionResult } from './aiPrediction'

// Spotify
export { simulateSpotifyListenersFetch } from './spotifyApi'
