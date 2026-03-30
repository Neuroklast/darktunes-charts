/**
 * @module infrastructure/repositories/PrismaUserRepository
 *
 * Prisma-backed implementation of {@link IUserRepository}.
 */
import type { PrismaClient } from '@prisma/client'
import type { IUserRepository, UserRecord, UserRoleRecord, CreateUserData, UpdateUserData } from '@/domain/repositories'

const USER_SELECT = {
  id: true,
  role: true,
  name: true,
  email: true,
  credits: true,
  avatarUrl: true,
  isDJVerified: true,
  createdAt: true,
  band: { select: { id: true } },
} as const

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    })
    return row as UserRecord | null
  }

  async findRoleById(id: string): Promise<UserRoleRecord | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true },
    })
    return row as UserRoleRecord | null
  }

  async upsert(id: string, create: CreateUserData, update: UpdateUserData): Promise<UserRecord> {
    const row = await this.prisma.user.upsert({
      where: { id },
      create: {
        id: create.id,
        email: create.email,
        name: create.name,
        role: create.role as never,
        avatarUrl: create.avatarUrl,
        credits: create.credits,
      },
      update: {
        name: update.name,
        role: update.role as never,
        avatarUrl: update.avatarUrl,
      },
      select: USER_SELECT,
    })
    return row as UserRecord
  }
}
