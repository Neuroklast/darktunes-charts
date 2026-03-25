import { describe, it, expect, beforeEach } from 'vitest'
import { getStore, resetStore } from '../_lib/store'

describe('store', () => {
  beforeEach(() => resetStore())

  it('initialises with seed bands', () => {
    const store = getStore()
    expect(store.bands.length).toBeGreaterThan(0)
  })

  it('initialises with seed tracks', () => {
    const store = getStore()
    expect(store.tracks.length).toBeGreaterThan(0)
  })

  it('starts with empty fanVotes', () => {
    const store = getStore()
    expect(Object.keys(store.fanVotes)).toHaveLength(0)
  })

  it('starts with empty transparencyLog', () => {
    const store = getStore()
    expect(store.transparencyLog).toHaveLength(0)
  })

  it('starts with empty djBallots', () => {
    const store = getStore()
    expect(store.djBallots).toHaveLength(0)
  })

  it('starts with empty botAlerts', () => {
    const store = getStore()
    expect(store.botAlerts).toHaveLength(0)
  })

  it('starts with empty peerVotes', () => {
    const store = getStore()
    expect(store.peerVotes).toHaveLength(0)
  })

  it('resetStore restores seed data', () => {
    const store = getStore()
    store.bands = []
    store.fanVotes['t1'] = { trackId: 't1', votes: 3, creditsSpent: 9 }
    resetStore()
    const fresh = getStore()
    expect(fresh.bands.length).toBeGreaterThan(0)
    expect(Object.keys(fresh.fanVotes)).toHaveLength(0)
  })

  it('allows mutation of bands array', () => {
    const store = getStore()
    const initialCount = store.bands.length
    store.bands.push({ id: 'test', name: 'Test', genre: 'Goth', spotifyMonthlyListeners: 1000, tier: 'Micro' })
    expect(getStore().bands).toHaveLength(initialCount + 1)
  })
})
