import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { IUserRepository } from '@/domain/repositories'
import { PrismaUserRepository } from '@/infrastructure/repositories'

/** Default repository instance — overridable in tests via `createMandateHandlers`. */
const defaultUserRepo: IUserRepository = new PrismaUserRepository(prisma)

/** Prisma UserRole values allowed to create or revoke label mandates. */
const MANDATE_ALLOWED_ROLES = ['BAND', 'LABEL', 'ADMIN'] as const

const createMandateSchema = z.object({
  labelId: z.string().uuid(),
  bandId: z.string().uuid(),
})

/**
 * GET /api/mandates
 * Returns label-band mandates for the authenticated user.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = prisma as unknown as {
      labelBandMandate: {
        findMany: (args: unknown) => Promise<Array<{
          id: string; labelId: string; bandId: string; status: string;
          grantedAt: Date | null; createdAt: Date
        }>>
      }
    }
    const mandates = await db.labelBandMandate.findMany({
      where: { OR: [{ labelId: user.id }, { band: { ownerId: user.id } }] },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ mandates })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/mandates
 * Creates a new label mandate (band grants label access).
 *
 * Access control: Only BAND, LABEL and ADMIN roles may create mandates.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await defaultUserRepo.findRoleById(user.id)

    if (!dbUser || !MANDATE_ALLOWED_ROLES.includes(dbUser.role as typeof MANDATE_ALLOWED_ROLES[number])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: unknown = await request.json()
    const parsed = createMandateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const mandateDb = prisma as unknown as {
      labelBandMandate: {
        create: (args: unknown) => Promise<{ id: string; status: string; labelId: string; bandId: string }>
      }
    }
    const mandate = await mandateDb.labelBandMandate.create({
      data: { labelId: parsed.data.labelId, bandId: parsed.data.bandId, status: 'PENDING' },
    })
    return NextResponse.json({ success: true, mandate })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE /api/mandates?mandateId=xxx
 * Revokes a label mandate.
 *
 * Access control: Only BAND, LABEL and ADMIN roles may revoke mandates.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await defaultUserRepo.findRoleById(user.id)

    if (!dbUser || !MANDATE_ALLOWED_ROLES.includes(dbUser.role as typeof MANDATE_ALLOWED_ROLES[number])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const mandateId = request.nextUrl.searchParams.get('mandateId')
    if (!mandateId) {
      return NextResponse.json({ error: 'mandateId parameter required' }, { status: 400 })
    }

    const revokeDb = prisma as unknown as {
      labelBandMandate: {
        update: (args: unknown) => Promise<{ id: string }>
      }
    }
    await revokeDb.labelBandMandate.update({
      where: { id: mandateId },
      data: { status: 'REVOKED', revokedAt: new Date() },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
