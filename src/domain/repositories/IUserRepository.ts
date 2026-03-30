/**
 * @module domain/repositories/IUserRepository
 *
 * Repository interface for User entity persistence.
 * Defines the contract between the domain/application layer and the
 * data-access layer, following the Dependency Inversion Principle.
 *
 * Infrastructure implementations (e.g., Prisma) live in
 * `src/infrastructure/repositories/`.
 */
import type { PrismaUserRole } from '@/domain/auth/profile'

/** Subset of User fields used for role-based access checks. */
export interface UserRoleRecord {
  role: PrismaUserRole
}

/** Full User profile record as returned from the database. */
export interface UserRecord {
  id: string
  role: PrismaUserRole
  name: string
  email: string
  credits: number
  avatarUrl: string | null
  isDJVerified: boolean
  createdAt: Date
  band: { id: string } | null
}

/** Data required to create a new user. */
export interface CreateUserData {
  id: string
  email: string
  name: string
  role: PrismaUserRole
  avatarUrl: string | null
  credits: number
}

/** Data for updating an existing user. */
export interface UpdateUserData {
  name: string
  role: PrismaUserRole
  avatarUrl: string | null
}

export interface IUserRepository {
  /** Find a user by ID with full profile data. Returns null if not found. */
  findById(id: string): Promise<UserRecord | null>

  /** Find a user's role by ID. Returns null if not found. */
  findRoleById(id: string): Promise<UserRoleRecord | null>

  /** Create or update a user profile. Returns the full user record. */
  upsert(id: string, create: CreateUserData, update: UpdateUserData): Promise<UserRecord>
}
