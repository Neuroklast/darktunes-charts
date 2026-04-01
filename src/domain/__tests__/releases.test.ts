import { describe, it, expect } from 'vitest'
import {
  validateRelease,
  canSubmitToCategory,
  type Release,
} from '../releases'

function makeRelease(overrides: Partial<Release> = {}): Release {
  return {
    id: 'rel-1',
    bandId: 'band-1',
    title: 'Shadow Manifest',
    type: 'album',
    releaseDate: new Date('2026-01-15'),
    trackCount: 10,
    genres: ['darkwave'],
    streamingLinks: [{ platform: 'spotify', url: 'https://open.spotify.com/album/123' }],
    coverArtUrl: 'https://example.com/cover.jpg',
    submittedToCategories: ['album'],
    ...overrides,
  }
}

describe('validateRelease', () => {
  it('accepts a valid release', () => {
    const result = validateRelease(makeRelease())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects missing ID', () => {
    const result = validateRelease(makeRelease({ id: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Release ID is required.')
  })

  it('rejects missing band ID', () => {
    const result = validateRelease(makeRelease({ bandId: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Band ID is required.')
  })

  it('rejects missing title', () => {
    const result = validateRelease(makeRelease({ title: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Title is required.')
  })

  it('rejects missing cover art', () => {
    const result = validateRelease(makeRelease({ coverArtUrl: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Cover art URL is required.')
  })

  it('rejects zero track count', () => {
    const result = validateRelease(makeRelease({ trackCount: 0 }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Track count must be a positive integer.')
  })

  it('rejects empty genres', () => {
    const result = validateRelease(makeRelease({ genres: [] }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('At least one genre is required.')
  })

  it('rejects more than 3 genres', () => {
    const result = validateRelease(makeRelease({ genres: ['a', 'b', 'c', 'd'] }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('A release may have at most 3 genres.')
  })

  it('rejects empty categories', () => {
    const result = validateRelease(makeRelease({ submittedToCategories: [] }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('At least one chart category must be selected.')
  })

  it('rejects invalid date', () => {
    const result = validateRelease(makeRelease({ releaseDate: new Date('invalid') }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Release date must be a valid date.')
  })

  it('collects multiple errors at once', () => {
    const result = validateRelease(makeRelease({ id: '', title: '', genres: [] }))
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})

describe('canSubmitToCategory', () => {
  it('allows albums to submit to album category', () => {
    expect(canSubmitToCategory(makeRelease({ type: 'album' }), 'album')).toBe(true)
  })

  it('allows EPs to submit to album category', () => {
    expect(canSubmitToCategory(makeRelease({ type: 'ep' }), 'album')).toBe(true)
  })

  it('rejects singles from album category', () => {
    expect(canSubmitToCategory(makeRelease({ type: 'single' }), 'album')).toBe(false)
  })

  it('allows singles to submit to track category', () => {
    expect(canSubmitToCategory(makeRelease({ type: 'single' }), 'track')).toBe(true)
  })

  it('rejects albums from track category', () => {
    expect(canSubmitToCategory(makeRelease({ type: 'album' }), 'track')).toBe(false)
  })

  it('allows any release type to submit to community categories', () => {
    expect(canSubmitToCategory(makeRelease({ type: 'single' }), 'chronicler-night')).toBe(true)
    expect(canSubmitToCategory(makeRelease({ type: 'album' }), 'dark-integrity')).toBe(true)
  })

  it('allows any release type to submit to visual categories', () => {
    expect(canSubmitToCategory(makeRelease({ type: 'single' }), 'best-cover-art')).toBe(true)
    expect(canSubmitToCategory(makeRelease({ type: 'album' }), 'best-merch')).toBe(true)
  })

  it('allows singles to underground-anthem', () => {
    expect(canSubmitToCategory(makeRelease({ type: 'single' }), 'underground-anthem')).toBe(true)
  })

  it('rejects albums from underground-anthem', () => {
    expect(canSubmitToCategory(makeRelease({ type: 'album' }), 'underground-anthem')).toBe(false)
  })

  it('allows albums to dark-concept', () => {
    expect(canSubmitToCategory(makeRelease({ type: 'album' }), 'dark-concept')).toBe(true)
  })
})
