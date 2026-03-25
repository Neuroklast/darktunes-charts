import { describe, it, expect } from 'vitest'
import { parseCsv } from '../_lib/csv-parser'

const SIMPLE_CSV = `name,genre,listeners
Band A,Goth,5000
Band B,Metal,50000
`

const QUOTED_CSV = `name,description
"Bands, Inc","A band with, commas"
Simple Band,No quotes
`

describe('parseCsv', () => {
  it('parses a simple CSV with headers', async () => {
    const result = await parseCsv(SIMPLE_CSV)
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toEqual({ name: 'Band A', genre: 'Goth', listeners: '5000' })
    expect(result.rows[1]).toEqual({ name: 'Band B', genre: 'Metal', listeners: '50000' })
  })

  it('handles quoted fields with commas', async () => {
    const result = await parseCsv(QUOTED_CSV)
    expect(result.rows[0].name).toBe('Bands, Inc')
    expect(result.rows[0].description).toBe('A band with, commas')
  })

  it('respects maxRows option', async () => {
    const result = await parseCsv(SIMPLE_CSV, { maxRows: 1 })
    expect(result.rows).toHaveLength(1)
  })

  it('handles CSV without header row', async () => {
    const noHeader = `Band A,Goth,5000\nBand B,Metal,50000`
    const result = await parseCsv(noHeader, { hasHeader: false })
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0]).toHaveProperty('col0', 'Band A')
  })

  it('skips empty lines', async () => {
    const withEmpty = `name,genre\n\nBand A,Goth\n\n`
    const result = await parseCsv(withEmpty)
    expect(result.rows).toHaveLength(1)
  })

  it('accepts a Buffer as input', async () => {
    const buf = Buffer.from(SIMPLE_CSV, 'utf8')
    const result = await parseCsv(buf)
    expect(result.rows).toHaveLength(2)
  })

  it('handles custom delimiter', async () => {
    const semicolonCsv = `name;genre\nBand A;Goth`
    const result = await parseCsv(semicolonCsv, { delimiter: ';' })
    expect(result.rows[0].genre).toBe('Goth')
  })

  it('returns totalRows including header', async () => {
    const result = await parseCsv(SIMPLE_CSV)
    expect(result.totalRows).toBeGreaterThan(result.rows.length)
  })
})
