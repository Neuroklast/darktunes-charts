/**
 * @module domain/repositories
 *
 * Repository interfaces defining the contract between the domain layer
 * and persistence infrastructure.
 *
 * These interfaces follow the Repository pattern from Domain-Driven Design:
 * - The domain defines WHAT data operations are needed (interfaces here).
 * - The infrastructure defines HOW they are performed (Prisma adapters).
 * - API routes and application services depend only on these interfaces.
 *
 * This abstraction enables:
 * - Swapping persistence backends without changing business logic
 * - In-memory implementations for fast, isolated unit tests
 * - Clear separation between domain logic and database concerns
 */

import type { Tier, UserRole } from '@/lib/types'

// ---------------------------------------------------------------------------
// Shared value objects
// ---------------------------------------------------------------------------

/** Subset of user data returned by repository queries. */
export interface UserRecord {
  id: string
  role: UserRole
  name: string
  email: string
  credits: number
  avatarUrl?: string
  isDJVerified?: boolean
  createdAt: Date
  bandId?: string
}

/** Data required to create or update a user. */
export interface UpsertUserData {
  id: string
  role: UserRole
  name: string
  email: string
  credits?: number
  avatarUrl?: string
}

/** Subset of band data returned by repository queries. */
export interface BandRecord {
  id: string
  name: string
  genre: string
  tier: Tier
  ownerId: string
  spotifyArtistId?: string
  country?: string
  formedYear?: number
}

/** Data required to create or update a band. */
export interface UpsertBandData {
  name: string
  genre: string
  ownerId: string
  tier?: Tier
  spotifyArtistId?: string
  country?: string
}

/** Earned achievement record. */
export interface AchievementRecord {
  id: string
  slug: string
  userId: string
  grantedAt: Date
  metadata?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Repository Interfaces
// ---------------------------------------------------------------------------

export interface IUserRepository {
  /** Find a user by their unique ID. Returns `null` if not found. */
  findById(id: string): Promise<UserRecord | null>
  /** Create or update a user record. Returns the upserted user. */
  upsert(data: UpsertUserData): Promise<UserRecord>
}

export interface IBandRepository {
  /** Find a band by its unique ID. Returns `null` if not found. */
  findById(id: string): Promise<BandRecord | null>
  /** Find a band by its owner's user ID. Returns `null` if not found. */
  findByOwnerId(ownerId: string): Promise<BandRecord | null>
  /** Create or update a band record, keyed by owner ID. */
  upsert(data: UpsertBandData): Promise<BandRecord>
  /** List all bands, optionally filtered by tier. */
  findAll(filter?: { tier?: Tier }): Promise<BandRecord[]>
}

export interface IAchievementRepository {
  /** Find all achievements earned by a specific user. */
  findByUserId(userId: string): Promise<AchievementRecord[]>
  /** Grant an achievement to a user. Idempotent — re-granting is a no-op. */
  grant(userId: string, achievementSlug: string, metadata?: Record<string, unknown>): Promise<AchievementRecord>
}
