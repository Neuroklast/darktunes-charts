import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { dashboardPathForRole, prismaRoleToUserRole } from '@/domain/auth/profile'

/**
 * Supabase Auth Callback Handler.
 *
 * Handles OAuth redirects and email confirmations from Supabase Auth.
 * After exchanging the code for a session, checks whether the user already
 * has a platform profile row in the database.
 *
 * Redirect logic:
 *   - No profile found → /onboarding  (first-time OAuth login)
 *   - Profile exists   → role-specific dashboard (or `next` param)
 *   - Any error        → /auth-error
 *
 * SECURITY: Admin accounts are NEVER assignable through this flow.
 * A fresh OAuth sign-in always lands in /onboarding where only
 * fan/band/dj/editor roles are selectable. Admin privileges require a
 * direct database update by a human operator. See docs/ADMIN_BOOTSTRAP.md.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (!code) {
    return NextResponse.redirect(new URL('/auth-error', requestUrl.origin))
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors in read-only Server Component contexts
          }
        },
      },
    }
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError) {
    return NextResponse.redirect(new URL('/auth-error', requestUrl.origin))
  }

  // After a successful session exchange, check for an existing platform profile.
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.redirect(new URL('/auth-error', requestUrl.origin))
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, role: true },
    })

    if (!existingUser) {
      // First-time OAuth login — send to onboarding for role selection
      return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
    }

    // Profile exists — redirect to role-specific dashboard
    const domainRole = prismaRoleToUserRole(existingUser.role)
    const dashboardPath = dashboardPathForRole(domainRole)
    const destination = next !== '/' ? next : dashboardPath
    return NextResponse.redirect(new URL(destination, requestUrl.origin))
  } catch (err) {
    // DB error — log for production diagnostics, fall back to home so the user stays logged in
    console.error('[Auth Callback] Database error during profile check:', err)
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }
}
