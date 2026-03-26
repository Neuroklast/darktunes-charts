'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

/**
 * LocaleSwitcher — Spec §8.3
 *
 * A toggle button in the navigation bar that switches between the supported
 * locales (DE / EN).  Sets the NEXT_LOCALE cookie and refreshes the page
 * so next-intl's middleware picks up the new preference on the next request.
 *
 * The cookie is set with a 1-year expiry and SameSite=Lax to prevent CSRF.
 * Path is '/' so it applies to all routes.
 */
export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const targetLocale = locale === 'de' ? 'en' : 'de'

  function switchLocale() {
    // Set NEXT_LOCALE cookie for next-intl middleware to detect on next request
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`
    // Navigate to same path; the middleware will use the new cookie
    router.push(pathname)
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      className="font-mono text-xs tracking-wider text-muted-foreground hover:text-foreground"
      aria-label={`Switch language to ${targetLocale.toUpperCase()}`}
    >
      {locale.toUpperCase()} / {targetLocale.toUpperCase()}
    </Button>
  )
}
