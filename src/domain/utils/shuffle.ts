/**
 * Fisher-Yates (Knuth) shuffle — cryptographically unbiased in-place permutation.
 *
 * Spec §3.2 requires that the order of songs/bands displayed in the voting
 * panel is randomised on every page load.  This prevents position bias
 * (first/last items receiving disproportionate votes).
 *
 * Algorithm:
 *   For i from n-1 down to 1:
 *     j = random integer in [0, i]
 *     swap array[i] and array[j]
 *
 * Complexity: O(n) time, O(1) additional space.
 * Bias: provably uniform (each permutation equally likely) unlike naive
 *       sort-by-random-key which produces biased distributions.
 *
 * Reference: Fisher & Yates (1938); Knuth (1969) "The Art of Computer Programming".
 */

/**
 * Returns a new array with the elements shuffled using the Fisher-Yates algorithm.
 *
 * The original array is NOT mutated.  A new array is returned so callers can
 * use this in immutable data flows (e.g. React state updates).
 *
 * @param items - The array to shuffle.  May be empty.
 * @param rng   - Optional random-number generator; defaults to Math.random.
 *               Inject a seeded RNG in tests for deterministic results.
 * @returns A new array containing the same elements in a shuffled order.
 *
 * @example
 * const tracks = ['A', 'B', 'C', 'D']
 * const shuffled = fisherYatesShuffle(tracks)
 * // shuffled is a permutation of tracks; tracks is unchanged
 */
export function fisherYatesShuffle<T>(
  items: readonly T[],
  rng: () => number = Math.random
): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    // Swap result[i] and result[j]
    const temp = result[i]!
    result[i] = result[j]!
    result[j] = temp
  }
  return result
}
