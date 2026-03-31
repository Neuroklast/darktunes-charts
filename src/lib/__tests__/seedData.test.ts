import { describe, it, expect } from 'vitest'
import { SEED_BANDS, SEED_TRACKS } from '../seedData'

const VALID_TIERS = ['Micro', 'Emerging', 'Established', 'International', 'Macro']

describe('SEED_BANDS', () => {
  it('has the expected number of entries', () => {
    // 10 Out of Line + 11 Trisol (incl. Extize) + 68 DarkTunes/independent = 89
    expect(SEED_BANDS).toHaveLength(89)
  })

  it('all bands have valid tiers', () => {
    for (const band of SEED_BANDS) {
      expect(VALID_TIERS).toContain(band.tier)
    }
  })

  it('all bands have unique IDs', () => {
    const ids = SEED_BANDS.map(b => b.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(SEED_BANDS.length)
  })

  it('all bands have a genre', () => {
    for (const band of SEED_BANDS) {
      expect(['Goth', 'Metal', 'Dark Electro']).toContain(band.genre)
    }
  })
})

describe('SEED_TRACKS', () => {
  it('has tracks', () => {
    expect(SEED_TRACKS.length).toBeGreaterThan(0)
  })

  it('all tracks have valid bandIds', () => {
    const bandIds = new Set(SEED_BANDS.map(b => b.id))
    for (const track of SEED_TRACKS) {
      expect(bandIds.has(track.bandId)).toBe(true)
    }
  })

  it('all tracks have unique IDs', () => {
    const ids = SEED_TRACKS.map(t => t.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(SEED_TRACKS.length)
  })
})
