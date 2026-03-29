/**
 * @module domain/repositories/IAchievementRepository
 *
 * Repository interface for UserAchievement entity persistence.
 */

/** A user's earned achievement record with its definition slug. */
export interface EarnedAchievementRecord {
  grantedAt: Date
  metadata: unknown
  achievement: { slug: string }
}

export interface IAchievementRepository {
  /** Find all achievements earned by a user, including the achievement definition. */
  findEarnedByUserId(userId: string): Promise<EarnedAchievementRecord[]>
}
