'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from '@/presentation/components/atoms/LocaleSwitcher'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_LINKS: { href: string; labelKey: string }[] = [
  { href: '/charts', labelKey: 'charts' },
  { href: '/categories', labelKey: 'categories' },
  { href: '/how-it-works', labelKey: 'howItWorks' },
  { href: '/transparency', labelKey: 'transparency' },
]

/**
 * NavigationBar organism — Spec §2.2 (Organisms)
 *
 * Site-wide top navigation bar with translated links, locale switcher, and
 * auth actions.  Rendered client-side so it can access the current pathname
 * for active link highlighting and the locale switcher.
 */
export function NavigationBar() {
  const pathname = usePathname()
  const t = useTranslations('navigation')

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link href="/" className="font-bold tracking-tight text-lg">
          DarkTunes
        </Link>

        {/* Main Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, labelKey }) => (
            <Button
              key={href}
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                'text-muted-foreground',
                pathname.startsWith(href) && 'text-foreground bg-muted'
              )}
            >
              <Link href={href}>{t(labelKey as Parameters<typeof t>[0])}</Link>
            </Button>
          ))}
        </div>

        {/* Right side: locale switcher + auth */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Button asChild size="sm" variant="outline">
            <Link href="/vote/fan">{t('vote')}</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
