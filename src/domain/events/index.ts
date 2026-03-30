/**
 * @module domain/events
 *
 * Domain event system and event-ranking utilities.
 *
 * Sub-modules:
 * - `eventBus`  — Typed EventBus/Mediator for cross-cutting domain communication
 * - `ranking`   — Event ranking by attendee intent count
 */

export type {
  DomainEvent,
  DomainEventMap,
  DomainEventType,
  EventHandler,
  IEventBus,
  VoteSubmittedEvent,
  TierChangedEvent,
  BotDetectedEvent,
  AchievementEarnedEvent,
} from './eventBus'

export { createEventBus } from './eventBus'

export type { EventWithIntents, RankedEvent } from './ranking'
export { rankEvents, filterUpcomingEvents } from './ranking'
