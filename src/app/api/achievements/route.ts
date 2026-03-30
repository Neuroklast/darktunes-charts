import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { ACHIEVEMENT_DEFINITIONS } from '@/domain/achievements/index'
import type { IAchievementRepository, EarnedAchievementRecord, IUserRepository } from '@/domain/repositories'
import { PrismaAchievementRepository, PrismaUserRepository } from '@/infrastructure/repositories'

/** Default repository instance — overridable in tests via `createAchievementsHandler`. */
const defaultRepo: IAchievementRepository = new PrismaAchievementRepository(prisma)
const defaultUserRepo: IUserRepository = new PrismaUserRepository(prisma)

/**
 * GET /api/achievements
 *
 * Returns all achievement definitions merged with the user's earned status.
 * Requires authentication. Users can only view their own achievements.
 * Admin users may pass a `userId` query param to view another user's achievements.
 *
 * Access control:
 *   - Authenticated users: own achievements only
 *   - ADMIN role: may query any user via `userId` param
 */
export async function GET(req: NextRequest) {
  return createAchievementsHandler(defaultRepo, defaultUserRepo)(req)
}

/**
 * Factory that creates the GET handler with injected repositories.
 * Enables unit testing without Prisma by passing in-memory repos.
 */
function createAchievementsHandler(repo: IAchievementRepository, userRepo: IUserRepository) {
  return async function handler(req: NextRequest) {
    try {
      const supabase = await createClient()
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const { searchParams } = new URL(req.url)
      const requestedUserId = searchParams.get('userId')

      // Resolve target user: own data by default, admin can query any user
      const isRequestingOtherUser = requestedUserId && requestedUserId !== authUser.id
      if (isRequestingOtherUser) {
        const dbUser = await userRepo.findRoleById(authUser.id)
        if (!dbUser || dbUser.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
      const targetUserId = isRequestingOtherUser ? requestedUserId : authUser.id

      const earned = await repo.findEarnedByUserId(targetUserId)
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
}
