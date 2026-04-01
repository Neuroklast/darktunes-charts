import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/infrastructure/security/rbac'
import { votingPeriodRepository } from '@/infrastructure/repositories/votingPeriodRepository'
import { createAuditLog } from '@/infrastructure/audit'

const publishSchema = z.object({
  votingPeriodId: z.string().uuid(),
})

/**
 * POST /api/admin/charts/publish
 *
 * Publishes computed chart results for a voting period.
 * Transitions VotingPeriod.status from COMPUTING → PUBLISHED.
 * After publication, the charts become visible via GET /api/charts.
 *
 * Admin only.
 *
 * Body: { votingPeriodId }
 * Returns: { success, votingPeriodId }
 */
export const POST = withAuth(
  ['ADMIN'],
  async (request: NextRequest, user): Promise<NextResponse> => {
    try {
      const body: unknown = await request.json()
      const parsed = publishSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request body', details: parsed.error.flatten() },
          { status: 400 },
        )
      }

      const { votingPeriodId } = parsed.data

      const period = await votingPeriodRepository.findById(votingPeriodId)
      if (!period) {
        return NextResponse.json({ error: 'Voting period not found' }, { status: 404 })
      }

      if (period.status !== 'COMPUTING') {
        return NextResponse.json(
          {
            error: `Cannot publish: period is in "${period.status}" status. Must be "COMPUTING".`,
          },
          { status: 409 },
        )
      }

      await votingPeriodRepository.publish(votingPeriodId)

      await createAuditLog(
        'chart_published',
        'VotingPeriod',
        votingPeriodId,
        user.id,
        { periodName: period.name ?? votingPeriodId },
      )

      return NextResponse.json({ success: true, votingPeriodId })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  },
)
