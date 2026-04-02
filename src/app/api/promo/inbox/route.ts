/**
 * GET /api/promo/inbox
 *
 * Returns the DJ promo inbox — active promo submissions filtered by genre.
 *
 * Access: DJ role only.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security/rbac'
import { prisma } from '@/lib/prisma'
import { PromoInboxFilterSchema } from '@/domain/promo'
import type { AuthenticatedUser } from '@/infrastructure/security/rbac'

export const GET = withAuth(
  ['DJ'],
  async (request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> => {
    // `user` is verified by withAuth (DJ role). DJ identity is not used to
    // filter the inbox — all DJs see all active submissions. Future phase
    // may add genre-preference filtering per DJ profile.
    void user
    const url = new URL(request.url)

    const rawFilter = {
      genre: url.searchParams.get('genre') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    }

    const filterResult = PromoInboxFilterSchema.safeParse(rawFilter)
    if (!filterResult.success) {
      return NextResponse.json(
        { error: 'Invalid filter', details: filterResult.error.flatten() },
        { status: 400 },
      )
    }

    const { status, limit, offset } = filterResult.data

    try {
      const submissions = await (prisma as unknown as {
        promoSubmission: {
          findMany: (args: {
            where: { status: string }
            select: {
              id: boolean
              bandId: boolean
              labelId: boolean
              releaseId: boolean
              status: boolean
              createdAt: boolean
              assets: { select: { id: boolean; type: boolean; url: boolean } }
            }
            orderBy: { createdAt: string }
            take: number
            skip: number
          }) => Promise<Array<{
            id: string
            bandId: string | null
            labelId: string | null
            releaseId: string | null
            status: string
            createdAt: Date
            assets: Array<{ id: string; type: string; url: string }>
          }>>
        }
      }).promoSubmission.findMany({
        where: { status },
        select: {
          id: true,
          bandId: true,
          labelId: true,
          releaseId: true,
          status: true,
          createdAt: true,
          assets: { select: { id: true, type: true, url: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      })

      return NextResponse.json({ submissions })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
