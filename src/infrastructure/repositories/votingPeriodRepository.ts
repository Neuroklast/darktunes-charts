/**
 * @module infrastructure/repositories/votingPeriodRepository
 *
 * Prisma-backed repository for VotingPeriod management.
 * Manages the lifecycle of voting periods: open → closed → computing → published.
 */
import type { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface VotingPeriodRecord {
  id: string
  name: string | null
  startDate: Date
  endDate: Date
  isActive: boolean
  status: string
  createdAt: Date
}

export interface CreateVotingPeriodData {
  name?: string
  startDate: Date
  endDate: Date
}

export class VotingPeriodRepository {
  constructor(private readonly db: PrismaClient = prisma as unknown as PrismaClient) {}

  /**
   * Creates a new voting period in OPEN status.
   *
   * @param data - Name, start and end dates for the period.
   * @returns The created voting period record.
   */
  async create(data: CreateVotingPeriodData): Promise<VotingPeriodRecord> {
    return this.db.votingPeriod.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: true,
        status: 'OPEN',
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
        status: true,
        createdAt: true,
      },
    })
  }

  /**
   * Finds the currently active (OPEN) voting period.
   * Returns null if no open period exists.
   *
   * @returns The active voting period, or null.
   */
  async findActive(): Promise<VotingPeriodRecord | null> {
    return this.db.votingPeriod.findFirst({
      where: { status: 'OPEN', isActive: true },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
        status: true,
        createdAt: true,
      },
      orderBy: { startDate: 'desc' },
    })
  }

  /**
   * Finds a voting period by its UUID.
   *
   * @param id - The voting period UUID.
   * @returns The voting period, or null if not found.
   */
  async findById(id: string): Promise<VotingPeriodRecord | null> {
    return this.db.votingPeriod.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
        status: true,
        createdAt: true,
      },
    })
  }

  /**
   * Returns all voting periods ordered by start date descending.
   *
   * @returns Array of all voting period records.
   */
  async findAll(): Promise<VotingPeriodRecord[]> {
    return this.db.votingPeriod.findMany({
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        isActive: true,
        status: true,
        createdAt: true,
      },
      orderBy: { startDate: 'desc' },
    })
  }

  /**
   * Closes an active voting period.
   * Transitions status from OPEN → CLOSED and marks isActive = false.
   *
   * @param id - The voting period UUID to close.
   */
  async close(id: string): Promise<void> {
    await this.db.votingPeriod.update({
      where: { id },
      data: { status: 'CLOSED', isActive: false },
    })
  }

  /**
   * Transitions a closed period to COMPUTING status.
   * Called before running chart computation.
   *
   * @param id - The voting period UUID.
   */
  async startComputing(id: string): Promise<void> {
    await this.db.votingPeriod.update({
      where: { id },
      data: { status: 'COMPUTING' },
    })
  }

  /**
   * Publishes computed chart results.
   * Transitions status from COMPUTING → PUBLISHED.
   *
   * @param id - The voting period UUID to publish.
   */
  async publish(id: string): Promise<void> {
    await this.db.votingPeriod.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    })
  }
}

export const votingPeriodRepository = new VotingPeriodRepository()
