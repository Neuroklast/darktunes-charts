/**
 * GET /api/promo/:id
 * Returns a promo submission with its feedbacks.
 *
 * Access: submitter (band/label), DJ (to view their own feedback), ADMIN.
 *
 * POST /api/promo/:id/feedback — see ../[id]/feedback/route.ts
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security/rbac'
import { prisma } from '@/lib/prisma'
import type { AuthenticatedUser } from '@/infrastructure/security/rbac'

export const GET = withAuth(
  ['BAND', 'LABEL', 'DJ', 'ADMIN'],
  async (request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> => {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const promoIdx = pathParts.indexOf('promo')
    const submissionId = pathParts[promoIdx + 1]

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })
    }

    try {
      const submission = await (prisma as unknown as {
        promoSubmission: {
          findUnique: (args: {
            where: { id: string }
            select: {
              id: boolean
              bandId: boolean
              labelId: boolean
              releaseId: boolean
              status: boolean
              createdAt: boolean
              assets: { select: { id: boolean; type: boolean; url: boolean } }
              feedbacks: {
                select: {
                  id: boolean
                  djUserId: boolean
                  decision: boolean
                  note: boolean
                  createdAt: boolean
                }
              }
            }
          }) => Promise<{
            id: string
            bandId: string | null
            labelId: string | null
            releaseId: string | null
            status: string
            createdAt: Date
            assets: Array<{ id: string; type: string; url: string }>
            feedbacks: Array<{ id: string; djUserId: string; decision: string; note: string | null; createdAt: Date }>
          } | null>
        }
      }).promoSubmission.findUnique({
        where: { id: submissionId },
        select: {
          id: true,
          bandId: true,
          labelId: true,
          releaseId: true,
          status: true,
          createdAt: true,
          assets: { select: { id: true, type: true, url: true } },
          feedbacks: {
            select: {
              id: true,
              djUserId: true,
              decision: true,
              note: true,
              createdAt: true,
            },
          },
        },
      })

      if (!submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
      }

      // Access control: admin sees all; submitter sees own; DJ sees public data
      if (user.role !== 'ADMIN') {
        const isSubmitterBand = user.role === 'BAND' && submission.bandId !== null
        const isSubmitterLabel = user.role === 'LABEL' && submission.labelId !== null
        const isDJ = user.role === 'DJ'

        if (!isSubmitterBand && !isSubmitterLabel && !isDJ) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }

      return NextResponse.json({ submission })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
