/**
 * @deprecated Import directly from `@/domain/voting` in new code.
 *
 * Backward-compatibility shim. All Schulze method logic has been moved to
 * `src/domain/voting/schulze.ts`. Existing imports continue to work.
 */
export type { SchulzeResult, BallotRanking } from '@/domain/voting/schulze'
export {
  calculateSchulzeMethod,
  calculateSchulzeWinner,
  getPairwiseComparison,
} from '@/domain/voting/schulze'
