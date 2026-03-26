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
