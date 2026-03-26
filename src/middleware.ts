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
  // 'as-needed' keeps the default locale (de) URL-prefix-free (e.g. /charts)
  // while non-default locales get a prefix (e.g. /en/charts).  The App Router
  // [locale] segment in src/app/[locale]/ handles the internal rewrite target
  // that next-intl generates — without it, Next.js would return 404.
  localePrefix: 'as-needed',
})

/**
 * Returns true when the given pathname belongs to a protected route group.
 * The Next.js route group `(protected)` maps to paths like `/dashboard/...`
 * and `/vote/...` — these do NOT literally contain "(protected)" in the URL,
 * so we check a fixed list of protected path prefixes instead.
 *
 * With `localePrefix: 'as-needed'`, non-default locales add a prefix
 * (e.g. /en/dashboard). The locale prefix is stripped before matching so
 * that both `/dashboard` and `/en/dashboard` are recognised as protected.
 */
function isProtectedPath(pathname: string): boolean {
  const PROTECTED_PREFIXES = [
    '/dashboard',
    '/vote',
    '/profile',
    '/admin',
  ]
  // Strip locale prefix if present (e.g. /en/dashboard → /dashboard)
  const strippedPath = locales.reduce((p, loc) => {
    const prefix = `/${loc}`
    if (p.startsWith(prefix + '/')) return p.slice(prefix.length)
    if (p === prefix) return '/'
    return p
  }, pathname)
  return PROTECTED_PREFIXES.some(prefix => strippedPath.startsWith(prefix))
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
  const intlResponse = intlMiddleware(request)

  const supabaseResponse = await updateSession(request, intlResponse)

  if (isProtectedPath(request.nextUrl.pathname)) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (url && anonKey) {
      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
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

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
