import { useState, useCallback } from 'react'

type SetStateAction<T> = T | ((prev: T) => T)
type SetState<T> = (action: SetStateAction<T>) => void

const KV_PREFIX = 'kv:'

function readFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(KV_PREFIX + key)
    return raw !== null ? (JSON.parse(raw) as T) : defaultValue
  } catch {
    return defaultValue
  }
}

function writeToStorage<T>(key: string, value: T): void {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(KV_PREFIX + key)
    } else {
      localStorage.setItem(KV_PREFIX + key, JSON.stringify(value))
    }
  } catch {
    // localStorage unavailable (e.g. in tests or private browsing)
  }
}

/**
 * Drop-in replacement for @github/spark's `useKV`.
 *
 * Provides persistent key-value state backed by localStorage.
 * The interface is identical to the Spark hook so all call sites can
 * switch to this shim by changing a single import path.
 *
 * @param key - Storage key (namespaced with "kv:" prefix internally).
 * @param defaultValue - Value to use when no stored value exists.
 * @returns `[value, setValue]` tuple, same as useState.
 */
export function useKV<T>(key: string, defaultValue: T): [T, SetState<T>] {
  const [value, setLocalState] = useState<T>(() => readFromStorage(key, defaultValue))

  const setValue: SetState<T> = useCallback(
    (action) => {
      setLocalState((prev) => {
        const next = typeof action === 'function' ? (action as (p: T) => T)(prev) : action
        writeToStorage(key, next)
        return next
      })
    },
    [key]
  )

  return [value, setValue]
}
