import { describe, it, expect } from 'vitest'

/**
 * LazyThreeScene integration test.
 *
 * Verifies the lazy-loading wrapper is correctly configured:
 * - Exports a React component (the dynamic wrapper)
 * - The underlying ThreeScene module is importable
 */
describe('LazyThreeScene', () => {
  it('ThreeScene module exports a default component', async () => {
    const mod = await import('../atoms/ThreeScene')
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe('function')
  })

  it('LazyThreeScene module exports a named component', async () => {
    // next/dynamic returns a component-like object; verify the module shape
    const mod = await import('../atoms/LazyThreeScene')
    expect(mod.LazyThreeScene).toBeDefined()
  })
})
