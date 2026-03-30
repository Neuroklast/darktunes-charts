import { describe, it, expect, vi } from 'vitest'
import { createEventBus } from '@/domain/events/eventBus'
import type { VoteSubmittedEvent, TierChangedEvent, BotDetectedEvent, AchievementEarnedEvent } from '@/domain/events/eventBus'

describe('EventBus', () => {
  it('delivers VoteSubmitted events to subscribed handlers', () => {
    const bus = createEventBus()
    const handler = vi.fn()

    bus.subscribe('VoteSubmitted', handler)

    const event: VoteSubmittedEvent = {
      type: 'VoteSubmitted',
      userId: 'user-1',
      trackId: 'track-1',
      voteType: 'fan',
      timestamp: Date.now(),
    }
    bus.publish(event)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(event)
  })

  it('delivers TierChanged events to subscribed handlers', () => {
    const bus = createEventBus()
    const handler = vi.fn()

    bus.subscribe('TierChanged', handler)

    const event: TierChangedEvent = {
      type: 'TierChanged',
      bandId: 'band-1',
      previousTier: 'Micro',
      newTier: 'Emerging',
      monthlyListeners: 15_000,
      timestamp: Date.now(),
    }
    bus.publish(event)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(event)
  })

  it('delivers BotDetected events to subscribed handlers', () => {
    const bus = createEventBus()
    const handler = vi.fn()

    bus.subscribe('BotDetected', handler)

    const event: BotDetectedEvent = {
      type: 'BotDetected',
      trackId: 'track-1',
      bandId: 'band-1',
      severity: 'high',
      alertType: 'velocity',
      timestamp: Date.now(),
    }
    bus.publish(event)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(event)
  })

  it('delivers AchievementEarned events to subscribed handlers', () => {
    const bus = createEventBus()
    const handler = vi.fn()

    bus.subscribe('AchievementEarned', handler)

    const event: AchievementEarnedEvent = {
      type: 'AchievementEarned',
      userId: 'user-1',
      achievementId: 'early-discoverer',
      achievementName: 'Early Discoverer',
      timestamp: Date.now(),
    }
    bus.publish(event)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(event)
  })

  it('does not deliver events to unrelated handlers', () => {
    const bus = createEventBus()
    const voteHandler = vi.fn()
    const tierHandler = vi.fn()

    bus.subscribe('VoteSubmitted', voteHandler)
    bus.subscribe('TierChanged', tierHandler)

    bus.publish({
      type: 'VoteSubmitted',
      userId: 'user-1',
      trackId: 'track-1',
      voteType: 'fan',
      timestamp: Date.now(),
    })

    expect(voteHandler).toHaveBeenCalledTimes(1)
    expect(tierHandler).not.toHaveBeenCalled()
  })

  it('supports multiple handlers for the same event type', () => {
    const bus = createEventBus()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    bus.subscribe('VoteSubmitted', handler1)
    bus.subscribe('VoteSubmitted', handler2)

    bus.publish({
      type: 'VoteSubmitted',
      userId: 'user-1',
      trackId: 'track-1',
      voteType: 'dj',
      timestamp: Date.now(),
    })

    expect(handler1).toHaveBeenCalledTimes(1)
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  it('unsubscribe removes only the targeted handler', () => {
    const bus = createEventBus()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    const unsub = bus.subscribe('VoteSubmitted', handler1)
    bus.subscribe('VoteSubmitted', handler2)

    unsub()

    bus.publish({
      type: 'VoteSubmitted',
      userId: 'user-1',
      trackId: 'track-1',
      voteType: 'peer',
      timestamp: Date.now(),
    })

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalledTimes(1)
  })

  it('clear(eventType) removes all handlers for that type only', () => {
    const bus = createEventBus()
    const voteHandler = vi.fn()
    const tierHandler = vi.fn()

    bus.subscribe('VoteSubmitted', voteHandler)
    bus.subscribe('TierChanged', tierHandler)

    bus.clear('VoteSubmitted')

    bus.publish({
      type: 'VoteSubmitted',
      userId: 'u',
      trackId: 't',
      voteType: 'fan',
      timestamp: Date.now(),
    })
    bus.publish({
      type: 'TierChanged',
      bandId: 'b',
      previousTier: 'Micro',
      newTier: 'Emerging',
      monthlyListeners: 20_000,
      timestamp: Date.now(),
    })

    expect(voteHandler).not.toHaveBeenCalled()
    expect(tierHandler).toHaveBeenCalledTimes(1)
  })

  it('clear() without arguments removes all handlers', () => {
    const bus = createEventBus()
    const voteHandler = vi.fn()
    const tierHandler = vi.fn()

    bus.subscribe('VoteSubmitted', voteHandler)
    bus.subscribe('TierChanged', tierHandler)

    bus.clear()

    bus.publish({
      type: 'VoteSubmitted',
      userId: 'u',
      trackId: 't',
      voteType: 'fan',
      timestamp: Date.now(),
    })
    bus.publish({
      type: 'TierChanged',
      bandId: 'b',
      previousTier: 'Micro',
      newTier: 'Emerging',
      monthlyListeners: 20_000,
      timestamp: Date.now(),
    })

    expect(voteHandler).not.toHaveBeenCalled()
    expect(tierHandler).not.toHaveBeenCalled()
  })

  it('does not throw when publishing an event with no subscribers', () => {
    const bus = createEventBus()

    expect(() => {
      bus.publish({
        type: 'VoteSubmitted',
        userId: 'u',
        trackId: 't',
        voteType: 'fan',
        timestamp: Date.now(),
      })
    }).not.toThrow()
  })

  it('handlers are invoked in registration order', () => {
    const bus = createEventBus()
    const order: number[] = []

    bus.subscribe('VoteSubmitted', () => order.push(1))
    bus.subscribe('VoteSubmitted', () => order.push(2))
    bus.subscribe('VoteSubmitted', () => order.push(3))

    bus.publish({
      type: 'VoteSubmitted',
      userId: 'u',
      trackId: 't',
      voteType: 'fan',
      timestamp: Date.now(),
    })

    expect(order).toEqual([1, 2, 3])
  })
})
