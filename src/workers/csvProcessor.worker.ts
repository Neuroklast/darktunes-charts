/**
 * Web Worker for offloading CSV processing from the main thread.
 *
 * Accepts {@link CsvWorkerInput} messages and replies with
 * {@link CsvWorkerOutput} messages (progress updates, results, or errors).
 *
 * This file must be loaded via `new Worker(new URL(..., import.meta.url))`
 * so bundlers (Next.js / webpack / turbopack) can resolve it correctly.
 */

import { parseCsv, serializeCsv } from '@/domain/csv/csvProcessor'
import type { CsvWorkerInput, CsvWorkerOutput } from '@/domain/csv/types'

/**
 * Type-safe postMessage wrapper scoped to our output protocol.
 */
function post(message: CsvWorkerOutput): void {
  self.postMessage(message)
}

self.onmessage = (event: MessageEvent<CsvWorkerInput>) => {
  try {
    const input = event.data

    switch (input.type) {
      case 'parse': {
        const result = parseCsv(input.payload.csv, (progress) => {
          post({ type: 'progress', progress })
        })
        post({ type: 'result', data: result })
        break
      }

      case 'serialize': {
        const result = serializeCsv(
          input.payload.columns,
          input.payload.rows,
          (progress) => {
            post({ type: 'progress', progress })
          },
        )
        post({ type: 'result', data: result })
        break
      }

      default: {
        // Exhaustive check — if a new type is added the compiler will flag this.
        const _exhaustive: never = input
        post({ type: 'error', message: `Unknown message type: ${String((_exhaustive as CsvWorkerInput).type)}` })
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown worker error'
    post({ type: 'error', message })
  }
}
