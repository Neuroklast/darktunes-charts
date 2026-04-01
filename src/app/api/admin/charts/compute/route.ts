import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/infrastructure/security/rbac'
import { prisma } from '@/lib/prisma'
import { computeAllCharts } from '@/domain/charts/computation'
import { chartRepository } from '@/infrastructure/repositories/chartRepository'
import { votingPeriodRepository } from '@/infrastructure/repositories/votingPeriodRepository'
import { createAuditLog } from '@/infrastructure/audit'
import type { FanVoteInput, DJBallotInput, ReleaseInput } from '@/domain/charts/computation'

const computeSchema = z.object({
  votingPeriodId: z.string().uuid(),
})

/**
 * POST /api/admin/charts/compute
 *
 * Triggers chart computation for a voting period.
 * Fetches all votes and ballots, runs the 2-pillar computation engine,
 * and saves results to the ChartResult table.
 *
 * Admin only.
 *
 * Body: { votingPeriodId }
 * Returns: { success, categoriesComputed, votingPeriodId }
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const body: unknown = await request.json()
      const parsed = computeSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: parsed.error.flatten() },
          { status: 400 },
        )
      }

      const { votingPeriodId } = parsed.data

      // Verify the period exists
      const period = await votingPeriodRepository.findById(votingPeriodId)
      if (!period) {
        return NextResponse.json({ error: 'Voting period not found' }, { status: 404 })
      }

      // Transition to COMPUTING status
      await votingPeriodRepository.startComputing(votingPeriodId)

      try {
        // Fetch all fan votes for this period (with releaseId and categoryId)
        const rawFanVotes = await (prisma as unknown as {
          fanVote: {
            findMany: (args: unknown) => Promise<Array<{
              userId: string
              releaseId: string | null
              categoryId: string | null
              votes: number
              creditsSpent: number
              createdAt: Date
            }>>
          }
        }).fanVote.findMany({
          where: {
            periodId: votingPeriodId,
            releaseId: { not: null },
            categoryId: { not: null },
          },
          select: {
            userId: true,
            releaseId: true,
            categoryId: true,
            votes: true,
            creditsSpent: true,
            createdAt: true,
          },
        })

        // Fetch all DJ ballots for this period
        const rawDjBallots = await (prisma as unknown as {
          djBallot: {
            findMany: (args: unknown) => Promise<Array<{
              userId: string
              categoryId: string | null
              rankings: unknown
              createdAt: Date
            }>>
          }
        }).djBallot.findMany({
          where: {
            periodId: votingPeriodId,
            categoryId: { not: null },
          },
          select: {
            userId: true,
            categoryId: true,
            rankings: true,
            createdAt: true,
          },
        })

        // Collect all unique release IDs
        const releaseIds = new Set<string>([
          ...rawFanVotes.map((v) => v.releaseId).filter((id): id is string => !!id),
          ...rawDjBallots
            .flatMap((b) => (Array.isArray(b.rankings) ? (b.rankings as string[]) : []))
        ])

        // Fetch release metadata
        const rawReleases = await (prisma as unknown as {
          release: {
            findMany: (args: unknown) => Promise<Array<{
              id: string
              title: string
              releaseDate: Date
              band: { name: string } | null
            }>>
          }
        }).release.findMany({
          where: { id: { in: Array.from(releaseIds) } },
          select: {
            id: true,
            title: true,
            releaseDate: true,
            band: { select: { name: true } },
          },
        })

        // Build typed inputs
        const fanVotesByCategory = new Map<string, FanVoteInput[]>()
        for (const v of rawFanVotes) {
          if (!v.releaseId || !v.categoryId) continue
          const list = fanVotesByCategory.get(v.categoryId) ?? []
          list.push({
            userId: v.userId,
            releaseId: v.releaseId,
            votes: v.votes,
            creditsSpent: v.creditsSpent,
            createdAt: v.createdAt,
          })
          fanVotesByCategory.set(v.categoryId, list)
        }

        const djBallotsByCategory = new Map<string, DJBallotInput[]>()
        for (const b of rawDjBallots) {
          if (!b.categoryId || !Array.isArray(b.rankings)) continue
          const list = djBallotsByCategory.get(b.categoryId) ?? []
          list.push({
            djId: b.userId,
            rankings: b.rankings as string[],
            createdAt: b.createdAt,
          })
          djBallotsByCategory.set(b.categoryId, list)
        }

        const releases: ReleaseInput[] = rawReleases.map((r) => ({
          id: r.id,
          title: r.title,
          releaseDate: r.releaseDate,
          bandName: r.band?.name ?? '',
        }))

        // Run computation for all categories
        const allResults = computeAllCharts(
          votingPeriodId,
          fanVotesByCategory,
          djBallotsByCategory,
          releases,
          period.endDate,
        )

        // Persist chart results
        for (const categoryResult of allResults) {
          if (categoryResult.entries.length === 0) continue

          await chartRepository.saveChartResults(
            categoryResult.entries.map((entry) => ({
              votingPeriodId,
              categoryId: categoryResult.categoryId,
              releaseId: entry.releaseId,
              rank: entry.rank,
              fanScore: entry.scores.fanScore,
              djScore: entry.scores.djScore,
              combinedScore: entry.scores.combined,
              appliedFanWeight: entry.scores.appliedWeights.fan,
              appliedDjWeight: entry.scores.appliedWeights.dj,
              totalFanVotes: entry.metadata.totalFanVotes,
              totalDJBallots: entry.metadata.totalDJBallots,
              quorumMet: entry.metadata.quorumMet,
            })),
          )
        }

        const categoriesComputed = allResults.filter((r) => r.entries.length > 0).length

        await createAuditLog(
          'chart_computed',
          'VotingPeriod',
          votingPeriodId,
          user.id,
          { categoriesComputed, totalCategories: allResults.length },
        )

        return NextResponse.json({
          success: true,
          votingPeriodId,
          categoriesComputed,
          totalCategories: allResults.length,
        })
      } catch (computeError) {
        // Revert to CLOSED status on error
        await (prisma as unknown as {
          votingPeriod: { update: (args: unknown) => Promise<unknown> }
        }).votingPeriod.update({
          where: { id: votingPeriodId },
          data: { status: 'CLOSED' },
        })
        throw computeError
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
