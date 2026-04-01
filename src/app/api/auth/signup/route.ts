import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { userRoleToPrismaRole } from '@/domain/auth/profile'
import { createAuditLog } from '@/infrastructure/audit'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(80).trim(),
})

/**
 * POST /api/auth/signup
 *
 * Fan registration via Supabase Auth email/password.
 * Creates a Supabase Auth user and a platform User record with role='fan'.
 *
 * Body: { email, password, displayName }
 * Returns: { userId, message }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { email, password, displayName } = parsed.data

    const supabase = await createClient()

    // Create the Supabase Auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { darktunes_role: 'fan', display_name: displayName },
      },
    })

    if (signUpError || !data.user) {
      return NextResponse.json(
        { error: signUpError?.message ?? 'Signup failed' },
        { status: 400 },
      )
    }

    // Create the platform User record
    await (prisma as unknown as {
      user: {
        upsert: (args: unknown) => Promise<{ id: string; role: string }>
      }
    }).user.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        email,
        name: displayName,
        displayName,
        role: userRoleToPrismaRole('fan'),
        credits: 150,
      },
      update: { displayName },
    })

    await createAuditLog('user_registered', 'User', data.user.id, data.user.id, {
      email,
      role: 'fan',
    })

    return NextResponse.json(
      { userId: data.user.id, message: 'Registration successful. Please verify your email.' },
      { status: 201 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
