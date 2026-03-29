import { describe, it, expect, vi } from 'vitest'
import {
  csvEscape,
  parseCsvLine,
  splitCsvLines,
  parseCsv,
  serializeCsv,
} from '@/domain/csv/csvProcessor'

// ---------------------------------------------------------------------------
// csvEscape
// ---------------------------------------------------------------------------
describe('csvEscape', () => {
  it('returns empty string for null', () => {
    expect(csvEscape(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(csvEscape(undefined)).toBe('')
  })

  it('converts numbers to strings', () => {
    expect(csvEscape(42)).toBe('42')
    expect(csvEscape(0)).toBe('0')
  })

  it('returns simple strings unchanged', () => {
    expect(csvEscape('hello')).toBe('hello')
  })

  it('wraps strings containing commas in double-quotes', () => {
    expect(csvEscape('a,b')).toBe('"a,b"')
  })

  it('wraps strings containing newlines in double-quotes', () => {
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"')
  })

  it('doubles inner double-quotes', () => {
    expect(csvEscape('say "hello"')).toBe('"say ""hello"""')
  })

  it('handles combined special characters', () => {
    expect(csvEscape('a,"b"\nc')).toBe('"a,""b""\nc"')
  })
})

// ---------------------------------------------------------------------------
// parseCsvLine
// ---------------------------------------------------------------------------
describe('parseCsvLine', () => {
  it('splits a simple comma-separated line', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('handles quoted fields containing commas', () => {
    expect(parseCsvLine('"a,b",c,d')).toEqual(['a,b', 'c', 'd'])
  })

  it('handles escaped double-quotes inside fields', () => {
    expect(parseCsvLine('"say ""hello""",world')).toEqual(['say "hello"', 'world'])
  })

  it('handles empty fields', () => {
    expect(parseCsvLine(',,')).toEqual(['', '', ''])
  })

  it('handles single field', () => {
    expect(parseCsvLine('only')).toEqual(['only'])
  })

  it('handles empty input', () => {
    expect(parseCsvLine('')).toEqual([''])
  })
})

// ---------------------------------------------------------------------------
// splitCsvLines
// ---------------------------------------------------------------------------
describe('splitCsvLines', () => {
  it('splits LF-terminated lines', () => {
    expect(splitCsvLines('a\nb\nc')).toEqual(['a', 'b', 'c'])
  })

  it('splits CRLF-terminated lines', () => {
    expect(splitCsvLines('a\r\nb\r\nc')).toEqual(['a', 'b', 'c'])
  })

  it('keeps newlines inside quoted fields', () => {
    expect(splitCsvLines('"line1\nline2",b\nc,d')).toEqual(['"line1\nline2",b', 'c,d'])
  })

  it('ignores trailing newlines', () => {
    expect(splitCsvLines('a\nb\n')).toEqual(['a', 'b'])
  })

  it('returns empty array for empty string', () => {
    expect(splitCsvLines('')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// parseCsv
// ---------------------------------------------------------------------------
describe('parseCsv', () => {
  it('parses a simple CSV string', () => {
    const csv = 'Name,Score\r\nAlice,10\r\nBob,20'
    const result = parseCsv(csv)

    expect(result.headers).toEqual(['Name', 'Score'])
    expect(result.rows).toEqual([
      { Name: 'Alice', Score: '10' },
      { Name: 'Bob', Score: '20' },
    ])
    expect(result.totalRows).toBe(2)
  })

  it('handles quoted fields with commas and quotes', () => {
    const csv = 'Band,Genre\r\n"Nightwish","Symphonic Metal"\r\n"AC/DC","Hard Rock"'
    const result = parseCsv(csv)

    expect(result.rows[0]).toEqual({ Band: 'Nightwish', Genre: 'Symphonic Metal' })
    expect(result.rows[1]).toEqual({ Band: 'AC/DC', Genre: 'Hard Rock' })
  })

  it('handles missing values (fewer columns than header)', () => {
    const csv = 'A,B,C\r\n1,2'
    const result = parseCsv(csv)

    expect(result.rows[0]).toEqual({ A: '1', B: '2', C: '' })
  })

  it('throws on empty CSV', () => {
    expect(() => parseCsv('')).toThrow('CSV is empty')
  })

  it('returns empty rows for header-only CSV', () => {
    const csv = 'A,B,C'
    const result = parseCsv(csv)

    expect(result.headers).toEqual(['A', 'B', 'C'])
    expect(result.rows).toEqual([])
    expect(result.totalRows).toBe(0)
  })

  it('reports progress via callback', () => {
    // Generate enough rows to trigger multiple progress reports
    const headerLine = 'Col1,Col2'
    const dataLines = Array.from({ length: 600 }, (_, i) => `val${i},val${i + 1}`)
    const csv = [headerLine, ...dataLines].join('\r\n')

    const progressValues: number[] = []
    parseCsv(csv, (p) => progressValues.push(p))

    expect(progressValues.length).toBeGreaterThan(1)
    // Last progress should be 1 (100%)
    expect(progressValues[progressValues.length - 1]).toBe(1)
    // All values should be between 0 and 1
    for (const p of progressValues) {
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('handles LF line endings', () => {
    const csv = 'X,Y\n1,2\n3,4'
    const result = parseCsv(csv)

    expect(result.rows).toEqual([
      { X: '1', Y: '2' },
      { X: '3', Y: '4' },
    ])
  })
})

// ---------------------------------------------------------------------------
// serializeCsv
// ---------------------------------------------------------------------------
describe('serializeCsv', () => {
  it('serializes rows into RFC 4180 CSV', () => {
    const columns = ['Name', 'Score']
    const rows = [
      { Name: 'Alice', Score: 10 },
      { Name: 'Bob', Score: 20 },
    ]
    const result = serializeCsv(columns, rows)

    expect(result.csv).toBe('Name,Score\r\nAlice,10\r\nBob,20')
    expect(result.totalRows).toBe(2)
  })

  it('escapes special characters', () => {
    const columns = ['Band', 'Note']
    const rows = [{ Band: 'AC/DC', Note: 'Hard, heavy "rock"' }]
    const result = serializeCsv(columns, rows)

    expect(result.csv).toBe('Band,Note\r\nAC/DC,"Hard, heavy ""rock"""')
  })

  it('handles null and undefined values', () => {
    const columns = ['A', 'B']
    const rows = [{ A: null, B: 'ok' }]
    const result = serializeCsv(columns, rows)

    expect(result.csv).toBe('A,B\r\n,ok')
  })

  it('serializes empty row array', () => {
    const result = serializeCsv(['X', 'Y'], [])

    expect(result.csv).toBe('X,Y')
    expect(result.totalRows).toBe(0)
  })

  it('reports progress via callback', () => {
    const rows = Array.from({ length: 600 }, (_, i) => ({ A: `v${i}` }))
    const progressValues: number[] = []
    serializeCsv(['A'], rows, (p) => progressValues.push(p))

    expect(progressValues.length).toBeGreaterThan(1)
    expect(progressValues[progressValues.length - 1]).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Round-trip: parse → serialize → parse
// ---------------------------------------------------------------------------
describe('round-trip', () => {
  it('preserves data through parse → serialize → parse', () => {
    const original = 'Band,Score,Note\r\nNightwish,92,"Great, amazing"\r\nHIM,85,"Love ""Metal"""'

    const parsed = parseCsv(original)
    const serialized = serializeCsv(
      [...parsed.headers],
      parsed.rows.map(row => ({ ...row })),
    )
    const reparsed = parseCsv(serialized.csv)

    expect(reparsed.headers).toEqual(parsed.headers)
    expect(reparsed.rows).toEqual(parsed.rows)
  })
})

// ---------------------------------------------------------------------------
// Worker message handling (via direct import — tests the logic, not the Worker runtime)
// ---------------------------------------------------------------------------
describe('Worker message contract', () => {
  it('parseCsv result conforms to CsvParseResult', () => {
    const result = parseCsv('A,B\r\n1,2')
    expect(result).toHaveProperty('headers')
    expect(result).toHaveProperty('rows')
    expect(result).toHaveProperty('totalRows')
  })

  it('serializeCsv result conforms to CsvSerializeResult', () => {
    const result = serializeCsv(['A'], [{ A: '1' }])
    expect(result).toHaveProperty('csv')
    expect(result).toHaveProperty('totalRows')
  })
})
