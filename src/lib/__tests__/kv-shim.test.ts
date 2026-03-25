import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKV } from '../kv-shim'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

describe('useKV', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('returns default value when nothing stored', () => {
    const { result } = renderHook(() => useKV('test-key', 42))
    expect(result.current[0]).toBe(42)
  })

  it('reads initial value from localStorage if present', () => {
    localStorageMock.setItem('kv:existing', JSON.stringify('hello'))
    const { result } = renderHook(() => useKV('existing', 'default'))
    expect(result.current[0]).toBe('hello')
  })

  it('updates value via setValue', () => {
    const { result } = renderHook(() => useKV('count', 0))
    act(() => result.current[1](5))
    expect(result.current[0]).toBe(5)
  })

  it('persists to localStorage on setValue', () => {
    const { result } = renderHook(() => useKV('persist-key', 'init'))
    act(() => result.current[1]('updated'))
    expect(localStorageMock.setItem).toHaveBeenCalledWith('kv:persist-key', JSON.stringify('updated'))
  })

  it('supports functional updater', () => {
    const { result } = renderHook(() => useKV('num', 10))
    act(() => result.current[1]((prev) => prev + 5))
    expect(result.current[0]).toBe(15)
  })

  it('works with object values', () => {
    const obj = { a: 1, b: 'hello' }
    const { result } = renderHook(() => useKV('obj-key', null as typeof obj | null))
    act(() => result.current[1](obj))
    expect(result.current[0]).toEqual(obj)
  })

  it('works with array values', () => {
    const { result } = renderHook(() => useKV<string[]>('arr-key', []))
    act(() => result.current[1](['x', 'y']))
    expect(result.current[0]).toEqual(['x', 'y'])
  })

  it('returns null when set to null', () => {
    const { result } = renderHook(() => useKV<string | null>('null-key', 'init'))
    act(() => result.current[1](null))
    expect(result.current[0]).toBeNull()
  })
})
