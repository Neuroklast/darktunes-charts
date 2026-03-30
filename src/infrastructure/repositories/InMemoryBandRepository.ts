/**
 * @module infrastructure/repositories/InMemoryBandRepository
 *
 * In-memory implementation of {@link IBandRepository} for testing.
 */
import type { IBandRepository, CreateBandData, UpdateBandData } from '@/domain/repositories'

interface BandRecord {
  ownerId: string
  name: string
  genre: string
  tier: string
}

export class InMemoryBandRepository implements IBandRepository {
  private readonly bands = new Map<string, BandRecord>()

  async upsertByOwnerId(ownerId: string, create: CreateBandData, update: UpdateBandData): Promise<void> {
    const existing = this.bands.get(ownerId)
    if (existing) {
      this.bands.set(ownerId, { ...existing, name: update.name })
    } else {
      this.bands.set(ownerId, { ownerId: create.ownerId, name: create.name, genre: create.genre, tier: create.tier })
    }
  }

  /** Retrieve a band by owner ID (test helper). */
  getByOwnerId(ownerId: string): BandRecord | undefined {
    return this.bands.get(ownerId)
  }
}
