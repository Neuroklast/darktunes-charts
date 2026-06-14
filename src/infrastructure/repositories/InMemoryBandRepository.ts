import type { IBandRepository, CreateBandData, UpdateBandData } from '@/domain/repositories'

export class InMemoryBandRepository implements IBandRepository {
  private bands: Map<string, any> = new Map()

  async upsertByOwnerId(ownerId: string, create: CreateBandData, update: UpdateBandData): Promise<void> {
    const existingKey = Array.from(this.bands.entries()).find(([, b]) => b.ownerId === ownerId)?.[0]

    if (existingKey) {
      const existing = this.bands.get(existingKey)
      this.bands.set(existingKey, {
        ...existing,
        name: update.name ?? existing.name,
        country: update.country ?? existing.country,
        city: update.city ?? existing.city,
        tier: update.tier ?? existing.tier,
        description: update.description ?? existing.description,
        imageUrl: update.imageUrl ?? existing.imageUrl,
        spotifyId: update.spotifyId ?? existing.spotifyId,
        monthlyListeners: update.monthlyListeners ?? existing.monthlyListeners
      })
    } else {
      const newId = `band-${Date.now()}`
      this.bands.set(newId, {
        id: newId,
        ownerId: create.ownerId,
        name: create.name,
        country: create.country,
        city: create.city,
        tier: create.tier,
        description: create.description,
        imageUrl: create.imageUrl,
        spotifyId: create.spotifyId,
        monthlyListeners: create.monthlyListeners
      })
    }
  }

  async findById(id: string): Promise<unknown | null> {
    return this.bands.get(id) || null
  }

  async findByOwnerId(ownerId: string): Promise<unknown[]> {
    return Array.from(this.bands.values()).filter(b => b.ownerId === ownerId)
  }
}
