import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { prismaRoleToUserRole } from '@/domain/auth/profile'

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

    const dbUser = await (prisma as unknown as {
      user: {
        findUnique: (args: unknown) => Promise<{
          id: string
          email: string
          name: string
          displayName: string | null
          role: string
          credits: number
          isDJVerified: boolean
          createdAt: Date
        } | null>
      }
    }).user.findUnique({
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
