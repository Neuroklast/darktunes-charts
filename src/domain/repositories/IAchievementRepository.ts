/**
 * @module domain/repositories/IAchievementRepository
 *
 * Repository interface for UserAchievement entity persistence.
 */

export interface EarnedAchievementRecord {
  grantedAt: Date
  metadata?: unknown
  slug: string
  title: string
  description: string
  rarity: string
  iconKey: string
  achievement?: { slug: string }
}

export interface IAchievementRepository {
  findEarnedByUserId(userId: string): Promise<EarnedAchievementRecord[]>
}
