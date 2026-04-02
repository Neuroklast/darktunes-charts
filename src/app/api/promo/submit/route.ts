/**
 * POST /api/promo/submit
 *
 * Submits a release to the DJ promo pool.
 *
 * Access: BAND or LABEL role only.
 * Paid gating hook: in future phases, subscription validation can be added here.
 *
 * **Invariant (ADR-018):** Promo submissions have zero influence on chart scores.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security/rbac'
import { prisma } from '@/lib/prisma'
import { validatePromoSubmission } from '@/domain/promo'
import { rateLimiter } from '@/infrastructure/rateLimiter'
import type { AuthenticatedUser } from '@/infrastructure/security/rbac'

const PROMO_SUBMIT_RATE_LIMIT = 5
const PROMO_SUBMIT_RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

export const POST = withAuth(
  ['BAND', 'LABEL'],
  async (request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> => {
    const { allowed } = rateLimiter.check(user.id, 'promo-submit', PROMO_SUBMIT_RATE_LIMIT, PROMO_SUBMIT_RATE_WINDOW_MS)
    if (!allowed) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    }

    try {
      const body: unknown = await request.json()
      const data = validatePromoSubmission(body)

      // Authorisation: band owner submits for their band; label for their mandate
      if (user.role === 'BAND' && data.bandId) {
        const band = await (prisma as unknown as {
          band: {
            findUnique: (args: { where: { id: string }; select: { ownerId: boolean } }) => Promise<{ ownerId: string } | null>
          }
        }).band.findUnique({ where: { id: data.bandId }, select: { ownerId: true } })

        if (!band || band.ownerId !== user.id) {
          return NextResponse.json({ error: 'Forbidden: not your band' }, { status: 403 })
        }
      }

      if (user.role === 'LABEL' && data.bandId) {
        const mandate = await (prisma as unknown as {
          labelBandMandate: {
            findFirst: (args: { where: { labelId: string; bandId: string; status: string } }) => Promise<{ id: string } | null>
          }
        }).labelBandMandate.findFirst({
          where: { labelId: user.id, bandId: data.bandId, status: 'ACTIVE' },
        })
        if (!mandate) {
          return NextResponse.json({ error: 'Forbidden: no active mandate for this band' }, { status: 403 })
        }
      }

      // Create the submission
      const submission = await (prisma as unknown as {
        promoSubmission: {
          create: (args: {
            data: {
              bandId?: string
              labelId?: string
              releaseId?: string
              status: string
              assets?: { create: Array<{ type: string; url: string }> }
            }
            select: { id: boolean; createdAt: boolean; status: boolean }
          }) => Promise<{ id: string; createdAt: Date; status: string }>
        }
      }).promoSubmission.create({
        data: {
          bandId: data.bandId,
          labelId: user.role === 'LABEL' ? user.id : undefined,
          releaseId: data.releaseId,
          status: 'ACTIVE',
          ...(data.assets && data.assets.length > 0
            ? { assets: { create: data.assets } }
            : {}),
        },
        select: { id: true, createdAt: true, status: true },
      })

      // Audit log
      await (prisma as unknown as {
        auditLog: {
          create: (args: { data: { action: string; entityType: string; entityId: string; userId: string; metadata: unknown } }) => Promise<unknown>
        }
      }).auditLog.create({
        data: {
          action: 'promo_submitted',
          entityType: 'promo_submission',
          entityId: submission.id,
          userId: user.id,
          metadata: { bandId: data.bandId, releaseId: data.releaseId },
        },
      })

      return NextResponse.json({ success: true, submissionId: submission.id, status: submission.status })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      const status = message.startsWith('Invalid promo') ? 400 : 500
      return NextResponse.json({ error: message }, { status })
    }
  },
)
