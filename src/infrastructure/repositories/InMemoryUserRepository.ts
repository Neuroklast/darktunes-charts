/**
 * @module infrastructure/repositories/InMemoryUserRepository
 *
 * In-memory implementation of {@link IUserRepository} for testing.
 */
import type { IUserRepository, UserRecord, UserRoleRecord, CreateUserData, UpdateUserData } from '@/domain/repositories'

export class InMemoryUserRepository implements IUserRepository {
  private readonly users = new Map<string, UserRecord>()

  async findById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) ?? null
  }

  async findRoleById(id: string): Promise<UserRoleRecord | null> {
    const user = this.users.get(id)
    if (!user) return null
    return { role: user.role }
  }

  async upsert(id: string, create: CreateUserData, update: UpdateUserData): Promise<UserRecord> {
    const existing = this.users.get(id)
    if (existing) {
      const updated: UserRecord = { ...existing, name: update.name, role: update.role, avatarUrl: update.avatarUrl }
      this.users.set(id, updated)
      return updated
    }
    const newUser: UserRecord = {
      id: create.id,
      email: create.email,
      name: create.name,
      role: create.role,
      credits: create.credits,
      avatarUrl: create.avatarUrl,
      isDJVerified: false,
      createdAt: new Date(),
      band: null,
    }
    this.users.set(id, newUser)
    return newUser
  }

  /** Seed a user directly (test helper). */
  seed(user: UserRecord): void {
    this.users.set(user.id, user)
  }
}
