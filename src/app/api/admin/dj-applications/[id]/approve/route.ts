import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/infrastructure/security/rbac'
import { createAuditLog } from '@/infrastructure/audit'

/**
 * POST /api/admin/dj-applications/[id]/approve
 *
 * Approves a DJ verification application.
 * Updates the DJVerification status to APPROVED and the User.role to DJ.
 * Admin only.
 *
 * Route: /api/admin/dj-applications/{id}/approve
 * The application UUID is the second-to-last path segment.
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      // Extract the application ID from the URL path.
      // URL structure: /api/admin/dj-applications/{id}/approve
      const pathSegments = new URL(request.url).pathname.split('/')
      const id = pathSegments[pathSegments.length - 2]

      if (!id) {
        return NextResponse.json({ error: 'Application ID is required' }, { status: 400 })
      }

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

      const db = prisma as unknown as {
        $transaction: (ops: unknown[]) => Promise<unknown[]>
        djVerification: { update: (a: unknown) => unknown }
        user: { update: (a: unknown) => unknown }
      }

      await db.$transaction([
        db.djVerification.update({
          where: { id },
          data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: user.id },
        }),
        db.user.update({
          where: { id: application.userId },
          data: { role: 'DJ', isDJVerified: true },
        }),
      ])

      await createAuditLog(
        'dj_application_approved',
        'DJVerification',
        id,
        user.id,
        { targetUserId: application.userId },
      )

      return NextResponse.json({ success: true, applicationId: id })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
