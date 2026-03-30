import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ACHIEVEMENT_DEFINITIONS } from '@/domain/achievements/index'
import type { IAchievementRepository, EarnedAchievementRecord } from '@/domain/repositories'
import { PrismaAchievementRepository } from '@/infrastructure/repositories'

/** Default repository instance — overridable in tests via `createAchievementsHandler`. */
const defaultRepo: IAchievementRepository = new PrismaAchievementRepository(prisma)

/**
 * GET /api/achievements
 *
 * Returns all achievement definitions merged with the user's earned status.
 * Unauthenticated — userId is passed as a query param (validated server-side
 * against the session in the calling page before this route is hit).
 */
export async function GET(req: Request) {
  return createAchievementsHandler(defaultRepo)(req)
}

/**
 * Factory that creates the GET handler with an injected repository.
 * Enables unit testing without Prisma by passing an in-memory repo.
 */
function createAchievementsHandler(repo: IAchievementRepository) {
  return async function handler(req: Request) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const earned = await repo.findEarnedByUserId(userId)
    const earnedSlugs = new Set(earned.map((e: EarnedAchievementRecord) => e.achievement.slug))

    const all = ACHIEVEMENT_DEFINITIONS.map((def) => {
      const record = earned.find((e: EarnedAchievementRecord) => e.achievement.slug === def.slug)
      return {
        slug: def.slug,
        pillar: def.pillar,
        rarity: def.rarity,
        iconKey: def.iconKey,
        titleDe: def.titleDe,
        titleEn: def.titleEn,
        descDe: def.descDe,
        descEn: def.descEn,
        earned: earnedSlugs.has(def.slug),
        grantedAt: record?.grantedAt ?? null,
        metadata: record?.metadata ?? null,
      }
    })

    return NextResponse.json({ achievements: all })
  }
}
