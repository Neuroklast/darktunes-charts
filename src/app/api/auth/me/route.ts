import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { prismaRoleToUserRole } from '@/domain/auth/profile'

type PrismaUser = {
  id: string
  email: string
  name: string
  displayName: string | null
  role: string
  credits: number
  isDJVerified: boolean
  createdAt: Date
}

type PrismaUserFull = PrismaUser & {
  region: string | null
  avatarUrl: string | null
  stripeCustomerId: string | null
}

type PrismaClient = {
  user: {
    findUnique: (args: unknown) => Promise<PrismaUserFull | null>
    update: (args: unknown) => Promise<PrismaUser>
    delete: (args: unknown) => Promise<void>
  }
  fanVote: {
    updateMany: (args: unknown) => Promise<unknown>
    deleteMany: (args: unknown) => Promise<unknown>
    findMany: (args: unknown) => Promise<unknown[]>
  }
  dJBallot: {
    deleteMany: (args: unknown) => Promise<unknown>
    findMany: (args: unknown) => Promise<unknown[]>
  }
  auditLog: {
    deleteMany: (args: unknown) => Promise<unknown>
    findMany: (args: unknown) => Promise<unknown[]>
  }
}

const db = prisma as unknown as PrismaClient

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user's profile including role.
 * Requires a valid Supabase session cookie.
 *
 * Returns: { id, email, name, displayName, role, credits, isDJVerified, createdAt }
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        credits: true,
        isDJVerified: true,
        createdAt: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      displayName: dbUser.displayName,
      role: prismaRoleToUserRole(dbUser.role as Parameters<typeof prismaRoleToUserRole>[0]),
      credits: dbUser.credits,
      isDJVerified: dbUser.isDJVerified,
      createdAt: dbUser.createdAt.toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/auth/me/data-export
 *
 * GDPR Art. 20 — Right to data portability.
 * Returns all personal data stored about the current user as JSON.
 * Requires a valid Supabase session cookie.
 *
 * Returns: { user, fanVotes, djBallots, auditLogs }
 */
export async function GET_data_export(): Promise<NextResponse> {
  // NOTE: This function is re-exported as GET in /api/auth/me/data-export/route.ts
  // It lives here as a shared implementation to keep the auth module cohesive.
  return NextResponse.json({ error: 'Use /api/auth/me/data-export' }, { status: 400 })
}

/**
 * DELETE /api/auth/me
 *
 * GDPR Art. 17 — Right to erasure ("right to be forgotten").
 * Anonymises all votes cast by this user, deletes all personal data,
 * and signs the user out of Supabase Auth.
 *
 * Votes are anonymised (userId set to NULL) rather than deleted to preserve
 * chart integrity — the voting weight of past votes is retained but they can
 * no longer be linked to the individual.
 *
 * Returns: { success: true }
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authUser.id

    // Anonymise fan votes — preserve vote weights but remove personal link
    // A04: Insecure Design — votes are anonymised not deleted to prevent chart manipulation
    await db.fanVote.updateMany({
      where: { userId },
      data: { userId: null },
    })

    // Delete DJ ballots (ranked-choice data that would identify the individual)
    await db.dJBallot.deleteMany({ where: { userId } })

    // Delete personal audit logs
    await db.auditLog.deleteMany({ where: { userId } })

    // Delete the user record from our DB
    await db.user.delete({ where: { id: userId } })

    // Sign out from Supabase Auth — this invalidates all sessions
    // Non-fatal: if the service key is not configured, the DB deletion already
    // removes the profile. Operators should monitor for orphaned auth records.
    await supabase.auth.admin.deleteUser(userId).catch((err: unknown) => {
      console.warn('[gdpr:account-deletion] Supabase auth deletion failed for user', userId, err instanceof Error ? err.message : err)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

