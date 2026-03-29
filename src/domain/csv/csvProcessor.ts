/**
 * Pure CSV processing functions.
 *
 * All functions in this module are pure, synchronous, and free of side-effects.
 * They can run on the main thread or inside a Web Worker. Progress reporting
 * is handled via an optional callback so the caller (e.g. the Worker) can
 * relay updates to the UI.
 *
 * Design decisions:
 * - RFC 4180 compliant: double-quote escaping, CRLF line endings.
 * - Chunked processing with progress callback to keep the Worker responsive.
 * - Defensive parsing: tolerates trailing newlines and mixed line endings.
 */

import type {
  CsvRow,
  CsvParseResult,
  CsvSerializeResult,
} from './types'

/** Number of rows to process per chunk before emitting progress. */
const CHUNK_SIZE = 500

/** Callback signature for progress reporting (0 … 1). */
export type ProgressCallback = (progress: number) => void

// ---------------------------------------------------------------------------
// CSV escaping (shared with serializer)
// ---------------------------------------------------------------------------

/**
 * Escapes a single value for safe inclusion in a CSV cell (RFC 4180).
 *
 * Values containing commas, double-quotes, or newlines are wrapped in
 * double-quotes with inner quotes doubled. `null` / `undefined` map to
 * the empty string.
 *
 * @param value - The cell value to escape.
 * @returns An RFC 4180-safe string.
 */
export function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parses a single CSV line respecting quoted fields.
 *
 * Handles fields that contain commas, newlines, and escaped double-quotes
 * per RFC 4180. Returns an array of field values with quotes stripped.
 *
 * @param line - A single logical line from a CSV file.
 * @returns Array of parsed field values.
 */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (inQuotes) {
      if (char === '"') {
        // Escaped quote ("") or end-of-field
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++ // skip the second quote
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        fields.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }

  fields.push(current)
  return fields
}

/**
 * Splits a full CSV string into logical lines, correctly handling
 * newlines embedded inside quoted fields.
 *
 * @param csv - Raw CSV string (may use CRLF or LF line endings).
 * @returns Array of logical CSV lines.
 */
export function splitCsvLines(csv: string): string[] {
  const lines: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i]

    if (char === '"') {
      inQuotes = !inQuotes
      current += char
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      // Skip \n after \r (CRLF)
      if (char === '\r' && i + 1 < csv.length && csv[i + 1] === '\n') {
        i++
      }
      if (current.length > 0) {
        lines.push(current)
      }
      current = ''
    } else {
      current += char
    }
  }

  if (current.length > 0) {
    lines.push(current)
  }

  return lines
}

/**
 * Parses a CSV string into structured rows with column headers.
 *
 * The first line is treated as the header row. Processing is done in
 * chunks of {@link CHUNK_SIZE} rows; between chunks the optional
 * `onProgress` callback fires with a value between 0 and 1.
 *
 * @param csv       - Raw CSV content.
 * @param onProgress - Optional progress callback (0 … 1).
 * @returns Parsed result with headers, rows, and totalRows.
 * @throws {Error} If the CSV is empty or contains no header row.
 */
export function parseCsv(
  csv: string,
  onProgress?: ProgressCallback,
): CsvParseResult {
  const lines = splitCsvLines(csv)

  if (lines.length === 0) {
    throw new Error('CSV is empty — no header row found.')
  }

  const headers = parseCsvLine(lines[0])
  const rows: CsvRow[] = []
  const dataLineCount = lines.length - 1

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: CsvRow = {}
    for (let h = 0; h < headers.length; h++) {
      row[headers[h]] = values[h] ?? ''
    }
    rows.push(row)

    // Emit progress at chunk boundaries
    if (onProgress && (i % CHUNK_SIZE === 0 || i === dataLineCount)) {
      onProgress(i / dataLineCount)
    }
  }

  return { headers, rows, totalRows: rows.length }
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * Converts structured row data into an RFC 4180 CSV string.
 *
 * @param columns    - Ordered column names to include.
 * @param rows       - Data rows (objects with column names as keys).
 * @param onProgress - Optional progress callback (0 … 1).
 * @returns Serialized CSV content and row count.
 */
export function serializeCsv(
  columns: readonly string[],
  rows: readonly Record<string, string | number | null>[],
  onProgress?: ProgressCallback,
): CsvSerializeResult {
  const header = columns.map(csvEscape).join(',')
  const dataRows: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    dataRows.push(columns.map(col => csvEscape(row[col])).join(','))

    if (onProgress && (i % CHUNK_SIZE === 0 || i === rows.length - 1)) {
      onProgress((i + 1) / rows.length)
    }
  }

  return {
    csv: [header, ...dataRows].join('\r\n'),
    totalRows: dataRows.length,
  }
}
