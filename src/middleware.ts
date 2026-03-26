import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'
import { locales, defaultLocale } from '@/i18n/request'

/**
 * Pathname of the login page. Unauthenticated users are redirected here.
 */
const LOGIN_PATH = '/login'

/**
 * next-intl middleware — handles locale detection, cookie persistence, and
 * redirects for supported locales.  Runs BEFORE the Supabase session refresh
 * so that locale information is available to Server Components.
 */
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
})

/**
 * Returns true when the given pathname belongs to a protected route group.
 * The Next.js route group `(protected)` maps to paths like `/dashboard/...`
 * and `/vote/...` — these do NOT literally contain "(protected)" in the URL,
 * so we check a fixed list of protected path prefixes instead.
 */
function isProtectedPath(pathname: string): boolean {
  const PROTECTED_PREFIXES = [
    '/dashboard',
    '/vote',
    '/profile',
    '/admin',
  ]
  return PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

/**
 * Next.js Middleware for locale detection, session management, and auth guards.
 *
 * Order of operations:
 * 1. next-intl detects/sets the locale via cookie or Accept-Language header.
 * 2. Supabase session is refreshed so Server Components can read auth state.
 * 3. Auth guard: if the request targets a protected route and there is no
 *    active Supabase session, the user is redirected to /login.
 *
 * Only the NEXT_LOCALE cookie from the intl middleware is merged into the
 * Supabase response to avoid overwriting critical Supabase auth headers.
 */
export async function middleware(request: NextRequest) {
  // Run next-intl middleware first to obtain locale cookies/headers
  const intlResponse = intlMiddleware(request)

  // If next-intl returned a redirect (e.g. to add locale prefix), honour it
  if (intlResponse.status !== 200) {
    return intlResponse
  }

  // Run Supabase session refresh; it returns a response with updated cookies
  const supabaseResponse = await updateSession(request)

  // Auth guard — only evaluate for protected routes to avoid overhead on
  // every public page request.
  if (isProtectedPath(request.nextUrl.pathname)) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (url && anonKey) {
      // Use getSession() to read from the already-refreshed cookies synchronously.
      // The session was validated by updateSession() above, so this is a local
      // cookie read — no additional network request is made.
      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          // No-op: we only read cookies for session validation here; all
          // cookie writes were handled by updateSession() above.
          setAll: () => { /* intentionally no-op */ },
        },
      })

      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = LOGIN_PATH
        loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  // Merge only the NEXT_LOCALE cookie set by next-intl into the Supabase
  // response so locale preference is persisted without overwriting Supabase
  // auth cookies or other critical headers.
  const nextLocaleCookie = intlResponse.cookies.get('NEXT_LOCALE')
  if (nextLocaleCookie) {
    supabaseResponse.cookies.set(
      nextLocaleCookie.name,
      nextLocaleCookie.value,
      { path: '/', maxAge: 31536000, sameSite: 'lax' }
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
