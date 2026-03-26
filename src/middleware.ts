import { type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { updateSession } from '@/lib/supabase/middleware'
import { locales, defaultLocale } from '@/i18n/request'

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
 * Next.js Middleware for locale detection and session management.
 *
 * Order of operations:
 * 1. next-intl detects/sets the locale via cookie or Accept-Language header.
 * 2. Supabase session is refreshed so Server Components can read auth state.
 *
 * Both middlewares must run; the response from next-intl carries locale headers
 * that the intl provider needs, while Supabase needs the refreshed cookie.
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

  // Merge next-intl headers into the Supabase response so the locale cookie
  // set by next-intl is preserved alongside the Supabase session cookie
  intlResponse.headers.forEach((value, key) => {
    supabaseResponse.headers.set(key, value)
  })

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
