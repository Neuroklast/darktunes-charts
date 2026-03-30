import { describe, it, expect, vi } from 'vitest'
import {
  EventBus,
  type DomainEvent,
  type VoteSubmittedEvent,
  type TierChangedEvent,
  type BotDetectedEvent,
  type AchievementEarnedEvent,
} from '@/domain/events/eventBus'

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function createVoteSubmittedEvent(overrides?: Partial<VoteSubmittedEvent>): VoteSubmittedEvent {
  return {
    type: 'VoteSubmitted',
    trackId: 'track-1',
    userId: 'user-1',
    voteType: 'fan',
    timestamp: new Date('2026-03-29T12:00:00Z'),
    ...overrides,
  }
}

function createTierChangedEvent(overrides?: Partial<TierChangedEvent>): TierChangedEvent {
  return {
    type: 'TierChanged',
    bandId: 'band-1',
    previousTier: 'Micro',
    newTier: 'Emerging',
    listeners: 15_000,
    timestamp: new Date('2026-03-29T12:00:00Z'),
    ...overrides,
  }
}

function createBotDetectedEvent(overrides?: Partial<BotDetectedEvent>): BotDetectedEvent {
  return {
    type: 'BotDetected',
    trackId: 'track-1',
    bandId: 'band-1',
    alertType: 'velocity',
    severity: 'high',
    timestamp: new Date('2026-03-29T12:00:00Z'),
    ...overrides,
  }
}

function createAchievementEarnedEvent(overrides?: Partial<AchievementEarnedEvent>): AchievementEarnedEvent {
  return {
    type: 'AchievementEarned',
    userId: 'user-1',
    achievementSlug: 'founding_fan',
    pillar: 'FAN',
    timestamp: new Date('2026-03-29T12:00:00Z'),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EventBus', () => {
  describe('subscribe and publish', () => {
    it('delivers VoteSubmitted event to registered handler', () => {
      const bus = new EventBus()
      const handler = vi.fn()

      bus.subscribe('VoteSubmitted', handler)
      const event = createVoteSubmittedEvent()
      bus.publish(event)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(event)
    })

    it('delivers TierChanged event to registered handler', () => {
      const bus = new EventBus()
      const handler = vi.fn()

      bus.subscribe('TierChanged', handler)
      const event = createTierChangedEvent()
      bus.publish(event)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(event)
    })

    it('delivers BotDetected event to registered handler', () => {
      const bus = new EventBus()
      const handler = vi.fn()

      bus.subscribe('BotDetected', handler)
      const event = createBotDetectedEvent()
      bus.publish(event)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(event)
    })

    it('delivers AchievementEarned event to registered handler', () => {
      const bus = new EventBus()
      const handler = vi.fn()

      bus.subscribe('AchievementEarned', handler)
      const event = createAchievementEarnedEvent()
      bus.publish(event)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(event)
    })

    it('delivers event to multiple handlers in registration order', () => {
      const bus = new EventBus()
      const callOrder: number[] = []

      bus.subscribe('VoteSubmitted', () => callOrder.push(1))
      bus.subscribe('VoteSubmitted', () => callOrder.push(2))
      bus.subscribe('VoteSubmitted', () => callOrder.push(3))

      bus.publish(createVoteSubmittedEvent())

      expect(callOrder).toEqual([1, 2, 3])
    })

    it('does not deliver event to handlers of other event types', () => {
      const bus = new EventBus()
      const voteHandler = vi.fn()
      const tierHandler = vi.fn()

      bus.subscribe('VoteSubmitted', voteHandler)
      bus.subscribe('TierChanged', tierHandler)

      bus.publish(createVoteSubmittedEvent())

      expect(voteHandler).toHaveBeenCalledTimes(1)
      expect(tierHandler).not.toHaveBeenCalled()
    })

    it('does nothing when publishing an event with no subscribers', () => {
      const bus = new EventBus()
      // Should not throw
      expect(() => bus.publish(createVoteSubmittedEvent())).not.toThrow()
    })
  })

  describe('unsubscribe', () => {
    it('removes handler when unsubscribe is called', () => {
      const bus = new EventBus()
      const handler = vi.fn()

      const unsubscribe = bus.subscribe('VoteSubmitted', handler)
      unsubscribe()

      bus.publish(createVoteSubmittedEvent())

      expect(handler).not.toHaveBeenCalled()
    })

    it('only removes the specific handler, not others for the same event type', () => {
      const bus = new EventBus()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      const unsub1 = bus.subscribe('TierChanged', handler1)
      bus.subscribe('TierChanged', handler2)

      unsub1()
      bus.publish(createTierChangedEvent())

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('is idempotent — calling unsubscribe twice does not throw', () => {
      const bus = new EventBus()
      const unsubscribe = bus.subscribe('BotDetected', vi.fn())

      unsubscribe()
      expect(() => unsubscribe()).not.toThrow()
    })
  })

  describe('handlerCount', () => {
    it('returns 0 for event type with no handlers', () => {
      const bus = new EventBus()
      expect(bus.handlerCount('VoteSubmitted')).toBe(0)
    })

    it('reflects the number of active handlers', () => {
      const bus = new EventBus()
      const unsub1 = bus.subscribe('TierChanged', vi.fn())
      bus.subscribe('TierChanged', vi.fn())

      expect(bus.handlerCount('TierChanged')).toBe(2)

      unsub1()
      expect(bus.handlerCount('TierChanged')).toBe(1)
    })
  })

  describe('clear', () => {
    it('removes all handlers for all event types', () => {
      const bus = new EventBus()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      bus.subscribe('VoteSubmitted', handler1)
      bus.subscribe('TierChanged', handler2)

      bus.clear()

      bus.publish(createVoteSubmittedEvent())
      bus.publish(createTierChangedEvent())

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
      expect(bus.handlerCount('VoteSubmitted')).toBe(0)
      expect(bus.handlerCount('TierChanged')).toBe(0)
    })
  })

  describe('type safety (compile-time)', () => {
    it('handler receives correctly typed event via discriminated union', () => {
      const bus = new EventBus()
      const receivedEvents: DomainEvent[] = []

      bus.subscribe('VoteSubmitted', (event) => {
        // TypeScript narrows event to VoteSubmittedEvent
        receivedEvents.push(event)
        expect(event.type).toBe('VoteSubmitted')
        expect(event.trackId).toBeDefined()
        expect(event.voteType).toBeDefined()
      })

      bus.subscribe('TierChanged', (event) => {
        receivedEvents.push(event)
        expect(event.type).toBe('TierChanged')
        expect(event.bandId).toBeDefined()
        expect(event.previousTier).toBeDefined()
        expect(event.newTier).toBeDefined()
      })

      bus.publish(createVoteSubmittedEvent())
      bus.publish(createTierChangedEvent())

      expect(receivedEvents).toHaveLength(2)
    })
  })

  describe('cross-domain use cases', () => {
    it('VoteSubmitted → triggers transparency log (simulated)', () => {
      const bus = new EventBus()
      const logEntries: Array<{ trackId: string; userId: string }> = []

      // Simulate a transparency log subscriber
      bus.subscribe('VoteSubmitted', (event) => {
        logEntries.push({ trackId: event.trackId, userId: event.userId })
      })

      bus.publish(createVoteSubmittedEvent({ trackId: 'track-42', userId: 'user-7' }))

      expect(logEntries).toEqual([{ trackId: 'track-42', userId: 'user-7' }])
    })

    it('BotDetected → triggers admin alert (simulated)', () => {
      const bus = new EventBus()
      const alerts: Array<{ bandId: string; severity: string }> = []

      bus.subscribe('BotDetected', (event) => {
        alerts.push({ bandId: event.bandId, severity: event.severity })
      })

      bus.publish(createBotDetectedEvent({ bandId: 'band-99', severity: 'high' }))

      expect(alerts).toEqual([{ bandId: 'band-99', severity: 'high' }])
    })

    it('AchievementEarned → triggers notification (simulated)', () => {
      const bus = new EventBus()
      const notifications: Array<{ userId: string; achievementSlug: string }> = []

      bus.subscribe('AchievementEarned', (event) => {
        notifications.push({ userId: event.userId, achievementSlug: event.achievementSlug })
      })

      bus.publish(createAchievementEarnedEvent({ userId: 'user-42', achievementSlug: 'crowd_magnet' }))

      expect(notifications).toEqual([{ userId: 'user-42', achievementSlug: 'crowd_magnet' }])
    })
  })
})
