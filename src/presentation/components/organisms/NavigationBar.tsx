'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from '@/presentation/components/atoms/LocaleSwitcher'
import { DarkTunesLogo } from '@/presentation/components/atoms/DarkTunesLogo'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import {
  BarChart2,
  Heart,
  Info,
  ScrollText,
  Shield,
  LogOut,
  UserCircle,
  Menu,
} from 'lucide-react'

interface NavLink {
  href: string
  labelKey: string
  icon: React.ReactNode
}

const NAV_LINKS: NavLink[] = [
  { href: '/charts',       labelKey: 'charts',       icon: <BarChart2  size={14} /> },
  { href: '/vote',         labelKey: 'vote',         icon: <Heart      size={14} /> },
  { href: '/how-it-works', labelKey: 'howItWorks',   icon: <Info       size={14} /> },
  { href: '/transparency', labelKey: 'transparency', icon: <ScrollText size={14} /> },
]

/**
 * NavigationBar — Liquid Obsidian Design System
 *
 * Glassmorphism header with the DarkTunes brand mark, full navigation,
 * locale switcher and auth action. Matches the "High-End-Software" aesthetic:
 * obsidian surface, hairline borders, Oswald display font.
 *
 * Session-aware: shows the user's name + a logout button when authenticated,
 * and a login link when not authenticated.
 */
export function NavigationBar() {
  const pathname = usePathname()
  const t = useTranslations('navigation')
  const { user, isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] glassmorphism">
      <nav className="max-w-[1440px] mx-auto flex items-center h-14 px-4 gap-4">

        {/* ── Mobile Hamburger ── */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="md:hidden flex items-center justify-center p-1.5 rounded-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              aria-label={t('openMenu')}
            >
              <Menu size={20} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-[#0a0a0a] border-white/[0.06] p-0">
            <SheetHeader className="px-4 pt-4 pb-2 border-b border-white/[0.06]">
              <SheetTitle className="flex items-center gap-2">
                <DarkTunesLogo />
                <span className="text-white text-sm font-display tracking-wider uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                  DarkTunes
                </span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col py-2">
              {NAV_LINKS.map(({ href, labelKey, icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-[13px] tracking-wide uppercase transition-colors',
                      'font-medium',
                      isActive
                        ? 'bg-[#7C3AED]/15 text-[#7C3AED] border-l-2 border-[#7C3AED]'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    )}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {icon}
                    {t(labelKey as Parameters<typeof t>[0])}
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>

        {/* ── Brand ── */}
        <Link href="/" className="flex items-center gap-3 shrink-0 mr-2" aria-label={t('homeLink')}>
          <DarkTunesLogo />
          {/* Chart brand label */}
          <div className="hidden lg:flex flex-col leading-none pl-3 border-l border-white/10">
            <span
              className="text-white font-display text-[11px] tracking-[0.22em] uppercase"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              darkTunes <span className="text-white font-bold">CHARTS</span>
            </span>
            <span className="text-[9px] text-white/35 tracking-[0.18em] uppercase" style={{ fontFamily: 'var(--font-body)' }}>
              {t('tagline')}
            </span>
          </div>
        </Link>

        {/* ── Primary Navigation ── */}
        <div className="hidden md:flex items-center gap-0.5 flex-1">
          {NAV_LINKS.map(({ href, labelKey, icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[12px] tracking-wide uppercase rounded-sm transition-all duration-150',
                  'font-medium',
                  isActive
                    ? 'bg-[#7C3AED] text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                )}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {icon}
                {t(labelKey as Parameters<typeof t>[0])}
              </Link>
            )
          })}
        </div>

        {/* ── Right: Security icon + Locale + Auth ── */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <Link
            href="/how-it-works"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-[12px] uppercase tracking-wide text-white/40 hover:text-white transition-colors rounded-sm hover:bg-white/5"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <Shield size={13} />
            {t('security')}
          </Link>
          <LocaleSwitcher />

          {isAuthenticated && user ? (
            /* ── Authenticated: user name + logout ── */
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wide text-white/70 hover:text-white transition-colors rounded-sm hover:bg-white/5"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <UserCircle size={13} />
                {user.name}
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="flex items-center gap-1.5 h-7 px-3 text-[11px] uppercase tracking-widest border border-white/15 bg-transparent text-white/60 hover:text-white hover:border-white/30 rounded-sm font-medium transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
                aria-label={t('logout')}
              >
                <LogOut size={12} />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          ) : (
            /* ── Unauthenticated: login button ── */
            <Button
              asChild
              size="sm"
              className="h-7 px-4 text-[11px] uppercase tracking-widest border border-white/15 bg-transparent text-white hover:bg-white/8 rounded-sm font-medium"
            >
              <Link href="/login">{t('login')}</Link>
            </Button>
          )}
        </div>

      </nav>
    </header>
  )
}

