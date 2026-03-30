/**
 * React hook for CSV processing via a Web Worker.
 *
 * Provides:
 * - {@link parseCsvAsync}  — parse a raw CSV string into typed rows.
 * - {@link serializeCsvAsync} — convert row objects into a CSV string.
 * - {@link progress} — reactive 0 … 1 value for progress bars.
 * - {@link error} — last error message (or `null`).
 * - {@link isProcessing} — whether a job is currently running.
 *
 * Falls back to synchronous main-thread execution when `Worker` is
 * unavailable (e.g. SSR, older browsers, or test environments).
 */

'use client'

import { useCallback, useRef, useState } from 'react'
import { parseCsv, serializeCsv } from '@/domain/csv/csvProcessor'
import type {
  CsvParseResult,
  CsvSerializeResult,
  CsvWorkerInput,
  CsvWorkerOutput,
} from '@/domain/csv/types'

/** Return type of {@link useCsvWorker}. */
export interface UseCsvWorkerReturn {
  /** Parse a CSV string into structured rows (async via Worker). */
  parseCsvAsync: (csv: string) => Promise<CsvParseResult>
  /** Serialize row data into a CSV string (async via Worker). */
  serializeCsvAsync: (
    columns: readonly string[],
    rows: readonly Record<string, string | number | null>[],
  ) => Promise<CsvSerializeResult>
  /** Current processing progress (0 … 1). */
  progress: number
  /** Whether processing is currently in progress. */
  isProcessing: boolean
  /** Last error message, or `null` if none. */
  error: string | null
  /** Terminate the current Worker (cleanup). */
  terminate: () => void
}

/**
 * Detects whether the runtime supports Web Workers.
 *
 * Returns `false` during SSR, in test environments that don't polyfill
 * Worker, or in very old browsers.
 */
function supportsWorker(): boolean {
  return typeof Worker !== 'undefined'
}

/**
 * Hook that offloads CSV processing to a Web Worker.
 *
 * Falls back to synchronous execution on the main thread when Worker
 * support is not available. The fallback still reports progress (0 → 1)
 * so consumers don't need conditional rendering.
 */
export function useCsvWorker(): UseCsvWorkerReturn {
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lazily created Worker reference — only one instance per hook lifetime.
  const workerRef = useRef<Worker | null>(null)

  /**
   * Lazily instantiate the Worker on first use and return it.
   * Returns `null` if Workers are not supported.
   */
  const getWorker = useCallback((): Worker | null => {
    if (!supportsWorker()) return null
    if (workerRef.current) return workerRef.current

    try {
      workerRef.current = new Worker(
        new URL('../workers/csvProcessor.worker.ts', import.meta.url),
      )
      return workerRef.current
    } catch {
      // Worker creation can fail in some environments (e.g. file:// protocol).
      return null
    }
  }, [])

  /**
   * Send a message to the Worker and wait for a result.
   * Falls back to synchronous execution when Workers are unavailable.
   */
  const runOnWorker = useCallback(
    <T extends CsvParseResult | CsvSerializeResult>(
      input: CsvWorkerInput,
      fallback: () => T,
    ): Promise<T> => {
      const worker = getWorker()

      // ── Fallback path (synchronous) ─────────────────────────────────
      if (!worker) {
        setIsProcessing(true)
        setError(null)
        setProgress(0)
        try {
          const result = fallback()
          setProgress(1)
          return Promise.resolve(result)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'CSV processing failed'
          setError(msg)
          return Promise.reject(new Error(msg))
        } finally {
          setIsProcessing(false)
        }
      }

      // ── Worker path (async) ─────────────────────────────────────────
      return new Promise<T>((resolve, reject) => {
        setIsProcessing(true)
        setError(null)
        setProgress(0)

        const cleanup = () => {
          worker.onmessage = null
          worker.onerror = null
          setIsProcessing(false)
        }

        worker.onmessage = (event: MessageEvent<CsvWorkerOutput>) => {
          const msg = event.data
          switch (msg.type) {
            case 'progress':
              setProgress(msg.progress)
              break
            case 'result':
              setProgress(1)
              cleanup()
              resolve(msg.data as T)
              break
            case 'error':
              cleanup()
              setError(msg.message)
              reject(new Error(msg.message))
              break
          }
        }

        worker.onerror = (event) => {
          cleanup()
          const msg = event.message ?? 'Worker execution failed'
          setError(msg)
          reject(new Error(msg))
        }

        worker.postMessage(input)
      })
    },
    [getWorker],
  )

  const parseCsvAsync = useCallback(
    (csv: string): Promise<CsvParseResult> =>
      runOnWorker<CsvParseResult>(
        { type: 'parse', payload: { csv } },
        () => parseCsv(csv),
      ),
    [runOnWorker],
  )

  const serializeCsvAsync = useCallback(
    (
      columns: readonly string[],
      rows: readonly Record<string, string | number | null>[],
    ): Promise<CsvSerializeResult> =>
      runOnWorker<CsvSerializeResult>(
        { type: 'serialize', payload: { columns, rows } },
        () => serializeCsv(columns, rows),
      ),
    [runOnWorker],
  )

  const terminate = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
  }, [])

  return {
    parseCsvAsync,
    serializeCsvAsync,
    progress,
    isProcessing,
    error,
    terminate,
  }
}
