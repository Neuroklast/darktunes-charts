/**
 * @module infrastructure/repositories/PrismaAchievementRepository
 *
 * Prisma-backed implementation of {@link IAchievementRepository}.
 */
import type { PrismaClient } from '@prisma/client'
import type { IAchievementRepository, EarnedAchievementRecord } from '@/domain/repositories'

export class PrismaAchievementRepository implements IAchievementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findEarnedByUserId(userId: string): Promise<EarnedAchievementRecord[]> {
    const rows = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    })
    return rows as EarnedAchievementRecord[]
  }
}
