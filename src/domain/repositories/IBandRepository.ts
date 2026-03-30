/**
 * @module domain/repositories/IBandRepository
 *
 * Repository interface for Band entity persistence.
 */

/** Data required to create a new band record. */
export interface CreateBandData {
  ownerId: string
  name: string
  genre: string
  tier: string
}

/** Data for updating an existing band record. */
export interface UpdateBandData {
  name: string
}

export interface IBandRepository {
  /** Create or update a band by owner ID. */
  upsertByOwnerId(ownerId: string, create: CreateBandData, update: UpdateBandData): Promise<void>
}
