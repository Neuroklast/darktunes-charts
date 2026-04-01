/**
 * @module infrastructure/repositories/chartRepository
 *
 * Prisma-backed repository for chart results.
 * Stores and retrieves computed chart rankings with full transparency metadata.
 */
import type { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface ChartResultData {
  votingPeriodId: string
  categoryId: string
  releaseId: string
  rank: number
  fanScore: number
  djScore: number
  combinedScore: number
  appliedFanWeight: number
  appliedDjWeight: number
  totalFanVotes: number
  totalDJBallots: number
  quorumMet: boolean
}

export interface ChartResultRecord extends ChartResultData {
  id: string
  createdAt: Date
  release?: {
    id: string
    title: string
    band: { id: string; name: string; slug: string | null } | null
  } | null
}

const CHART_RESULT_SELECT = {
  id: true,
  votingPeriodId: true,
  categoryId: true,
  releaseId: true,
  rank: true,
  fanScore: true,
  djScore: true,
  combinedScore: true,
  appliedFanWeight: true,
  appliedDjWeight: true,
  totalFanVotes: true,
  totalDJBallots: true,
  quorumMet: true,
  createdAt: true,
} as const

const CHART_RESULT_SELECT_WITH_RELEASE = {
  ...CHART_RESULT_SELECT,
  release: {
    select: {
      id: true,
      title: true,
      band: { select: { id: true, name: true, slug: true } },
    },
  },
} as const

export class ChartRepository {
  constructor(private readonly db: PrismaClient = prisma as unknown as PrismaClient) {}

  /**
   * Saves chart results for a category/period.
   * Upserts to allow recomputation: if a result already exists for the same
   * votingPeriodId + categoryId + releaseId, it is updated.
   *
   * @param results - Array of chart result data to persist.
   */
  async saveChartResults(results: ChartResultData[]): Promise<void> {
    await this.db.$transaction(
      results.map((r) =>
        this.db.chartResult.upsert({
          where: {
            votingPeriodId_categoryId_releaseId: {
              votingPeriodId: r.votingPeriodId,
              categoryId: r.categoryId,
              releaseId: r.releaseId,
            },
          },
          create: r,
          update: {
            rank: r.rank,
            fanScore: r.fanScore,
            djScore: r.djScore,
            combinedScore: r.combinedScore,
            appliedFanWeight: r.appliedFanWeight,
            appliedDjWeight: r.appliedDjWeight,
            totalFanVotes: r.totalFanVotes,
            totalDJBallots: r.totalDJBallots,
            quorumMet: r.quorumMet,
          },
        }),
      ),
    )
  }

  /**
   * Returns all chart results for a voting period.
   *
   * @param votingPeriodId - The voting period UUID.
   * @returns Array of chart results grouped by category.
   */
  async getChartsByPeriod(votingPeriodId: string): Promise<ChartResultRecord[]> {
    return this.db.chartResult.findMany({
      where: { votingPeriodId },
      select: CHART_RESULT_SELECT_WITH_RELEASE,
      orderBy: [{ categoryId: 'asc' }, { rank: 'asc' }],
    })
  }

  /**
   * Returns chart results for a specific category in a voting period.
   *
   * @param votingPeriodId - The voting period UUID (uses latest published if not specified).
   * @param categoryId     - The chart category slug.
   * @returns Ranked chart results for the category.
   */
  async getChartsByCategory(
    categoryId: string,
    votingPeriodId?: string,
  ): Promise<ChartResultRecord[]> {
    const where = votingPeriodId
      ? { categoryId, votingPeriodId }
      : {
          categoryId,
          votingPeriod: { status: 'PUBLISHED' },
        }

    return this.db.chartResult.findMany({
      where,
      select: CHART_RESULT_SELECT_WITH_RELEASE,
      orderBy: { rank: 'asc' },
    })
  }

  /**
   * Returns the latest published chart period ID.
   * Used when no explicit period is requested.
   *
   * @returns The UUID of the latest published voting period, or null.
   */
  async getLatestPublishedPeriodId(): Promise<string | null> {
    const period = await this.db.votingPeriod.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { endDate: 'desc' },
      select: { id: true },
    })
    return period?.id ?? null
  }
}

export const chartRepository = new ChartRepository()
