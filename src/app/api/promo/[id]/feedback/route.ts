/**
 * POST /api/promo/:id/feedback
 *
 * Records a DJ's feedback decision on a promo submission.
 *
 * Access: DJ role only.
 *
 * **Invariant (ADR-018):** Feedback decisions (PLAYED, CONSIDERED, PASS) have
 * ZERO influence on chart scores or DJ ballot rankings.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { withAuth } from '@/infrastructure/security/rbac'
import { prisma } from '@/lib/prisma'
import { validatePromoFeedback } from '@/domain/promo'
import type { AuthenticatedUser } from '@/infrastructure/security/rbac'

export const POST = withAuth(
  ['DJ'],
  async (request: NextRequest, user: AuthenticatedUser): Promise<NextResponse> => {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const promoIdx = pathParts.indexOf('promo')
    const submissionId = pathParts[promoIdx + 1]

    if (!submissionId) {
      return NextResponse.json({ error: 'Missing submission ID' }, { status: 400 })
    }

    try {
      // Verify submission exists and is active
      const submission = await (prisma as unknown as {
        promoSubmission: {
          findUnique: (args: { where: { id: string }; select: { status: boolean } }) => Promise<{ status: string } | null>
        }
      }).promoSubmission.findUnique({
        where: { id: submissionId },
        select: { status: true },
      })

      if (!submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
      }

      if (submission.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Submission is not accepting feedback' }, { status: 409 })
      }

      const body: unknown = await request.json()
      const feedbackData = validatePromoFeedback(body)

      // Upsert feedback (DJ can update their decision)
      const feedback = await (prisma as unknown as {
        promoFeedback: {
          upsert: (args: {
            where: { submissionId_djUserId: { submissionId: string; djUserId: string } }
            create: { submissionId: string; djUserId: string; decision: string; note?: string }
            update: { decision: string; note?: string }
            select: { id: boolean; decision: boolean; createdAt: boolean }
          }) => Promise<{ id: string; decision: string; createdAt: Date }>
        }
      }).promoFeedback.upsert({
        where: {
          submissionId_djUserId: {
            submissionId,
            djUserId: user.id,
          },
        },
        create: {
          submissionId,
          djUserId: user.id,
          decision: feedbackData.decision,
          note: feedbackData.note,
        },
        update: {
          decision: feedbackData.decision,
          note: feedbackData.note,
        },
        select: { id: true, decision: true, createdAt: true },
      })

      // Audit log
      await (prisma as unknown as {
        auditLog: {
          create: (args: { data: { action: string; entityType: string; entityId: string; userId: string; metadata: unknown } }) => Promise<unknown>
        }
      }).auditLog.create({
        data: {
          action: 'promo_feedback_submitted',
          entityType: 'promo_submission',
          entityId: submissionId,
          userId: user.id,
          metadata: { decision: feedbackData.decision },
        },
      })

      return NextResponse.json({ success: true, feedbackId: feedback.id, decision: feedback.decision })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      const status = message.startsWith('Invalid promo') ? 400 : 500
      return NextResponse.json({ error: message }, { status })
    }
  },
)
