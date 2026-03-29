import { describe, it, expect } from 'vitest'
import { InMemoryUserRepository } from '@/infrastructure/repositories/InMemoryUserRepository'
import { InMemoryBandRepository } from '@/infrastructure/repositories/InMemoryBandRepository'
import { InMemoryAchievementRepository } from '@/infrastructure/repositories/InMemoryAchievementRepository'
import type { UserRecord } from '@/domain/repositories'

// ---------------------------------------------------------------------------
// InMemoryUserRepository
// ---------------------------------------------------------------------------

describe('InMemoryUserRepository', () => {
  const sampleUser: UserRecord = {
    id: 'user-1',
    role: 'FAN',
    name: 'Test Fan',
    email: 'fan@test.com',
    credits: 100,
    avatarUrl: null,
    isDJVerified: false,
    createdAt: new Date('2026-01-01'),
    band: null,
  }

  it('findById returns null when user does not exist', async () => {
    const repo = new InMemoryUserRepository()
    expect(await repo.findById('nonexistent')).toBeNull()
  })

  it('findById returns seeded user', async () => {
    const repo = new InMemoryUserRepository()
    repo.seed(sampleUser)
    const result = await repo.findById('user-1')
    expect(result).toEqual(sampleUser)
  })

  it('findRoleById returns null for missing user', async () => {
    const repo = new InMemoryUserRepository()
    expect(await repo.findRoleById('missing')).toBeNull()
  })

  it('findRoleById returns role for seeded user', async () => {
    const repo = new InMemoryUserRepository()
    repo.seed(sampleUser)
    const result = await repo.findRoleById('user-1')
    expect(result).toEqual({ role: 'FAN' })
  })

  it('upsert creates a new user when none exists', async () => {
    const repo = new InMemoryUserRepository()
    const result = await repo.upsert(
      'user-2',
      { id: 'user-2', email: 'new@test.com', name: 'New User', role: 'BAND', avatarUrl: null, credits: 100 },
      { name: 'Updated Name', role: 'BAND', avatarUrl: null },
    )
    expect(result.id).toBe('user-2')
    expect(result.name).toBe('New User')
    expect(result.role).toBe('BAND')
  })

  it('upsert updates existing user', async () => {
    const repo = new InMemoryUserRepository()
    repo.seed(sampleUser)
    const result = await repo.upsert(
      'user-1',
      { id: 'user-1', email: 'fan@test.com', name: 'New Name', role: 'DJ', avatarUrl: 'url', credits: 100 },
      { name: 'Updated Name', role: 'DJ', avatarUrl: 'url' },
    )
    expect(result.name).toBe('Updated Name')
    expect(result.role).toBe('DJ')
    expect(result.avatarUrl).toBe('url')
  })
})

// ---------------------------------------------------------------------------
// InMemoryBandRepository
// ---------------------------------------------------------------------------

describe('InMemoryBandRepository', () => {
  it('upsertByOwnerId creates a new band', async () => {
    const repo = new InMemoryBandRepository()
    await repo.upsertByOwnerId(
      'owner-1',
      { ownerId: 'owner-1', name: 'Dark Band', genre: 'GOTH', tier: 'MICRO' },
      { name: 'Updated' },
    )
    expect(repo.getByOwnerId('owner-1')).toEqual({
      ownerId: 'owner-1',
      name: 'Dark Band',
      genre: 'GOTH',
      tier: 'MICRO',
    })
  })

  it('upsertByOwnerId updates an existing band', async () => {
    const repo = new InMemoryBandRepository()
    await repo.upsertByOwnerId(
      'owner-1',
      { ownerId: 'owner-1', name: 'Original', genre: 'GOTH', tier: 'MICRO' },
      { name: 'Original' },
    )
    await repo.upsertByOwnerId(
      'owner-1',
      { ownerId: 'owner-1', name: 'Ignored', genre: 'METAL', tier: 'EMERGING' },
      { name: 'Updated Name' },
    )
    expect(repo.getByOwnerId('owner-1')?.name).toBe('Updated Name')
    // Genre and tier should not change on update
    expect(repo.getByOwnerId('owner-1')?.genre).toBe('GOTH')
  })

  it('getByOwnerId returns undefined for missing owner', () => {
    const repo = new InMemoryBandRepository()
    expect(repo.getByOwnerId('nonexistent')).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// InMemoryAchievementRepository
// ---------------------------------------------------------------------------

describe('InMemoryAchievementRepository', () => {
  it('findEarnedByUserId returns empty array when no achievements', async () => {
    const repo = new InMemoryAchievementRepository()
    const result = await repo.findEarnedByUserId('user-1')
    expect(result).toEqual([])
  })

  it('findEarnedByUserId returns seeded achievements', async () => {
    const repo = new InMemoryAchievementRepository()
    const record = {
      grantedAt: new Date('2026-03-01'),
      metadata: { score: 42 },
      achievement: { slug: 'founding_fan' },
    }
    repo.seed('user-1', [record])

    const result = await repo.findEarnedByUserId('user-1')
    expect(result).toEqual([record])
  })

  it('does not return achievements for other users', async () => {
    const repo = new InMemoryAchievementRepository()
    repo.seed('user-1', [{ grantedAt: new Date(), metadata: null, achievement: { slug: 'test' } }])
    expect(await repo.findEarnedByUserId('user-2')).toEqual([])
  })
})
