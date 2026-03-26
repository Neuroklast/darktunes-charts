'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LocaleSwitcher } from '@/presentation/components/atoms/LocaleSwitcher'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
}

const NAV_LINKS: NavLink[] = [
  { href: '/charts', label: 'Charts' },
  { href: '/categories', label: 'Kategorien' },
  { href: '/how-it-works', label: 'Wie funktioniert es?' },
  { href: '/transparency', label: 'Transparenz' },
]

/**
 * NavigationBar organism — Spec §2.2 (Organisms)
 *
 * Site-wide top navigation bar with links, locale switcher, and auth actions.
 * Rendered client-side so it can access the current pathname for active link
 * highlighting and the locale switcher.
 */
export function NavigationBar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link href="/" className="font-bold tracking-tight text-lg">
          DarkTunes
        </Link>

        {/* Main Links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
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
              <Link href={href}>{label}</Link>
            </Button>
          ))}
        </div>

        {/* Right side: locale switcher + auth */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Button asChild size="sm" variant="outline">
            <Link href="/vote/fan">Abstimmen</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
