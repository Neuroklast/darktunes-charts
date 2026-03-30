import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCsvWorker } from '@/hooks/useCsvWorker'

/**
 * Tests for the useCsvWorker hook.
 *
 * Because jsdom does not support real Web Workers, these tests exercise the
 * synchronous fallback path. The important guarantees we verify:
 * - parseCsvAsync resolves with correct data
 * - serializeCsvAsync resolves with correct data
 * - progress reaches 1 after completion
 * - error state is set on invalid input
 * - isProcessing toggles correctly
 */

// Ensure Worker is NOT available so the fallback path is exercised.
beforeEach(() => {
  vi.stubGlobal('Worker', undefined)

  return () => {
    vi.unstubAllGlobals()
  }
})

describe('useCsvWorker (fallback path)', () => {
  it('parseCsvAsync returns parsed data', async () => {
    const { result } = renderHook(() => useCsvWorker())
    const csv = 'Name,Score\r\nAlice,10\r\nBob,20'

    let parsed: Awaited<ReturnType<typeof result.current.parseCsvAsync>> | undefined
    await act(async () => {
      parsed = await result.current.parseCsvAsync(csv)
    })

    expect(parsed).toBeDefined()
    expect(parsed!.headers).toEqual(['Name', 'Score'])
    expect(parsed!.rows).toEqual([
      { Name: 'Alice', Score: '10' },
      { Name: 'Bob', Score: '20' },
    ])
    expect(parsed!.totalRows).toBe(2)
    expect(result.current.error).toBeNull()
  })

  it('serializeCsvAsync returns serialized CSV', async () => {
    const { result } = renderHook(() => useCsvWorker())
    const columns = ['A', 'B']
    const rows = [{ A: '1', B: '2' }]

    let serialized: Awaited<ReturnType<typeof result.current.serializeCsvAsync>> | undefined
    await act(async () => {
      serialized = await result.current.serializeCsvAsync(columns, rows)
    })

    expect(serialized).toBeDefined()
    expect(serialized!.csv).toBe('A,B\r\n1,2')
    expect(serialized!.totalRows).toBe(1)
  })

  it('sets error state on invalid CSV', async () => {
    const { result } = renderHook(() => useCsvWorker())

    await act(async () => {
      try {
        await result.current.parseCsvAsync('')
      } catch {
        // Expected
      }
    })

    expect(result.current.error).toMatch(/CSV is empty/)
  })

  it('progress reaches 1 after successful parse', async () => {
    const { result } = renderHook(() => useCsvWorker())

    await act(async () => {
      await result.current.parseCsvAsync('X\r\n1')
    })

    expect(result.current.progress).toBe(1)
  })

  it('isProcessing is false after completion', async () => {
    const { result } = renderHook(() => useCsvWorker())

    await act(async () => {
      await result.current.parseCsvAsync('X\r\n1')
    })

    expect(result.current.isProcessing).toBe(false)
  })

  it('terminate is a no-op without a Worker', () => {
    const { result } = renderHook(() => useCsvWorker())
    expect(() => result.current.terminate()).not.toThrow()
  })
})
