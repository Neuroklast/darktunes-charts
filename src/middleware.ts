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
 * Applies HTTP security headers to a NextResponse.
 *
 * OWASP A05: Security Misconfiguration — prevents clickjacking, MIME sniffing,
 * data exfiltration via overly-permissive cross-origin policies, and enforces
 * HTTPS transport.
 *
 * @param response   - The NextResponse to apply headers to.
 * @param isEmbedRoute - When true, allows framing (X-Frame-Options: SAMEORIGIN)
 *                       instead of blocking it (DENY). Required for embed widget pages.
 */
function applySecurityHeaders(response: NextResponse, isEmbedRoute = false): NextResponse {
  // A05: Enforces HTTPS and prevents protocol downgrade attacks
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains',
  )
  // A05: Prevents MIME type sniffing (defence against content-type confusion attacks)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // A05: Prevents clickjacking.
  // Embed routes allow cross-origin framing so widgets can be embedded by third-party sites.
  // All other routes deny framing entirely.
  response.headers.set('X-Frame-Options', isEmbedRoute ? 'SAMEORIGIN' : 'DENY')
  // A05: Restricts what information is sent in the Referer header
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // A05: Disables browser features that are not needed by this application
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  )
  // A05: Content-Security-Policy — strict allowlist to prevent XSS and data injection
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      // Inline styles are needed by shadcn/ui and Tailwind CSS utility classes
      "style-src 'self' 'unsafe-inline'",
      // Next.js requires unsafe-eval in development; tighten in production if possible
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Allow images from Supabase storage, Spotify CDN, and data URIs
      "img-src 'self' data: blob: https://*.supabase.co https://i.scdn.co https://mosaic.scdn.co",
      // Allow audio/video from Spotify
      "media-src 'self' https://p.scdn.co",
      // Allow API connections to Supabase and Spotify
      "connect-src 'self' https://*.supabase.co https://api.spotify.com wss://*.supabase.co",
      // Allow Spotify embed iframes
      "frame-src 'self' https://open.spotify.com",
      // Fonts from self only
      "font-src 'self' data:",
    ].join('; '),
  )
  return response
}

/**
 * Next.js Middleware for locale detection, session management, auth guards,
 * and security hardening.
 *
 * Order of operations:
 * 1. next-intl detects/sets the locale via cookie or Accept-Language header.
 * 2. Supabase session is refreshed so Server Components can read auth state.
 * 3. Auth guard: if the request targets a protected route and there is no
 *    active Supabase session, the user is redirected to /login.
 * 4. Security headers are applied to every response.
 *
 * Only the NEXT_LOCALE cookie from the intl middleware is merged into the
 * Supabase response to avoid overwriting critical Supabase auth headers.
 */
export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request)

  const supabaseResponse = await updateSession(request, intlResponse)

  // Check if this is an embed route — these pages need to be embeddable in iframes
  const isEmbedRoute = request.nextUrl.pathname.includes('/embed/')

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
        const redirectResponse = NextResponse.redirect(loginUrl)
        return applySecurityHeaders(redirectResponse)
      }
    }
  }

  return applySecurityHeaders(supabaseResponse, isEmbedRoute)
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
