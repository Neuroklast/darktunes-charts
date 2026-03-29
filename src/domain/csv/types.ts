/**
 * Types for CSV processing domain logic.
 *
 * These types define the contract between the main thread, the Web Worker,
 * and the pure CSV processing functions. They are intentionally kept free
 * of DOM or Worker-specific APIs so the domain logic stays portable and testable.
 */

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/** A single row of CSV data represented as key-value pairs. */
export type CsvRow = Record<string, string>

/** Result of parsing a CSV string into structured data. */
export interface CsvParseResult {
  /** Column headers extracted from the first row. */
  readonly headers: readonly string[]
  /** Parsed data rows. */
  readonly rows: readonly CsvRow[]
  /** Total number of data rows (excluding header). */
  readonly totalRows: number
}

/** Result of serializing structured data back to a CSV string. */
export interface CsvSerializeResult {
  /** The generated CSV content. */
  readonly csv: string
  /** Number of data rows serialized. */
  readonly totalRows: number
}

// ---------------------------------------------------------------------------
// Worker message protocol (discriminated union)
// ---------------------------------------------------------------------------

/** Input message sent from main thread → Worker. */
export type CsvWorkerInput =
  | { readonly type: 'parse'; readonly payload: { readonly csv: string } }
  | {
      readonly type: 'serialize'
      readonly payload: {
        readonly columns: readonly string[]
        readonly rows: readonly Record<string, string | number | null>[]
      }
    }

/** Progress update sent from Worker → main thread. */
export interface CsvWorkerProgress {
  readonly type: 'progress'
  /** Value between 0 and 1. */
  readonly progress: number
}

/** Successful result sent from Worker → main thread. */
export interface CsvWorkerSuccess {
  readonly type: 'result'
  readonly data: CsvParseResult | CsvSerializeResult
}

/** Error sent from Worker → main thread. */
export interface CsvWorkerError {
  readonly type: 'error'
  readonly message: string
}

/** Any message the Worker can post back to the main thread. */
export type CsvWorkerOutput = CsvWorkerProgress | CsvWorkerSuccess | CsvWorkerError
