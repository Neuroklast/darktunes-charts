import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/infrastructure/security/rbac'
import { createAuditLog } from '@/infrastructure/audit'

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500).optional(),
})

/**
 * POST /api/admin/dj-applications/[id]/reject
 *
 * Rejects a DJ verification application with an optional reason.
 * Admin only.
 *
 * Route: /api/admin/dj-applications/{id}/reject
 * The application UUID is the second-to-last path segment.
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      // Extract the application ID from the URL path.
      // URL structure: /api/admin/dj-applications/{id}/reject
      const pathSegments = new URL(request.url).pathname.split('/')
      const id = pathSegments[pathSegments.length - 2]

      if (!id) {
        return NextResponse.json({ error: 'Application ID is required' }, { status: 400 })
      }

      const body: unknown = await request.json().catch(() => ({}))
      const parsed = rejectSchema.safeParse(body)
      const reason = parsed.success ? parsed.data.reason : undefined

      const application = await (prisma as unknown as {
        djVerification: {
          findUnique: (args: unknown) => Promise<{
            id: string
            userId: string
            status: string
          } | null>
        }
      }).djVerification.findUnique({
        where: { id },
        select: { id: true, userId: true, status: true },
      })

      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
      }

      if (application.status !== 'PENDING') {
        return NextResponse.json(
          { error: `Application is already ${application.status.toLowerCase()}` },
          { status: 409 },
        )
      }

      await (prisma as unknown as {
        djVerification: { update: (args: unknown) => Promise<unknown> }
      }).djVerification.update({
        where: { id },
        data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy: user.id },
      })

      await createAuditLog(
        'dj_application_rejected',
        'DJVerification',
        id,
        user.id,
        { targetUserId: application.userId, reason },
      )

      return NextResponse.json({ success: true, applicationId: id })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
