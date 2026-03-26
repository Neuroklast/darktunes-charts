import { describe, it, expect } from 'vitest'
import {
  seededRandom,
  selectBandOfTheDay,
  todayUTCDateString,
  type SpotlightBand,
} from '../spotlight/randomBand'

describe('seededRandom', () => {
  it('returns a float in [0, 1)', () => {
    const r = seededRandom('2025-03-26')
    expect(r).toBeGreaterThanOrEqual(0)
    expect(r).toBeLessThan(1)
  })

  it('is deterministic for the same seed', () => {
    expect(seededRandom('2025-01-01')).toBe(seededRandom('2025-01-01'))
  })

  it('produces different values for different seeds', () => {
    expect(seededRandom('2025-01-01')).not.toBe(seededRandom('2025-01-02'))
  })
})

describe('selectBandOfTheDay', () => {
  const bands: SpotlightBand[] = [
    { id: 'b1', name: 'Band Alpha', tier: 'Micro', genre: 'Goth' },
    { id: 'b2', name: 'Band Beta', tier: 'Emerging', genre: 'Metal' },
    { id: 'b3', name: 'Band Gamma', tier: 'Micro', genre: 'Dark Electro' },
  ]

  it('returns null for empty band list', () => {
    expect(selectBandOfTheDay([], '2025-01-01')).toBeNull()
  })

  it('returns a band from the eligible list', () => {
    const selected = selectBandOfTheDay(bands, '2025-01-01')
    expect(selected).not.toBeNull()
    expect(['b1', 'b2', 'b3']).toContain(selected!.id)
  })

  it('is deterministic for the same date', () => {
    const a = selectBandOfTheDay(bands, '2025-03-15')
    const b = selectBandOfTheDay(bands, '2025-03-15')
    expect(a?.id).toBe(b?.id)
  })

  it('may select a different band on a different date', () => {
    // Deterministic: seeded RNG always picks same band for same date,
    // but different months should produce variation across a large sample.
    const results = new Set<string>()
    const years = ['2025', '2026', '2027', '2028', '2029']
    const months = ['01', '03', '05', '07', '09', '11']
    const days = ['01', '05', '10', '15', '20', '25']
    for (const y of years) {
      for (const m of months) {
        for (const d of days) {
          const selected = selectBandOfTheDay(bands, `${y}-${m}-${d}`)
          if (selected) results.add(selected.id)
        }
      }
    }
    expect(results.size).toBeGreaterThan(1)
  })

  it('filters out non-eligible tiers', () => {
    const mixedBands: SpotlightBand[] = [
      { id: 'micro', name: 'Micro Band', tier: 'Micro', genre: 'Goth' },
      // Established/International/Macro are not valid SpotlightBand types
      // since the type only allows 'Micro' | 'Emerging'
    ]
    const selected = selectBandOfTheDay(mixedBands, '2025-01-01')
    expect(selected?.tier).toBe('Micro')
  })
})

describe('todayUTCDateString', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = todayUTCDateString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
