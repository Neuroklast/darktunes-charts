/**
 * @module domain/repositories/IBandRepository
 *
 * Repository interface for Band entity persistence.
 */

export interface CreateBandData {
  ownerId: string
  name: string
  country?: string
  city?: string
  tier?: string
  description?: string
  imageUrl?: string
  spotifyId?: string
  monthlyListeners?: number
}

export interface UpdateBandData {
  name?: string
  country?: string
  city?: string
  tier?: string
  description?: string
  imageUrl?: string
  spotifyId?: string
  monthlyListeners?: number
}

export interface IBandRepository {
  upsertByOwnerId(ownerId: string, create: CreateBandData, update: UpdateBandData): Promise<void>
}
