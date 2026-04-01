import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/infrastructure/security/rbac'

/**
 * GET /api/admin/dj-applications
 *
 * Lists pending DJ verification applications.
 * Admin only.
 *
 * Query params: ?status=pending (default) | approved | rejected
 */
export const GET = withAuth(['ADMIN'], async (request: NextRequest): Promise<NextResponse> => {
  try {
    const url = new URL(request.url)
    const statusParam = url.searchParams.get('status')?.toUpperCase() ?? 'PENDING'
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED']
    const status = validStatuses.includes(statusParam) ? statusParam : 'PENDING'

    const applications = await (prisma as unknown as {
      djVerification: {
        findMany: (args: unknown) => Promise<Array<{
          id: string
          userId: string
          djName: string
          realName: string
          status: string
          eventHistory: unknown
          submittedAt: Date
          reviewedAt: Date | null
          reviewedBy: string | null
          user: { id: string; email: string; name: string } | null
        }>>
      }
    }).djVerification.findMany({
      where: { status },
      select: {
        id: true,
        userId: true,
        djName: true,
        realName: true,
        status: true,
        eventHistory: true,
        submittedAt: true,
        reviewedAt: true,
        reviewedBy: true,
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { submittedAt: 'asc' },
    })

    return NextResponse.json({ applications, total: applications.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
})
