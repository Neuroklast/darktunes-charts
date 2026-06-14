import type { IAchievementRepository, EarnedAchievementRecord } from '@/domain/repositories'

export class InMemoryAchievementRepository implements IAchievementRepository {
  private records: EarnedAchievementRecord[] = []

  async findEarnedByUserId(_userId: string): Promise<EarnedAchievementRecord[]> {
    return this.records
  }
}
