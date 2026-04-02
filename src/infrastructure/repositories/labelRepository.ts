/**
 * @module infrastructure/repositories/labelRepository
 *
 * Repository for Label organisation and roster management.
 * Provides methods for creating labels, managing memberships, and updating band rosters.
 */
import type { PrismaClient } from '@prisma/client'
import type { LabelRecord, LabelMemberRecord } from '@/domain/labels'

type LabelRow = {
  id: string
  name: string
  slug: string
  websiteUrl: string | null
  contactEmail: string | null
  createdAt: Date
  updatedAt: Date
}

type LabelMemberRow = {
  id: string
  labelId: string
  userId: string
  role: string
  createdAt: Date
}

function toRecord(row: LabelRow): LabelRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    websiteUrl: row.websiteUrl,
    contactEmail: row.contactEmail,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function toMemberRecord(row: LabelMemberRow): LabelMemberRecord {
  return {
    id: row.id,
    labelId: row.labelId,
    userId: row.userId,
    role: row.role as 'ADMIN' | 'MEMBER',
    createdAt: row.createdAt,
  }
}

/**
 * Local Prisma type shim.
 *
 * The Prisma client is not generated in this sandbox environment, so
 * `@prisma/client` does not export `PrismaClient` with the model-specific
 * methods. We use a typed cast here (consistent with all other repositories in
 * this codebase) to retain type safety at the API boundary while the generated
 * client is unavailable.
 *
 * In a fully set-up environment (`prisma generate` has been run), replace this
 * with the actual `PrismaClient` type from `@prisma/client`.
 */
type PrismaTyped = {
  label: {
    findUnique: (args: unknown) => Promise<LabelRow | null>
    create: (args: unknown) => Promise<LabelRow>
  }
  labelMember: {
    create: (args: unknown) => Promise<LabelMemberRow>
    findMany: (args: unknown) => Promise<LabelMemberRow[]>
    findFirst: (args: unknown) => Promise<LabelMemberRow | null>
  }
  band: {
    update: (args: unknown) => Promise<{ id: string; labelId: string | null }>
    findMany: (args: unknown) => Promise<Array<{ id: string; name: string; labelId: string | null }>>
  }
}

export class LabelRepository {
  private readonly db: PrismaTyped

  constructor(prisma: PrismaClient) {
    this.db = prisma as unknown as PrismaTyped
  }

  /**
   * Find a label by its ID.
   *
   * @param id - The label's UUID.
   */
  async findById(id: string): Promise<LabelRecord | null> {
    const row = await this.db.label.findUnique({ where: { id } })
    return row ? toRecord(row) : null
  }

  /**
   * Find a label by its slug.
   *
   * @param slug - The label's URL-safe slug.
   */
  async findBySlug(slug: string): Promise<LabelRecord | null> {
    const row = await this.db.label.findUnique({ where: { slug } })
    return row ? toRecord(row) : null
  }

  /**
   * Create a new label organisation.
   * The caller is responsible for also creating the first LabelMember with ADMIN role.
   */
  async create(data: {
    name: string
    slug: string
    websiteUrl?: string
    contactEmail?: string
  }): Promise<LabelRecord> {
    const row = await this.db.label.create({
      data: {
        name: data.name,
        slug: data.slug,
        websiteUrl: data.websiteUrl ?? null,
        contactEmail: data.contactEmail ?? null,
      },
    })
    return toRecord(row)
  }

  /**
   * Add a user as a member of a label.
   *
   * @param labelId - The label's UUID.
   * @param userId  - The user's UUID.
   * @param role    - 'ADMIN' or 'MEMBER'.
   */
  async addMember(
    labelId: string,
    userId: string,
    role: 'ADMIN' | 'MEMBER' = 'MEMBER',
  ): Promise<LabelMemberRecord> {
    const row = await this.db.labelMember.create({
      data: { labelId, userId, role },
    })
    return toMemberRecord(row)
  }

  /**
   * Returns all label memberships for a user.
   *
   * @param userId - The user's UUID.
   */
  async getMembershipsForUser(userId: string): Promise<LabelMemberRecord[]> {
    const rows = await this.db.labelMember.findMany({ where: { userId } })
    return rows.map(toMemberRecord)
  }

  /**
   * Returns all bands in the label's roster.
   *
   * @param labelId - The label's UUID.
   */
  async getRoster(labelId: string): Promise<Array<{ id: string; name: string }>> {
    const bands = await this.db.band.findMany({
      where: { labelId },
    })
    return bands.map((b) => ({ id: b.id, name: b.name }))
  }

  /**
   * Adds a band to the label's roster by setting band.labelId.
   *
   * @param labelId - The label's UUID.
   * @param bandId  - The band's UUID.
   */
  async addBandToRoster(labelId: string, bandId: string): Promise<void> {
    await this.db.band.update({
      where: { id: bandId },
      data: { labelId },
    })
  }

  /**
   * Removes a band from the label's roster by clearing band.labelId.
   *
   * @param bandId - The band's UUID.
   */
  async removeBandFromRoster(bandId: string): Promise<void> {
    await this.db.band.update({
      where: { id: bandId },
      data: { labelId: null },
    })
  }
}
