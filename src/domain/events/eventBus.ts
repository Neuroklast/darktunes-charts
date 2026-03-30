/**
 * @module domain/events/eventBus
 *
 * Typed domain event system (EventBus / Mediator pattern).
 *
 * Provides decoupled, cross-cutting domain communication without direct
 * module-to-module dependencies. Domain events are discriminated unions
 * keyed by `type`, enabling exhaustive pattern matching in handlers.
 *
 * Usage:
 * ```ts
 * import { createEventBus } from '@/domain/events/eventBus'
 *
 * const bus = createEventBus()
 * bus.subscribe('VoteSubmitted', (event) => { ... })
 * bus.publish({ type: 'VoteSubmitted', ... })
 * ```
 *
 * The event bus is intentionally synchronous — handlers run in registration
 * order within the same tick. For async side-effects (e.g., persisting to a
 * database), handlers should enqueue work rather than `await` inline.
 */

import type { Tier } from '@/lib/types'

// ---------------------------------------------------------------------------
// Domain Event Definitions
// ---------------------------------------------------------------------------

/** Emitted when a fan, DJ, or peer submits a vote. */
export interface VoteSubmittedEvent {
  readonly type: 'VoteSubmitted'
  readonly userId: string
  readonly trackId: string
  readonly voteType: 'fan' | 'dj' | 'peer'
  readonly timestamp: number
}

/** Emitted when a band's tier classification changes after a listener refresh. */
export interface TierChangedEvent {
  readonly type: 'TierChanged'
  readonly bandId: string
  readonly previousTier: Tier
  readonly newTier: Tier
  readonly monthlyListeners: number
  readonly timestamp: number
}

/** Emitted when the bot-detection system flags suspicious activity. */
export interface BotDetectedEvent {
  readonly type: 'BotDetected'
  readonly trackId: string
  readonly bandId: string
  readonly severity: 'low' | 'medium' | 'high'
  readonly alertType: 'velocity' | 'new_accounts' | 'ip_cluster' | 'pattern'
  readonly timestamp: number
}

/** Emitted when a user earns a new achievement/badge. */
export interface AchievementEarnedEvent {
  readonly type: 'AchievementEarned'
  readonly userId: string
  readonly achievementId: string
  readonly achievementName: string
  readonly timestamp: number
}

/**
 * Discriminated union of all domain events.
 * Add new event interfaces here and to this union to extend the system.
 */
export type DomainEvent =
  | VoteSubmittedEvent
  | TierChangedEvent
  | BotDetectedEvent
  | AchievementEarnedEvent

/** Maps each event type string to its corresponding event interface. */
export type DomainEventMap = {
  VoteSubmitted: VoteSubmittedEvent
  TierChanged: TierChangedEvent
  BotDetected: BotDetectedEvent
  AchievementEarned: AchievementEarnedEvent
}

/** All valid domain event type strings. */
export type DomainEventType = keyof DomainEventMap

// ---------------------------------------------------------------------------
// EventBus Interface & Implementation
// ---------------------------------------------------------------------------

/** Typed handler function for a specific domain event. */
export type EventHandler<T extends DomainEventType> = (event: DomainEventMap[T]) => void

/** Public interface for the domain event bus. */
export interface IEventBus {
  /**
   * Subscribe a handler for a specific event type.
   * Returns an unsubscribe function for cleanup.
   */
  subscribe<T extends DomainEventType>(eventType: T, handler: EventHandler<T>): () => void

  /**
   * Publish a domain event to all registered handlers for its type.
   * Handlers are invoked synchronously in registration order.
   */
  publish<T extends DomainEventType>(event: DomainEventMap[T]): void

  /** Remove all handlers for a specific event type, or all handlers if no type given. */
  clear(eventType?: DomainEventType): void
}

/**
 * Creates a new in-process domain event bus.
 *
 * Each bus instance maintains its own handler registry. In production,
 * a single bus is typically created at application startup and shared
 * via dependency injection or a module-level singleton.
 *
 * @returns A fresh `IEventBus` instance.
 */
export function createEventBus(): IEventBus {
  const handlers = new Map<DomainEventType, Set<EventHandler<DomainEventType>>>()

  return {
    subscribe<T extends DomainEventType>(eventType: T, handler: EventHandler<T>): () => void {
      if (!handlers.has(eventType)) {
        handlers.set(eventType, new Set())
      }

      const eventHandlers = handlers.get(eventType)!
      eventHandlers.add(handler as EventHandler<DomainEventType>)

      return () => {
        eventHandlers.delete(handler as EventHandler<DomainEventType>)
      }
    },

    publish<T extends DomainEventType>(event: DomainEventMap[T]): void {
      const eventHandlers = handlers.get(event.type as DomainEventType)
      if (!eventHandlers) return

      for (const handler of eventHandlers) {
        handler(event)
      }
    },

    clear(eventType?: DomainEventType): void {
      if (eventType) {
        handlers.delete(eventType)
      } else {
        handlers.clear()
      }
    },
  }
}
