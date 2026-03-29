import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ACHIEVEMENT_DEFINITIONS } from '@/domain/achievements/index'
import { requireAuth, withCORS } from '@/lib/auth/rbac'

/** Shape of a UserAchievement record returned by Prisma (subset we use). */
interface EarnedRecord {
  grantedAt: Date
  metadata: unknown
  achievement: { slug: string }
}

/**
 * GET /api/achievements
 *
 * Returns all achievement definitions merged with the authenticated user's earned status.
 *
 * Security:
 * - Requires authentication
 * - IDOR protection: Only returns achievements for the authenticated user
 * - The userId query parameter is validated against the session
 */
export async function GET(req: Request) {
  // Require authentication and validate user
  const authResult = await requireAuth()
  if (!authResult.success) {
    return authResult.response
  }

  const { searchParams } = new URL(req.url)
  const requestedUserId = searchParams.get('userId')

  // IDOR Protection: Validate that the requested userId matches the authenticated user
  if (requestedUserId && requestedUserId !== authResult.user.id) {
    return NextResponse.json(
      { error: 'Forbidden - You can only access your own achievements' },
      { status: 403 }
    )
  }

  // Use the authenticated user's ID (not the query param)
  const userId = authResult.user.id

  const earned = await prisma.userAchievement.findMany({
    where: { userId },
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

  return withCORS(NextResponse.json({ achievements: all }))
}
