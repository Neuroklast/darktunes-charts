import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ACHIEVEMENT_DEFINITIONS } from '@/domain/achievements/index'
import { withAuth, type AuthenticatedUser } from '@/infrastructure/security/rbac'

/** Shape of a UserAchievement record returned by Prisma (subset we use). */
interface EarnedRecord {
  grantedAt: Date
  metadata: unknown
  achievement: { slug: string }
}

/**
 * GET /api/achievements
 *
 * Returns all achievement definitions merged with the authenticated user's
 * earned status. The userId is extracted from the session — never from
 * query parameters — to prevent IDOR attacks (OWASP A01:2021).
 *
 * Admins may optionally pass `?userId=xxx` to view another user's achievements.
 */
export const GET = withAuth([], async (req: NextRequest, user: AuthenticatedUser) => {
  const requestedUserId = new URL(req.url).searchParams.get('userId')

  // Non-admin users can only view their own achievements
  const targetUserId = (user.role === 'admin' && requestedUserId)
    ? requestedUserId
    : user.id

  const earned = await prisma.userAchievement.findMany({
    where: { userId: targetUserId },
    include: { achievement: true },
  }) as EarnedRecord[]

  const earnedSlugs = new Set(earned.map((e: EarnedRecord) => e.achievement.slug))

  const all = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const record = earned.find((e: EarnedRecord) => e.achievement.slug === def.slug)
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
})
