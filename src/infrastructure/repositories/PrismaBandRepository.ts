/**
 * @module infrastructure/repositories/PrismaBandRepository
 *
 * Prisma-backed implementation of {@link IBandRepository}.
 */
import type { PrismaClient } from '@prisma/client'
import type { IBandRepository, CreateBandData, UpdateBandData } from '@/domain/repositories'

export class PrismaBandRepository implements IBandRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertByOwnerId(ownerId: string, create: CreateBandData, update: UpdateBandData): Promise<void> {
    await this.prisma.band.upsert({
      where: { ownerId },
      create: {
        ownerId: create.ownerId,
        name: create.name,
        genre: create.genre as never,
        tier: create.tier as never,
      },
      update: { name: update.name },
    })
  }
}
