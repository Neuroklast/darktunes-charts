import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateProfileSchema } from '@/domain/auth/profile'
import type { UserProfile } from '@/domain/auth/profile'

/**
 * GET /api/profile
 *
 * Returns the current user's platform profile.
 * Returns { profile: null } when no profile row exists yet (new OAuth user).
 *
 * Auth: requires a valid Supabase session cookie.
 */
export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO: replace stub with real Prisma query when DB is connected:
  // const profile = await prisma.user.findUnique({
  //   where: { id: user.id },
  //   select: { id: true, role: true, name: true, email: true, credits: true,
  //             avatarUrl: true, band: { select: { id: true } }, isDJVerified: true, createdAt: true },
  // })
  // if (!profile) return NextResponse.json({ profile: null })
  // return NextResponse.json({ profile: mapPrismaProfileToUserProfile(profile) })

  // Stub: return null so OAuth users are directed to /onboarding
  return NextResponse.json({ profile: null satisfies UserProfile | null })
}

/**
 * POST /api/profile
 *
 * Creates or updates the current user's platform profile.
 * Called from:
 *   - The onboarding page (new OAuth users choosing their role)
 *   - The email/password registration callback (role already in user_metadata)
 *
 * Auth: requires a valid Supabase session cookie.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  const parsed = CreateProfileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ungültige Eingabe', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { name, role, bandName } = parsed.data
  const email = user.email ?? ''
  const avatarUrl = (user.user_metadata as Record<string, unknown>)['avatar_url']
  const avatar = typeof avatarUrl === 'string' ? avatarUrl : null

  // TODO: replace stubs with real Prisma upsert when DB is connected:
  // const profile = await prisma.user.upsert({
  //   where: { id: user.id },
  //   create: { id: user.id, email, name, role: role.toUpperCase() as Role,
  //             avatarUrl: avatar, credits: 100 },
  //   update: { name, role: role.toUpperCase() as Role, avatarUrl: avatar },
  // })
  // if (role === 'band' && bandName) {
  //   await prisma.band.upsert({
  //     where: { ownerId: user.id },
  //     create: { ownerId: user.id, name: bandName, genre: 'GOTH', tier: 'MICRO' },
  //     update: { name: bandName },
  //   })
  // }

  const stubProfile: UserProfile = {
    id: user.id,
    role,
    name,
    email,
    credits: 100,
    avatarUrl: avatar,
    bandId: role === 'band' && bandName ? `band-${user.id}` : null,
    isDJVerified: false,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json({ profile: stubProfile }, { status: 201 })
}
