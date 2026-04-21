import { NextResponse } from 'next/server'
import { evaluateAchievements } from '@/domain/achievements/engine'
import type { FanAchievementContext } from '@/domain/achievements/engine'
import { prisma } from '@/lib/prisma'

type AchievementDb = {
  user: {
    findMany: (args: unknown) => Promise<Array<{
      id: string
      createdAt: Date
      fanVotes: Array<{ id: string; categoryId: string | null }>
    }>>
  }
  userAchievement: {
    findMany: (args: unknown) => Promise<Array<{ achievementId: string }>>
    createMany: (args: unknown) => Promise<{ count: number }>
  }
  achievementDefinition: {
    findMany: (args: unknown) => Promise<Array<{ id: string; slug: string }>>
  }
}

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30


 *
 * Vercel Cron Job that evaluates pending achievement grants for all users.
 * Secured by CRON_SECRET — must be called with `Authorization: Bearer <CRON_SECRET>`.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = prisma as unknown as AchievementDb

  // Load achievement slug → id mapping once
  const achievementDefs = await db.achievementDefinition.findMany({
    select: { id: true, slug: true },
  })
  const slugToId = new Map(achievementDefs.map((a) => [a.slug, a.id]))

  const users = await db.user.findMany({
    where: { role: 'FAN' } as unknown as never,
    include: {
      fanVotes: { select: { id: true, categoryId: true } },
    },
    take: 500,
  })

  let totalGranted = 0

  for (const u of users) {
    const earned = await db.userAchievement.findMany({
      where: { userId: u.id },
      select: { achievementId: true },
    })
    const grantedIds = new Set(earned.map((e) => e.achievementId))

    const accountAgeMonths = Math.floor(
      (Date.now() - u.createdAt.getTime()) / MS_PER_MONTH,
    )
    const totalCycles = Math.floor(u.fanVotes.length / 5)
    const subGenres = new Set(u.fanVotes.map((v) => v.categoryId).filter(Boolean)).size

    const context: FanAchievementContext = {
      userId: u.id,
      role: 'FAN',
      anomalyPassed: true,
      totalVotingCycles: totalCycles,
      cyclesWithoutBotFlag: totalCycles,
      subGenresThisCycle: subGenres,
      budgetFullOnSingleTrack: false,
      votedTop20Before: [],
      alpha1stVotesOnTop1: false,
      predictiveCorrelation: 0.0,
      loyaltyStreakMonths: Math.min(accountAgeMonths, totalCycles),
      eventsRatedThisMonth: 0,
      profileCompletenessPercent: 60,
      streamingPlatformsLinked: 0,
      tracksUnder1kListeners: 0,
      highValidationVoteRatio: 0.5,
      primaryRegionVoteRatio: 0.7,
      countriesVotedThisCycle: 1,
      accountAgeMonths,
    }

    const result = evaluateAchievements(context, grantedIds)

    const toGrant = result.toGrant
      .map((slug) => slugToId.get(slug))
      .filter((id): id is string => id !== undefined)

    if (toGrant.length > 0) {
      await db.userAchievement.createMany({
        data: toGrant.map((achievementId) => ({
          userId: u.id,
          achievementId,
          grantedAt: new Date(),
        })),
        skipDuplicates: true,
      })
      totalGranted += toGrant.length
    }
  }

  return NextResponse.json({ granted: totalGranted, usersProcessed: users.length })
}
