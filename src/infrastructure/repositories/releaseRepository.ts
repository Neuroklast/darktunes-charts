/**
 * @module infrastructure/repositories/releaseRepository
 *
 * Prisma-backed repository for Release entities.
 * Provides CRUD operations and domain-specific queries for music releases.
 */
import type { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export interface CreateReleaseData {
  bandId: string
  title: string
  type: 'ALBUM' | 'EP' | 'SINGLE'
  releaseDate: Date
  trackCount: number
  genres: string[]
  coverArtUrl?: string
}

export interface ReleaseRecord {
  id: string
  bandId: string
  title: string
  type: string
  releaseDate: Date
  trackCount: number
  genres: string[]
  coverArtUrl: string | null
  createdAt: Date
  band?: { id: string; name: string; slug: string | null } | null
}

const RELEASE_SELECT = {
  id: true,
  bandId: true,
  title: true,
  type: true,
  releaseDate: true,
  trackCount: true,
  genres: true,
  coverArtUrl: true,
  createdAt: true,
} as const

const RELEASE_SELECT_WITH_BAND = {
  ...RELEASE_SELECT,
  band: {
    select: { id: true, name: true, slug: true },
  },
} as const

export class ReleaseRepository {
  constructor(private readonly db: PrismaClient = prisma as unknown as PrismaClient) {}

  /**
   * Creates a new release record.
   *
   * @param data - The release data to persist.
   * @returns The created release record.
   */
  async create(data: CreateReleaseData): Promise<ReleaseRecord> {
    return this.db.release.create({
      data: {
        bandId: data.bandId,
        title: data.title,
        type: data.type,
        releaseDate: data.releaseDate,
        trackCount: data.trackCount,
        genres: data.genres,
        coverArtUrl: data.coverArtUrl,
      },
      select: RELEASE_SELECT,
    })
  }

  /**
   * Finds a release by its unique ID.
   *
   * @param id - The release UUID.
   * @returns The release, or null if not found.
   */
  async findById(id: string): Promise<ReleaseRecord | null> {
    return this.db.release.findUnique({
      where: { id },
      select: RELEASE_SELECT_WITH_BAND,
    })
  }

  /**
   * Returns all releases for a given band.
   *
   * @param bandId - The band UUID.
   * @returns Array of release records.
   */
  async findByBand(bandId: string): Promise<ReleaseRecord[]> {
    return this.db.release.findMany({
      where: { bandId },
      select: RELEASE_SELECT,
      orderBy: { releaseDate: 'desc' },
    })
  }

  /**
   * Returns releases submitted to a specific chart category.
   *
   * @param categoryId - The category slug (e.g. 'track', 'album').
   * @returns Array of release records with band info.
   */
  async findByCategory(categoryId: string): Promise<ReleaseRecord[]> {
    return this.db.release.findMany({
      where: {
        categorySubmissions: {
          some: { categoryId },
        },
      },
      select: RELEASE_SELECT_WITH_BAND,
      orderBy: { releaseDate: 'desc' },
    })
  }

  /**
   * Returns releases within a date range.
   *
   * @param from - Start date (inclusive).
   * @param to   - End date (inclusive).
   * @returns Array of releases in the specified range.
   */
  async findByDateRange(from: Date, to: Date): Promise<ReleaseRecord[]> {
    return this.db.release.findMany({
      where: {
        releaseDate: { gte: from, lte: to },
      },
      select: RELEASE_SELECT_WITH_BAND,
      orderBy: { releaseDate: 'desc' },
    })
  }
}

export const releaseRepository = new ReleaseRepository()
