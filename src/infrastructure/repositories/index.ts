/**
 * @module infrastructure/repositories
 *
 * Repository implementations for the domain repository interfaces.
 *
 * - `InMemory*Repository` — Fast, in-memory implementations for unit testing.
 *   No external dependencies; state is local to each instance.
 *
 * Prisma implementations can be added here when the database layer is fully
 * wired. They would implement the same interfaces but delegate to PrismaClient.
 */

import type {
  IUserRepository,
  IBandRepository,
  IAchievementRepository,
  UserRecord,
  UpsertUserData,
  BandRecord,
  UpsertBandData,
  AchievementRecord,
} from '@/domain/repositories'
import type { Tier } from '@/lib/types'

// ---------------------------------------------------------------------------
// In-Memory User Repository
// ---------------------------------------------------------------------------

export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, UserRecord>()

  async findById(id: string): Promise<UserRecord | null> {
    return this.store.get(id) ?? null
  }

  async upsert(data: UpsertUserData): Promise<UserRecord> {
    const existing = this.store.get(data.id)
    const record: UserRecord = {
      id: data.id,
      role: data.role,
      name: data.name,
      email: data.email,
      credits: data.credits ?? existing?.credits ?? 100,
      avatarUrl: data.avatarUrl ?? existing?.avatarUrl,
      isDJVerified: existing?.isDJVerified,
      createdAt: existing?.createdAt ?? new Date(),
      bandId: existing?.bandId,
    }
    this.store.set(data.id, record)
    return record
  }

  /** Test helper: seed the repository with pre-existing records. */
  seed(records: UserRecord[]): void {
    for (const record of records) {
      this.store.set(record.id, record)
    }
  }

  /** Test helper: clear all records. */
  clear(): void {
    this.store.clear()
  }
}

// ---------------------------------------------------------------------------
// In-Memory Band Repository
// ---------------------------------------------------------------------------

export class InMemoryBandRepository implements IBandRepository {
  private readonly store = new Map<string, BandRecord>()
  private nextId = 1

  async findById(id: string): Promise<BandRecord | null> {
    return this.store.get(id) ?? null
  }

  async findByOwnerId(ownerId: string): Promise<BandRecord | null> {
    for (const band of this.store.values()) {
      if (band.ownerId === ownerId) return band
    }
    return null
  }

  async upsert(data: UpsertBandData): Promise<BandRecord> {
    const existing = await this.findByOwnerId(data.ownerId)
    const record: BandRecord = {
      id: existing?.id ?? `band-${this.nextId++}`,
      name: data.name,
      genre: data.genre,
      tier: data.tier ?? existing?.tier ?? 'Micro',
      ownerId: data.ownerId,
      spotifyArtistId: data.spotifyArtistId ?? existing?.spotifyArtistId,
      country: data.country ?? existing?.country,
      formedYear: existing?.formedYear,
    }
    this.store.set(record.id, record)
    return record
  }

  async findAll(filter?: { tier?: Tier }): Promise<BandRecord[]> {
    const all = Array.from(this.store.values())
    if (!filter?.tier) return all
    return all.filter(b => b.tier === filter.tier)
  }

  /** Test helper: seed the repository with pre-existing records. */
  seed(records: BandRecord[]): void {
    for (const record of records) {
      this.store.set(record.id, record)
    }
  }

  /** Test helper: clear all records. */
  clear(): void {
    this.store.clear()
  }
}

// ---------------------------------------------------------------------------
// In-Memory Achievement Repository
// ---------------------------------------------------------------------------

export class InMemoryAchievementRepository implements IAchievementRepository {
  private readonly store: AchievementRecord[] = []
  private nextId = 1

  async findByUserId(userId: string): Promise<AchievementRecord[]> {
    return this.store.filter(a => a.userId === userId)
  }

  async grant(userId: string, achievementSlug: string, metadata?: Record<string, unknown>): Promise<AchievementRecord> {
    const existing = this.store.find(a => a.userId === userId && a.slug === achievementSlug)
    if (existing) return existing

    const record: AchievementRecord = {
      id: `ach-${this.nextId++}`,
      slug: achievementSlug,
      userId,
      grantedAt: new Date(),
      metadata,
    }
    this.store.push(record)
    return record
  }

  /** Test helper: clear all records. */
  clear(): void {
    this.store.length = 0
  }
}
