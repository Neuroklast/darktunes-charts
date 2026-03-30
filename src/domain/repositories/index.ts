/**
 * @module domain/repositories
 *
 * Repository interfaces defining the persistence contract for domain entities.
 * Infrastructure implementations (Prisma, in-memory) depend on these interfaces,
 * following the Dependency Inversion Principle.
 */
export type {
  IUserRepository,
  UserRecord,
  UserRoleRecord,
  CreateUserData,
  UpdateUserData,
} from './IUserRepository'

export type {
  IBandRepository,
  CreateBandData,
  UpdateBandData,
} from './IBandRepository'

export type {
  IAchievementRepository,
  EarnedAchievementRecord,
} from './IAchievementRepository'
