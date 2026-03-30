import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import {
  CreateProfileSchema,
  prismaRoleToUserRole,
  userRoleToPrismaRole,
} from '@/domain/auth/profile'
import type { UserProfile } from '@/domain/auth/profile'
import type { IUserRepository, IBandRepository, UserRecord } from '@/domain/repositories'
import { PrismaUserRepository, PrismaBandRepository } from '@/infrastructure/repositories'

// ─── Default repository instances ─────────────────────────────────────────────

const defaultUserRepo: IUserRepository = new PrismaUserRepository(prisma)
const defaultBandRepo: IBandRepository = new PrismaBandRepository(prisma)

// ─── Shape helpers ────────────────────────────────────────────────────────────

function mapDbUserToProfile(dbUser: UserRecord): UserProfile {
  return {
    id: dbUser.id,
    role: prismaRoleToUserRole(dbUser.role),
    name: dbUser.name,
    email: dbUser.email,
    credits: dbUser.credits,
    avatarUrl: dbUser.avatarUrl,
    bandId: dbUser.band?.id ?? null,
    isDJVerified: dbUser.isDJVerified,
    createdAt: dbUser.createdAt.toISOString(),
  }
}

/** Default genre assigned to a new band profile when none is selected during onboarding. */
const DEFAULT_BAND_GENRE = 'GOTH' as const

/**
 * GET /api/profile
 *
 * Returns the current user's platform profile from the database.
 * Returns `{ profile: null }` when no profile row exists yet (new OAuth user).
 *
 * Auth: requires a valid Supabase session cookie.
 */
export async function GET(): Promise<NextResponse> {
  let user = null;
  try {
    const supabase = await createClient()
    const { data, error: authError } = await supabase.auth.getUser()
    user = data?.user
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch (err) {
    console.error('[GET /api/profile] Supabase initialization error:', err)
    // Fallback: When Supabase is not configured (e.g. testing mode without env vars),
    // we return null to allow the UI to load gracefully without crashing the server component.
    return NextResponse.json({ profile: null })
  }

  try {
    const dbUser = await defaultUserRepo.findById(user.id)

    if (!dbUser) {
      return NextResponse.json({ profile: null })
    }

    return NextResponse.json({ profile: mapDbUserToProfile(dbUser) })
  } catch (err) {
    console.error('[GET /api/profile] Database error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

// ─── POST /api/profile ────────────────────────────────────────────────────────

/**
 * POST /api/profile
 *
 * Creates or updates the current user's platform profile.
 * Called from:
 *   - The onboarding page (new OAuth users choosing their role)
 *   - The email/password registration flow (role pre-set in user_metadata)
 *
 * When role is "band" and a bandName is provided, the band record is also
 * created / updated in the same request.
 *
 * Auth: requires a valid Supabase session cookie.
 */
export async function POST(req: Request): Promise<NextResponse> {
  let user = null;
  try {
    const supabase = await createClient()
    const { data, error: authError } = await supabase.auth.getUser()
    user = data?.user
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch (err) {
    console.error('[POST /api/profile] Supabase initialization error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler (Supabase nicht konfiguriert)' }, { status: 500 })
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
  const rawAvatarUrl = (user.user_metadata as Record<string, unknown>)['avatar_url']
  const avatarUrl = typeof rawAvatarUrl === 'string' ? rawAvatarUrl : null
  const prismaRole = userRoleToPrismaRole(role)

  try {
    // Upsert the user profile row
    const dbUser = await defaultUserRepo.upsert(
      user.id,
      {
        id: user.id,
        email,
        name,
        role: prismaRole,
        avatarUrl,
        credits: 100,
      },
      {
        name,
        role: prismaRole,
        avatarUrl,
      },
    )

    // If the user chose "band" and supplied a name, also upsert the band record
    if (role === 'band' && bandName) {
      await defaultBandRepo.upsertByOwnerId(
        user.id,
        {
          ownerId: user.id,
          name: bandName,
          genre: DEFAULT_BAND_GENRE,
          tier: 'MICRO',
        },
        { name: bandName },
      )
    }

    return NextResponse.json({ profile: mapDbUserToProfile(dbUser) }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/profile] Database error:', err)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
