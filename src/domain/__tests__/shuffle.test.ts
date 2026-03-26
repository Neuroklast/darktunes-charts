import { describe, it, expect } from 'vitest'
import { fisherYatesShuffle } from '../utils/shuffle'

describe('fisherYatesShuffle', () => {
  it('returns an array of the same length', () => {
    const input = [1, 2, 3, 4, 5]
    expect(fisherYatesShuffle(input)).toHaveLength(input.length)
  })

  it('contains the same elements as the original', () => {
    const input = ['a', 'b', 'c', 'd', 'e']
    const result = fisherYatesShuffle(input)
    expect(result.sort()).toEqual([...input].sort())
  })

  it('does not mutate the original array', () => {
    const input = [1, 2, 3]
    const copy = [...input]
    fisherYatesShuffle(input)
    expect(input).toEqual(copy)
  })

  it('handles empty arrays without error', () => {
    expect(fisherYatesShuffle([])).toEqual([])
  })

  it('handles single-element arrays', () => {
    expect(fisherYatesShuffle([42])).toEqual([42])
  })

  it('produces a deterministic result with a seeded RNG', () => {
    // Seeded counter RNG for reproducibility
    let seed = 0
    const seededRng = () => {
      seed = (seed + 0.1) % 1
      return seed
    }
    const input = [1, 2, 3, 4, 5]
    const first = fisherYatesShuffle(input, seededRng)

    seed = 0
    const second = fisherYatesShuffle(input, seededRng)
    expect(first).toEqual(second)
  })

  it('produces different orderings with different RNG states', () => {
    // Statistical test: run 100 shuffles and check that the result is not always sorted
    const input = [1, 2, 3, 4, 5]
    const sorted = JSON.stringify([...input].sort((a, b) => a - b))
    const shuffles = Array.from({ length: 100 }, () => fisherYatesShuffle(input))
    const allSorted = shuffles.every(s => JSON.stringify(s) === sorted)
    expect(allSorted).toBe(false)
  })
})
