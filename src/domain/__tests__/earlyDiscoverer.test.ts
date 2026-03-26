import { describe, it, expect } from 'vitest'
import {
  computeEarlyDiscoverer,
  type FanVoteRecord,
  type ChartEntry,
} from '../gamification/earlyDiscoverer'

const day = (offset: number) => new Date(2025, 0, 1 + offset)

describe('computeEarlyDiscoverer', () => {
  it('returns zeros when top10 is empty', () => {
    const result = computeEarlyDiscoverer([], [])
    expect(result.discoveredCount).toBe(0)
    expect(result.totalTop10Count).toBe(0)
    expect(result.discoveryPercent).toBe(0)
    expect(result.earlyTracksIds).toEqual([])
  })

  it('detects a single early discovery', () => {
    const fanVotes: FanVoteRecord[] = [
      { trackId: 't1', votedAt: day(1) },
    ]
    const top10: ChartEntry[] = [
      { trackId: 't1', firstEnteredTop10At: day(5) },
    ]
    const result = computeEarlyDiscoverer(fanVotes, top10)
    expect(result.discoveredCount).toBe(1)
    expect(result.totalTop10Count).toBe(1)
    expect(result.discoveryPercent).toBe(100)
    expect(result.earlyTracksIds).toContain('t1')
  })

  it('does not count a vote cast AFTER the track charted', () => {
    const fanVotes: FanVoteRecord[] = [
      { trackId: 't1', votedAt: day(10) },
    ]
    const top10: ChartEntry[] = [
      { trackId: 't1', firstEnteredTop10At: day(5) },
    ]
    const result = computeEarlyDiscoverer(fanVotes, top10)
    expect(result.discoveredCount).toBe(0)
    expect(result.earlyTracksIds).toEqual([])
  })

  it('does not count a vote cast ON the same day the track charted', () => {
    const fanVotes: FanVoteRecord[] = [
      { trackId: 't1', votedAt: day(5) },
    ]
    const top10: ChartEntry[] = [
      { trackId: 't1', firstEnteredTop10At: day(5) },
    ]
    const result = computeEarlyDiscoverer(fanVotes, top10)
    // votedAt === firstEnteredTop10At → NOT strictly before → not discovered
    expect(result.discoveredCount).toBe(0)
  })

  it('computes correct percentage for 3 of 10', () => {
    const fanVotes: FanVoteRecord[] = [
      { trackId: 't1', votedAt: day(1) },
      { trackId: 't2', votedAt: day(1) },
      { trackId: 't3', votedAt: day(1) },
      { trackId: 't4', votedAt: day(9) }, // voted after t4 charted
    ]
    const top10: ChartEntry[] = Array.from({ length: 10 }, (_, i) => ({
      trackId: `t${i + 1}`,
      firstEnteredTop10At: day(5),
    }))
    const result = computeEarlyDiscoverer(fanVotes, top10)
    expect(result.discoveredCount).toBe(3)
    expect(result.totalTop10Count).toBe(10)
    expect(result.discoveryPercent).toBe(30)
  })

  it('uses the EARLIEST vote per track when fan voted multiple times', () => {
    const fanVotes: FanVoteRecord[] = [
      { trackId: 't1', votedAt: day(8) }, // after charting
      { trackId: 't1', votedAt: day(2) }, // before charting (earliest)
    ]
    const top10: ChartEntry[] = [
      { trackId: 't1', firstEnteredTop10At: day(5) },
    ]
    const result = computeEarlyDiscoverer(fanVotes, top10)
    expect(result.discoveredCount).toBe(1)
  })

  it('ignores fan votes for tracks not in Top 10', () => {
    const fanVotes: FanVoteRecord[] = [
      { trackId: 'unknown', votedAt: day(1) },
    ]
    const top10: ChartEntry[] = [
      { trackId: 't1', firstEnteredTop10At: day(5) },
    ]
    const result = computeEarlyDiscoverer(fanVotes, top10)
    expect(result.discoveredCount).toBe(0)
  })
})
