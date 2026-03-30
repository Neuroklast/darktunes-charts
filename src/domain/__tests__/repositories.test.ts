import { describe, it, expect, beforeEach } from 'vitest'
import {
  InMemoryUserRepository,
  InMemoryBandRepository,
  InMemoryAchievementRepository,
} from '@/infrastructure/repositories'
import type { IUserRepository, IBandRepository, IAchievementRepository } from '@/domain/repositories'

// ---------------------------------------------------------------------------
// IUserRepository
// ---------------------------------------------------------------------------

describe('InMemoryUserRepository', () => {
  let repo: IUserRepository

  beforeEach(() => {
    repo = new InMemoryUserRepository()
  })

  it('returns null for non-existent user', async () => {
    expect(await repo.findById('missing')).toBeNull()
  })

  it('creates a new user via upsert', async () => {
    const user = await repo.upsert({
      id: 'user-1',
      role: 'fan',
      name: 'Alice',
      email: 'alice@example.com',
    })

    expect(user.id).toBe('user-1')
    expect(user.name).toBe('Alice')
    expect(user.credits).toBe(100)
    expect(user.createdAt).toBeInstanceOf(Date)
  })

  it('updates an existing user via upsert without losing credits', async () => {
    await repo.upsert({ id: 'user-1', role: 'fan', name: 'Alice', email: 'a@b.com' })
    const updated = await repo.upsert({ id: 'user-1', role: 'dj', name: 'Alice DJ', email: 'a@b.com' })

    expect(updated.role).toBe('dj')
    expect(updated.name).toBe('Alice DJ')
    expect(updated.credits).toBe(100)
  })

  it('finds a user by ID after creation', async () => {
    await repo.upsert({ id: 'user-1', role: 'band', name: 'Bob', email: 'b@c.com' })
    const found = await repo.findById('user-1')

    expect(found).not.toBeNull()
    expect(found!.name).toBe('Bob')
  })
})

// ---------------------------------------------------------------------------
// IBandRepository
// ---------------------------------------------------------------------------

describe('InMemoryBandRepository', () => {
  let repo: IBandRepository

  beforeEach(() => {
    repo = new InMemoryBandRepository()
  })

  it('returns null for non-existent band', async () => {
    expect(await repo.findById('missing')).toBeNull()
  })

  it('creates a new band via upsert', async () => {
    const band = await repo.upsert({
      name: 'Dark Echo',
      genre: 'GOTH',
      ownerId: 'user-1',
    })

    expect(band.name).toBe('Dark Echo')
    expect(band.genre).toBe('GOTH')
    expect(band.tier).toBe('Micro')
    expect(band.ownerId).toBe('user-1')
  })

  it('updates an existing band via upsert (keyed by owner)', async () => {
    await repo.upsert({ name: 'Dark Echo', genre: 'GOTH', ownerId: 'user-1' })
    const updated = await repo.upsert({ name: 'Dark Echo V2', genre: 'METAL', ownerId: 'user-1' })

    expect(updated.name).toBe('Dark Echo V2')
    expect(updated.genre).toBe('METAL')
  })

  it('finds a band by owner ID', async () => {
    await repo.upsert({ name: 'Shadow Veil', genre: 'DARKWAVE', ownerId: 'user-2' })
    const found = await repo.findByOwnerId('user-2')

    expect(found).not.toBeNull()
    expect(found!.name).toBe('Shadow Veil')
  })

  it('returns null when finding by owner with no bands', async () => {
    expect(await repo.findByOwnerId('ghost')).toBeNull()
  })

  it('findAll returns all bands', async () => {
    await repo.upsert({ name: 'Band A', genre: 'GOTH', ownerId: 'o1' })
    await repo.upsert({ name: 'Band B', genre: 'METAL', ownerId: 'o2', tier: 'Macro' })

    const all = await repo.findAll()
    expect(all).toHaveLength(2)
  })

  it('findAll filters by tier', async () => {
    await repo.upsert({ name: 'Band A', genre: 'GOTH', ownerId: 'o1' })
    await repo.upsert({ name: 'Band B', genre: 'METAL', ownerId: 'o2', tier: 'Macro' })

    const macro = await repo.findAll({ tier: 'Macro' })
    expect(macro).toHaveLength(1)
    expect(macro[0].name).toBe('Band B')
  })
})

// ---------------------------------------------------------------------------
// IAchievementRepository
// ---------------------------------------------------------------------------

describe('InMemoryAchievementRepository', () => {
  let repo: IAchievementRepository

  beforeEach(() => {
    repo = new InMemoryAchievementRepository()
  })

  it('returns empty array for user with no achievements', async () => {
    expect(await repo.findByUserId('user-1')).toEqual([])
  })

  it('grants an achievement', async () => {
    const ach = await repo.grant('user-1', 'early-discoverer', { bandId: 'band-1' })

    expect(ach.slug).toBe('early-discoverer')
    expect(ach.userId).toBe('user-1')
    expect(ach.metadata).toEqual({ bandId: 'band-1' })
    expect(ach.grantedAt).toBeInstanceOf(Date)
  })

  it('finds achievements by user ID', async () => {
    await repo.grant('user-1', 'early-discoverer')
    await repo.grant('user-1', 'scene-veteran')
    await repo.grant('user-2', 'early-discoverer')

    const user1Achs = await repo.findByUserId('user-1')
    expect(user1Achs).toHaveLength(2)
  })

  it('is idempotent — re-granting returns the same record', async () => {
    const first = await repo.grant('user-1', 'early-discoverer')
    const second = await repo.grant('user-1', 'early-discoverer')

    expect(first.id).toBe(second.id)
    expect(await repo.findByUserId('user-1')).toHaveLength(1)
  })
})
