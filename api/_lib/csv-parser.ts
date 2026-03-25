import { Readable } from 'node:stream'
import { createInterface } from 'node:readline'

export interface CsvRow {
  [key: string]: string
}

export interface CsvParseOptions {
  delimiter?: string
  hasHeader?: boolean
  maxRows?: number
}

export interface CsvParseError {
  row: number
  column: string
  message: string
  value: string
}

export interface CsvParseResult {
  rows: CsvRow[]
  errors: CsvParseError[]
  totalRows: number
}

/**
 * Parses CSV content from a string or Buffer using a streaming readline approach.
 */
export async function parseCsv(
  input: string | Buffer,
  options: CsvParseOptions = {}
): Promise<CsvParseResult> {
  const { delimiter = ',', hasHeader = true, maxRows } = options

  const content = typeof input === 'string' ? input : input.toString('utf8')
  const stream = Readable.from([content])
  const rl = createInterface({ input: stream, crlfDelay: Infinity })

  const rows: CsvRow[] = []
  const errors: CsvParseError[] = []
  let headers: string[] = []
  let lineNumber = 0

  for await (const line of rl) {
    lineNumber++
    if (maxRows && rows.length >= maxRows) break

    const trimmed = line.trim()
    if (!trimmed) continue

    const cells = splitCsvLine(trimmed, delimiter)

    if (hasHeader && lineNumber === 1) {
      headers = cells.map((h) => h.trim())
      continue
    }

    if (!hasHeader && headers.length === 0) {
      headers = cells.map((_, i) => `col${i}`)
    }

    const row: CsvRow = {}
    headers.forEach((header, idx) => {
      row[header] = (cells[idx] ?? '').trim()
    })

    rows.push(row)
  }

  return { rows, errors, totalRows: lineNumber }
}

/** Splits a single CSV line handling quoted fields. */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
