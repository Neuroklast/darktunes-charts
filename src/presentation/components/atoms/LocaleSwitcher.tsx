'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

/**
 * LocaleSwitcher — Spec §8.3
 *
 * A toggle button in the navigation bar that switches between the supported
 * locales (DE / EN).  Uses next-intl's `useLocale` to read the current
 * locale and Next.js router + NEXT_LOCALE cookie to switch.
 *
 * The locale preference is persisted via the NEXT_LOCALE cookie that
 * next-intl middleware reads on subsequent requests.
 */
export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const targetLocale = locale === 'de' ? 'en' : 'de'

  function switchLocale() {
    // Persist via cookie so next-intl middleware picks it up
    document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000; SameSite=Lax`
    router.refresh()
    // Re-navigate to the same path to trigger a server re-render with new locale
    router.push(pathname)
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
