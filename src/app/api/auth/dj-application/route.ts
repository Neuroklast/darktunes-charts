import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { validateDJApplication } from '@/domain/auth/verification'
import type { DJVerificationRequest } from '@/domain/auth/verification'
import { createAuditLog } from '@/infrastructure/audit'
import { withAuth } from '@/infrastructure/security/rbac'

const djEventSchema = z.object({
  eventName: z.string().min(1),
  venue: z.string().min(1),
  date: z.string().datetime({ message: 'Each event date must be a valid ISO-8601 timestamp' }),
  proofUrl: z.string().url().optional(),
})

const djApplicationSchema = z.object({
  djName: z.string().min(1, 'DJ name is required').max(100),
  realName: z.string().min(2, 'Real name must be at least 2 characters').max(200),
  eventHistory: z
    .array(djEventSchema)
    .min(1, 'At least one event is required'),
})

/**
 * POST /api/auth/dj-application
 *
 * Submit a DJ verification request.
 * Requires authenticated user with any role (fans applying to become DJs).
 *
 * Body: { djName, realName, eventHistory: [{ eventName, venue, date, proofUrl? }] }
 * Returns: { applicationId, message }
 */
export const POST = withAuth([], async (request: NextRequest, user): Promise<NextResponse> => {
  try {
    const body: unknown = await request.json()
    const parsed = djApplicationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { djName, realName, eventHistory } = parsed.data

    // Validate using domain verification logic
    const verificationRequest: DJVerificationRequest = {
      userId: user.id,
      djName,
      realName,
      eventHistory: eventHistory.map((e) => ({
        eventName: e.eventName,
        venue: e.venue,
        date: new Date(e.date),
        proofUrl: e.proofUrl,
      })),
      submittedAt: new Date(),
    }

    const validation = validateDJApplication(verificationRequest)

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Application validation failed', details: validation.errors },
        { status: 422 },
      )
    }

    // Check for existing pending application
    const existing = await (prisma as unknown as {
      djVerification: {
        findUnique: (args: unknown) => Promise<{ id: string; status: string } | null>
        create: (args: unknown) => Promise<{ id: string }>
      }
    }).djVerification.findUnique({
      where: { userId: user.id },
      select: { id: true, status: true },
    })

    if (existing) {
      return NextResponse.json(
        {
          error: 'An application already exists for this account',
          status: existing.status,
          applicationId: existing.id,
        },
        { status: 409 },
      )
    }

    const application = await (prisma as unknown as {
      djVerification: { create: (args: unknown) => Promise<{ id: string }> }
    }).djVerification.create({
      data: {
        userId: user.id,
        djName,
        realName,
        status: 'PENDING',
        eventHistory: eventHistory,
      },
    })

    await createAuditLog(
      'dj_application_submitted',
      'DJVerification',
      application.id,
      user.id,
      { djName, eventCount: eventHistory.length },
    )

    return NextResponse.json(
      {
        applicationId: application.id,
        message: 'DJ application submitted successfully. An admin will review it shortly.',
      },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
})

/**
 * GET /api/auth/dj-application
 *
 * Returns the current user's DJ application status.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const application = await (prisma as unknown as {
      djVerification: {
        findUnique: (args: unknown) => Promise<{
          id: string
          djName: string
          status: string
          submittedAt: Date
          reviewedAt: Date | null
        } | null>
      }
    }).djVerification.findUnique({
      where: { userId: authUser.id },
      select: {
        id: true,
        djName: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
      },
    })

    if (!application) {
      return NextResponse.json({ application: null })
    }

    return NextResponse.json({ application })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
