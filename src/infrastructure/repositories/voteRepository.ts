/**
 * @module infrastructure/repositories/voteRepository
 *
 * Prisma-backed repository for fan votes and DJ ballots.
 * Enforces quadratic credit budget per voting period.
 */
import type { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { MONTHLY_CREDIT_BUDGET } from '@/domain/voting/quadratic'

export interface CreateFanVoteData {
  userId: string
  releaseId: string
  categoryId: string
  periodId: string
  votes: number
  creditsSpent: number
}

export interface FanVoteRecord {
  id: string
  userId: string
  releaseId: string | null
  categoryId: string | null
  periodId: string
  votes: number
  creditsSpent: number
  createdAt: Date
}

export interface CreateDJBallotData {
  userId: string
  categoryId: string
  periodId: string
  rankings: string[]
}

export interface DJBallotRecord {
  id: string
  userId: string
  categoryId: string | null
  periodId: string
  rankings: unknown
  createdAt: Date
}

export class VoteRepository {
  constructor(private readonly db: PrismaClient = prisma as unknown as PrismaClient) {}

  /**
   * Creates a fan vote for a release in a specific category.
   * Caller must ensure credits budget is not exceeded (use getRemainingCredits first).
   *
   * @param data - Fan vote data including releaseId, categoryId, votes and credits cost.
   * @returns The created fan vote record.
   */
  async createFanVote(data: CreateFanVoteData): Promise<FanVoteRecord> {
    return this.db.fanVote.create({
      data: {
        userId: data.userId,
        releaseId: data.releaseId,
        categoryId: data.categoryId,
        periodId: data.periodId,
        votes: data.votes,
        credits: data.creditsSpent,
        creditsSpent: data.creditsSpent,
        weight: 1.0,
      },
      select: {
        id: true,
        userId: true,
        releaseId: true,
        categoryId: true,
        periodId: true,
        votes: true,
        creditsSpent: true,
        createdAt: true,
      },
    })
  }

  /**
   * Returns all fan votes for a user in a specific voting period.
   *
   * @param userId   - The user's UUID.
   * @param periodId - The voting period UUID.
   * @returns Array of fan vote records.
   */
  async getUserVotesForPeriod(userId: string, periodId: string): Promise<FanVoteRecord[]> {
    return this.db.fanVote.findMany({
      where: { userId, periodId, releaseId: { not: null } },
      select: {
        id: true,
        userId: true,
        releaseId: true,
        categoryId: true,
        periodId: true,
        votes: true,
        creditsSpent: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Calculates remaining credit budget for a user in a voting period.
   *
   * Credits spent = sum of all creditsSpent values for the user in the period.
   * Budget = MONTHLY_CREDIT_BUDGET (150).
   *
   * @param userId   - The user's UUID.
   * @param periodId - The voting period UUID.
   * @returns Remaining credits available for voting.
   */
  async getRemainingCredits(userId: string, periodId: string): Promise<number> {
    const result = await this.db.fanVote.aggregate({
      where: { userId, periodId, releaseId: { not: null } },
      _sum: { creditsSpent: true },
    })
    const spent = result._sum.creditsSpent ?? 0
    return Math.max(0, MONTHLY_CREDIT_BUDGET - spent)
  }

  /**
   * Creates a DJ ballot with an ordered ranking of releases for a category.
   * Enforces one ballot per DJ per category per period.
   *
   * @param data - DJ ballot data with ordered releaseId rankings.
   * @returns The created DJ ballot record.
   * @throws Error if DJ already submitted a ballot for this category in this period.
   */
  async createDJBallot(data: CreateDJBallotData): Promise<DJBallotRecord> {
    const existing = await this.db.dJBallot.findFirst({
      where: {
        userId: data.userId,
        periodId: data.periodId,
        categoryId: data.categoryId,
      },
    })

    if (existing) {
      throw new Error(
        `DJ already submitted a ballot for category "${data.categoryId}" in this period`,
      )
    }

    return this.db.dJBallot.create({
      data: {
        userId: data.userId,
        periodId: data.periodId,
        categoryId: data.categoryId,
        rankings: data.rankings,
      },
      select: {
        id: true,
        userId: true,
        categoryId: true,
        periodId: true,
        rankings: true,
        createdAt: true,
      },
    })
  }

  /**
   * Returns all DJ ballots for a given category in a voting period.
   *
   * @param categoryId - The chart category slug.
   * @param periodId   - The voting period UUID.
   * @returns Array of DJ ballot records.
   */
  async getDJBallotsForCategory(
    categoryId: string,
    periodId: string,
  ): Promise<DJBallotRecord[]> {
    return this.db.dJBallot.findMany({
      where: { categoryId, periodId },
      select: {
        id: true,
        userId: true,
        categoryId: true,
        periodId: true,
        rankings: true,
        createdAt: true,
      },
    })
  }

  /**
   * Returns DJ ballots submitted by a user for the active voting period.
   *
   * @param userId   - The DJ's UUID.
   * @param periodId - The voting period UUID.
   * @returns Array of DJ ballot records.
   */
  async getUserBallotsForPeriod(userId: string, periodId: string): Promise<DJBallotRecord[]> {
    return this.db.dJBallot.findMany({
      where: { userId, periodId, categoryId: { not: null } },
      select: {
        id: true,
        userId: true,
        categoryId: true,
        periodId: true,
        rankings: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const voteRepository = new VoteRepository()
