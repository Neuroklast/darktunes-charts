/**
 * @module domain/events/eventBus
 *
 * Lightweight, typed domain event system following the Mediator pattern.
 *
 * Enables decoupled communication between domain modules. Events are defined
 * as a TypeScript discriminated union keyed on the `type` field, ensuring
 * compile-time safety for both publishers and subscribers.
 *
 * **Design decisions:**
 * - Synchronous dispatch: handlers run in registration order. This keeps the
 *   event bus predictable and testable without introducing async complexity.
 * - No persistence: events are ephemeral, in-memory signals. Durable event
 *   sourcing can be layered on top via an infrastructure adapter if needed.
 * - Singleton-free: consumers create their own EventBus instances, making
 *   unit tests fully isolated. A shared application-level instance can be
 *   wired up in the composition root.
 */

// ---------------------------------------------------------------------------
// Domain Event Definitions (Discriminated Union)
// ---------------------------------------------------------------------------

/** Emitted when a fan, DJ, or peer vote is successfully recorded. */
export interface VoteSubmittedEvent {
  readonly type: 'VoteSubmitted'
  readonly trackId: string
  readonly userId: string
  readonly voteType: 'fan' | 'dj' | 'peer'
  readonly timestamp: Date
}

/** Emitted when a band's competition tier changes after a Spotify refresh. */
export interface TierChangedEvent {
  readonly type: 'TierChanged'
  readonly bandId: string
  readonly previousTier: string
  readonly newTier: string
  readonly listeners: number
  readonly timestamp: Date
}

/** Emitted when the bot detection system flags suspicious voting activity. */
export interface BotDetectedEvent {
  readonly type: 'BotDetected'
  readonly trackId: string
  readonly bandId: string
  readonly alertType: 'velocity' | 'new_accounts' | 'ip_cluster' | 'pattern'
  readonly severity: 'low' | 'medium' | 'high'
  readonly timestamp: Date
}

/** Emitted when a user earns a platform achievement. */
export interface AchievementEarnedEvent {
  readonly type: 'AchievementEarned'
  readonly userId: string
  readonly achievementSlug: string
  readonly pillar: 'FAN' | 'BAND' | 'DJ'
  readonly timestamp: Date
}

/**
 * Union of all domain events.
 *
 * Adding a new event requires:
 * 1. Define the interface above with a unique `type` literal.
 * 2. Add it to this union.
 * 3. Subscribers can then narrow on `event.type` with full type safety.
 */
export type DomainEvent =
  | VoteSubmittedEvent
  | TierChangedEvent
  | BotDetectedEvent
  | AchievementEarnedEvent

/** Extracts the `type` literal from the event union. */
export type DomainEventType = DomainEvent['type']

/** Maps an event type string to its corresponding event interface. */
export type DomainEventMap = {
  [E in DomainEvent as E['type']]: E
}

// ---------------------------------------------------------------------------
// EventBus Interface & Implementation
// ---------------------------------------------------------------------------

/** Handler function for a specific domain event type. */
export type EventHandler<T extends DomainEventType> = (event: DomainEventMap[T]) => void

/** Unsubscribe function returned by `subscribe`. */
export type Unsubscribe = () => void

/**
 * Contract for the domain event bus.
 *
 * Consumers depend on this interface, not the concrete implementation,
 * enabling easy substitution in tests (e.g. a spy/mock event bus).
 */
export interface IEventBus {
  /** Register a handler for a specific event type. Returns an unsubscribe function. */
  subscribe<T extends DomainEventType>(eventType: T, handler: EventHandler<T>): Unsubscribe

  /** Dispatch an event to all registered handlers of its type. */
  publish(event: DomainEvent): void
}

/**
 * In-memory event bus implementation.
 *
 * Handlers are invoked synchronously in registration order. Each `subscribe`
 * call returns an `Unsubscribe` function for deterministic cleanup.
 */
export class EventBus implements IEventBus {
  private readonly handlers = new Map<DomainEventType, Set<EventHandler<DomainEventType>>>()

  subscribe<T extends DomainEventType>(eventType: T, handler: EventHandler<T>): Unsubscribe {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }

    const handlerSet = this.handlers.get(eventType)!
    handlerSet.add(handler as EventHandler<DomainEventType>)

    return () => {
      handlerSet.delete(handler as EventHandler<DomainEventType>)
    }
  }

  publish(event: DomainEvent): void {
    const handlerSet = this.handlers.get(event.type)
    if (!handlerSet) return

    for (const handler of handlerSet) {
      handler(event)
    }
  }

  /** Returns the number of handlers registered for a given event type. */
  handlerCount(eventType: DomainEventType): number {
    return this.handlers.get(eventType)?.size ?? 0
  }

  /** Removes all handlers for all event types. Useful in test teardown. */
  clear(): void {
    this.handlers.clear()
  }
}
