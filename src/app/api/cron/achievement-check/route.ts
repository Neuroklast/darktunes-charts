import { NextResponse } from 'next/server'
import { evaluateAchievements } from '@/domain/achievements/engine'
import type { FanAchievementContext } from '@/domain/achievements/engine'

/**
 * POST /api/cron/achievement-check
 *
 * Vercel Cron Job that evaluates pending achievement grants for all users.
 * Secured by CRON_SECRET — must be called with `Authorization: Bearer <CRON_SECRET>`.
 *
 * In production:
 *   1. Fetch all users from the DB
 *   2. Build their context from vote/event/profile data
 *   3. Call evaluateAchievements for each user
 *   4. Write new grants via prisma.userAchievement.createMany(...)
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Demo context — in production this is built per-user from DB queries
  const demoContext: FanAchievementContext = {
    userId: 'demo-user',
    role: 'FAN',
    anomalyPassed: true,
    totalVotingCycles: 3,
    cyclesWithoutBotFlag: 3,
    subGenresThisCycle: 2,
    budgetFullOnSingleTrack: false,
    votedTop20Before: [],
    alpha1stVotesOnTop1: false,
    predictiveCorrelation: 0.4,
    loyaltyStreakMonths: 3,
    eventsRatedThisMonth: 1,
    profileCompletenessPercent: 80,
    streamingPlatformsLinked: 1,
    tracksUnder1kListeners: 0,
    highValidationVoteRatio: 0.5,
    primaryRegionVoteRatio: 0.8,
    countriesVotedThisCycle: 1,
    accountAgeMonths: 6,
  }

  // Pass empty set — demo user has no previously granted achievements
  const result = evaluateAchievements(demoContext, new Set<string>())

  // TODO: prisma.userAchievement.createMany({
  //   data: result.toGrant.map(slug => ({ userId: demoContext.userId, achievementSlug: slug, grantedAt: new Date() })),
  //   skipDuplicates: true,
  // })

  return NextResponse.json({ granted: result.toGrant.length, skipped: result.skipped.length })
}
