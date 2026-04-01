import { describe, it, expect } from 'vitest'
import {
  GENRE_TAXONOMY,
  isValidGenreTag,
  getGenresByRoot,
  getAllGenres,
  validateBandGenres,
} from '../genres'

describe('GENRE_TAXONOMY', () => {
  it('has 5 root categories', () => {
    expect(Object.keys(GENRE_TAXONOMY)).toHaveLength(5)
  })

  it('has 23 sub-genres in total', () => {
    const all = getAllGenres()
    expect(all).toHaveLength(23)
  })

  it('gothic root has 5 sub-genres', () => {
    expect(GENRE_TAXONOMY.gothic).toHaveLength(5)
  })

  it('electronic root has 7 sub-genres', () => {
    expect(GENRE_TAXONOMY.electronic).toHaveLength(7)
  })

  it('metal-adjacent root has 4 sub-genres', () => {
    expect(GENRE_TAXONOMY['metal-adjacent']).toHaveLength(4)
  })

  it('folk-ambient root has 4 sub-genres', () => {
    expect(GENRE_TAXONOMY['folk-ambient']).toHaveLength(4)
  })

  it('post-punk root has 3 sub-genres', () => {
    expect(GENRE_TAXONOMY['post-punk']).toHaveLength(3)
  })

  it('every sub-genre has a valid root reference', () => {
    const roots = Object.keys(GENRE_TAXONOMY)
    for (const [root, genres] of Object.entries(GENRE_TAXONOMY)) {
      for (const genre of genres) {
        expect(genre.root).toBe(root)
        expect(roots).toContain(genre.root)
      }
    }
  })

  it('all sub-genre IDs are unique', () => {
    const allIds = getAllGenres().map(g => g.id)
    expect(new Set(allIds).size).toBe(allIds.length)
  })
})

describe('isValidGenreTag', () => {
  it('returns true for known tags', () => {
    expect(isValidGenreTag('darkwave')).toBe(true)
    expect(isValidGenreTag('ebm')).toBe(true)
    expect(isValidGenreTag('ndh')).toBe(true)
    expect(isValidGenreTag('neofolk')).toBe(true)
    expect(isValidGenreTag('coldwave')).toBe(true)
  })

  it('returns false for unknown tags', () => {
    expect(isValidGenreTag('reggae')).toBe(false)
    expect(isValidGenreTag('')).toBe(false)
    expect(isValidGenreTag('DARKWAVE')).toBe(false) // case-sensitive
  })
})

describe('getGenresByRoot', () => {
  it('returns sub-genres for a valid root', () => {
    const gothic = getGenresByRoot('gothic')
    expect(gothic).toHaveLength(5)
    expect(gothic[0]!.id).toBe('darkwave')
  })

  it('returns electronic sub-genres', () => {
    const electronic = getGenresByRoot('electronic')
    expect(electronic).toHaveLength(7)
    expect(electronic.map(g => g.id)).toContain('ebm')
  })
})

describe('validateBandGenres', () => {
  it('accepts 1 valid genre (primary only)', () => {
    expect(validateBandGenres(['darkwave']).valid).toBe(true)
  })

  it('accepts 3 valid genres (1 primary + 2 secondary)', () => {
    expect(validateBandGenres(['darkwave', 'ebm', 'industrial']).valid).toBe(true)
  })

  it('rejects empty genres array', () => {
    const result = validateBandGenres([])
    expect(result.valid).toBe(false)
    expect(result.error).toContain('At least one')
  })

  it('rejects more than 3 genres', () => {
    const result = validateBandGenres(['darkwave', 'ebm', 'industrial', 'neofolk'])
    expect(result.valid).toBe(false)
    expect(result.error).toContain('at most 3')
  })

  it('rejects unknown genre tags', () => {
    const result = validateBandGenres(['darkwave', 'jazz'])
    expect(result.valid).toBe(false)
    expect(result.error).toContain('jazz')
  })

  it('rejects duplicate genre tags', () => {
    const result = validateBandGenres(['darkwave', 'darkwave'])
    expect(result.valid).toBe(false)
    expect(result.error).toContain('Duplicate')
  })
})
