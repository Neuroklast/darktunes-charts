'use client'

import Link from 'next/link'
import { ArrowLeft, Lock, BarChart3, TrendingUp, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: Promise<{ slug: string; locale: string }>
}

/**
 * Band Analytics Dashboard — /bands/:slug/analytics
 *
 * Gated by subscription tier:
 * - Free: Upgrade CTA
 * - Pro (€9): Basic metrics cards
 * - Pro+ (€29): Full Recharts dashboard
 *
 * This is a client component because Recharts requires client-side rendering.
 * Auth/tier checks happen here and would normally use a server session hook.
 */
export default function BandAnalyticsPage({ params: _params }: PageProps) {
  // In production, derive tier from authenticated user's band profile.
  // For now, show the Pro+ upgrade CTA as the default unauthenticated view.
  const tier = 'free' as 'free' | 'pro' | 'pro_plus'

  return (
    <main className="min-h-screen bg-background py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Back link */}
        <Link
          href=".."
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-6"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <ArrowLeft size={12} />
          Zurück zum Profil
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-3xl font-display text-white"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
            >
              Analytics
            </h1>
            <p className="text-sm text-white/40 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
              Voting-Daten, Chart-Performance und Community-Insights
            </p>
          </div>
          <Badge variant="outline" className="text-xs uppercase tracking-wider">
            {tier === 'free' ? 'Free' : tier === 'pro' ? 'Pro' : 'Pro+'}
          </Badge>
        </div>

        {tier === 'free' && <FreeUpgradeCTA />}
        {tier === 'pro' && <ProMetrics />}
        {tier === 'pro_plus' && <ProPlusAnalytics />}
      </div>
    </main>
  )
}

function FreeUpgradeCTA() {
  return (
    <Card className="p-8 bg-[#141414] border border-white/[0.06] text-center">
      <div className="w-16 h-16 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center mx-auto mb-4">
        <Lock size={24} className="text-[#7C3AED]/70" />
      </div>
      <h2
        className="text-xl font-display text-white mb-2"
        style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
      >
        Analytics freischalten
      </h2>
      <p className="text-sm text-white/50 mb-6 max-w-md mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
        Mit DarkTunes Pro (€9/Monat) erhältst du Einblick in Voting-Trends,
        DJ-Erwähnungen und deine beste Chart-Position. Pro+ (€29/Monat) schaltet
        den vollständigen Analytics-Hub mit Recharts-Diagrammen frei.
      </p>
      <div className="flex gap-3 justify-center">
        <Button asChild>
          <Link href="/dashboard/band">Pro — €9/Monat</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/band">Pro+ — €29/Monat</Link>
        </Button>
      </div>
    </Card>
  )
}

function ProMetrics() {
  const metrics = [
    { label: 'Votes gesamt', value: '342', icon: <Users size={20} className="text-[#7C3AED]" /> },
    { label: 'DJ-Erwähnungen', value: '12', icon: <BarChart3 size={20} className="text-[#00F0FF]" /> },
    { label: 'Beste Position', value: '#3', icon: <TrendingUp size={20} className="text-[#00FF66]" /> },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {metrics.map((m) => (
        <Card key={m.label} className="p-5 bg-[#141414] border border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            {m.icon}
            <span className="text-xs text-white/40 uppercase tracking-wider" style={{ fontFamily: 'var(--font-body)' }}>
              {m.label}
            </span>
          </div>
          <p
            className="text-3xl font-display text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {m.value}
          </p>
        </Card>
      ))}
    </div>
  )
}

function ProPlusAnalytics() {
  return (
    <div className="space-y-6">
      <ProMetrics />

      {/* Voting Trend Chart placeholder */}
      <Card className="p-6 bg-[#141414] border border-white/[0.06]">
        <h2
          className="text-xs font-display text-white tracking-[0.14em] uppercase mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Voting-Trend (letzte 6 Perioden)
        </h2>
        <div className="h-48 flex items-center justify-center border border-white/[0.04] rounded-sm">
          <p className="text-xs text-white/20" style={{ fontFamily: 'var(--font-body)' }}>
            Recharts-Diagramm (wird geladen…)
          </p>
        </div>
      </Card>

      {/* Regional Heatmap placeholder */}
      <Card className="p-6 bg-[#141414] border border-white/[0.06]">
        <h2
          className="text-xs font-display text-white tracking-[0.14em] uppercase mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Regionale Verteilung
        </h2>
        <div className="h-48 flex items-center justify-center border border-white/[0.04] rounded-sm">
          <p className="text-xs text-white/20" style={{ fontFamily: 'var(--font-body)' }}>
            Heatmap (min. 10 Voter für Datenschutz-Schwellenwert)
          </p>
        </div>
      </Card>
    </div>
  )
}
