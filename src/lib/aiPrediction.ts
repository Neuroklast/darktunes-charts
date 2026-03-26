/**
 * @deprecated Import directly from `@/domain/voting` in new code.
 *
 * Backward-compatibility shim. AI prediction logic has been moved to
 * `src/domain/voting/prediction.ts`. Existing imports continue to work.
 */
export type { AIPredictionFactors, AIPredictionResult } from '@/domain/voting/prediction'
export { generateAIPrediction } from '@/domain/voting/prediction'
