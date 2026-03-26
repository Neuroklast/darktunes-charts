import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ACHIEVEMENT_DEFINITIONS } from '@/domain/achievements/index'

/** Shape of a UserAchievement record returned by Prisma (subset we use). */
interface EarnedRecord {
  grantedAt: Date
  metadata: unknown
  achievement: { slug: string }
}

/**
 * GET /api/achievements
 *
 * Returns all achievement definitions merged with the user's earned status.
 * Unauthenticated — userId is passed as a query param (validated server-side
 * against the session in the calling page before this route is hit).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

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

  return NextResponse.json({ achievements: all })
}
