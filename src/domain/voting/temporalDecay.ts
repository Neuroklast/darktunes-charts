/**
 * Temporal vote decay module.
 *
 * Implements a time-based weighting function that gives higher weight to
 * more recent votes within a voting period.  This ensures that the chart
 * reflects temporal relevance: votes cast closer to the period end carry
 * more influence than votes cast at the beginning of the period.
 *
 * Decay windows (measured backwards from `periodEnd`):
 *
 * | Window         | Weight |
 * |----------------|--------|
 * | 0 – 7 days     | 1.00   |
 * | 7 – 14 days    | 0.90   |
 * | 14 – 21 days   | 0.80   |
 * | 21 – 30 days   | 0.70   |
 * | > 30 days       | 0.70   |
 *
 * All functions are pure, side-effect-free, and operate exclusively on
 * timestamps — no external I/O or mutable state.
 */

/** One day in milliseconds. */
const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Configurable decay window entry.
 *
 * Each entry specifies an upper bound (exclusive) in days before the
 * period end and the weight that votes within that window receive.
 * The array must be sorted by `maxDaysBeforeEnd` ascending.
 */
export interface DecayWindow {
  /** Upper bound in days (exclusive). Votes older than this fall to the next window. */
  readonly maxDaysBeforeEnd: number
  /** Weight multiplier for votes within this window (0–1). */
  readonly weight: number
}

/**
 * Default decay windows as specified in the fairness enhancement proposal.
 *
 * Sorted ascending by `maxDaysBeforeEnd` so lookup can short-circuit.
 */
export const DEFAULT_DECAY_WINDOWS: readonly DecayWindow[] = [
  { maxDaysBeforeEnd: 7, weight: 1.0 },
  { maxDaysBeforeEnd: 14, weight: 0.9 },
  { maxDaysBeforeEnd: 21, weight: 0.8 },
  { maxDaysBeforeEnd: 30, weight: 0.7 },
] as const

/**
 * Minimum weight applied to any vote, even if cast more than 30 days
 * before the period end.  Ensures no vote is completely discarded.
 */
export const MINIMUM_TEMPORAL_WEIGHT = 0.7

/**
 * Calculates the temporal weight for a single vote based on its distance
 * from the end of the voting period.
 *
 * The function is pure and deterministic — it depends only on its arguments.
 *
 * **Edge cases:**
 * - `voteDate` after `periodEnd` → weight is 1.0 (most recent window).
 * - `voteDate` before all configured windows → returns {@link MINIMUM_TEMPORAL_WEIGHT}.
 * - Identical `voteDate` and `periodEnd` → weight is 1.0.
 *
 * @param voteDate  - ISO-8601 timestamp or Date of the vote.
 * @param periodEnd - ISO-8601 timestamp or Date marking the end of the voting period.
 * @param windows   - Optional custom decay windows (defaults to {@link DEFAULT_DECAY_WINDOWS}).
 * @returns Weight multiplier in [MINIMUM_TEMPORAL_WEIGHT, 1.0].
 */
export function calculateTemporalWeight(
  voteDate: Date | string | number,
  periodEnd: Date | string | number,
  windows: readonly DecayWindow[] = DEFAULT_DECAY_WINDOWS
): number {
  const voteMs = new Date(voteDate).getTime()
  const endMs = new Date(periodEnd).getTime()

  // Guard against invalid date inputs (e.g. malformed strings).
  if (Number.isNaN(voteMs) || Number.isNaN(endMs)) {
    throw new RangeError(
      `[temporalDecay] Invalid date argument: voteDate=${String(voteDate)}, periodEnd=${String(periodEnd)}`
    )
  }

  const daysBeforeEnd = (endMs - voteMs) / MS_PER_DAY

  // Votes cast after the period end are treated as the most recent window.
  if (daysBeforeEnd <= 0) return 1.0

  for (const window of windows) {
    if (daysBeforeEnd <= window.maxDaysBeforeEnd) {
      return window.weight
    }
  }

  // Older than all configured windows → minimum weight.
  return MINIMUM_TEMPORAL_WEIGHT
}
