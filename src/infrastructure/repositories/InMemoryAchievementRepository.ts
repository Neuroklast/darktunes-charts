/**
 * @module infrastructure/repositories/InMemoryAchievementRepository
 *
 * In-memory implementation of {@link IAchievementRepository} for testing.
 */
import type { IAchievementRepository, EarnedAchievementRecord } from '@/domain/repositories'

export class InMemoryAchievementRepository implements IAchievementRepository {
  private readonly achievements = new Map<string, EarnedAchievementRecord[]>()

  async findEarnedByUserId(userId: string): Promise<EarnedAchievementRecord[]> {
    return this.achievements.get(userId) ?? []
  }

  /** Seed earned achievements for a user (test helper). */
  seed(userId: string, records: EarnedAchievementRecord[]): void {
    this.achievements.set(userId, records)
  }
}
