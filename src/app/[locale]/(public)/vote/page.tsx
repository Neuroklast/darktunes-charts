'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, Disc, UsersThree } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type VoteTab = 'fan' | 'dj' | 'peer'

const VALID_VOTE_TABS = ['fan', 'dj', 'peer'] as const

const TABS: { id: VoteTab; label: string; icon: React.ReactNode; protectedHref: string }[] = [
  { id: 'fan',  label: 'Fan Voting',  icon: <Heart      className="w-5 h-5" weight="fill" />, protectedHref: '/vote/fan'  },
  { id: 'dj',   label: 'DJ Ballot',  icon: <Disc       className="w-5 h-5" weight="fill" />, protectedHref: '/vote/dj'   },
  { id: 'peer', label: 'Peer Review', icon: <UsersThree className="w-5 h-5" weight="fill" />, protectedHref: '/vote/band' },
]

const TAB_CONTENT: Record<VoteTab, { title: string; subtitle: string; description: string; pillars: string[]; cta: string }> = {
  fan: {
    title:       'Fan Voting',
    subtitle:    'Quadratic Voting — 100 Voice Credits pro Monat',
    description: 'Als Fan bekommst du 100 Voice Credits pro Monat. Du kannst sie frei auf Tracks verteilen. Je mehr Stimmen du auf EINEN Track setzt, desto teurer wird es — das verhindert, dass Einzelne das Ergebnis dominieren.',
    pillars: [
      '100 Voice Credits pro Monat',
      'Kosten = Stimmen² (Quadratic Voting)',
      'Kredit-Budget wird jeden Monat zurückgesetzt',
      'Dein Voting beeinflusst zu 33,3 % den Gesamt-Score',
    ],
    cta: 'Fan-Voting starten',
  },
  dj: {
    title:       'DJ Ballot',
    subtitle:    'Schulze-Methode — Ranked-Choice Voting',
    description: 'Als DJ reichst du eine vollständige Rangliste aller Tracks ein. Die Schulze-Methode (Beatpath-Algorithmus) findet den fairen Gewinner durch Paarvergleiche. Strategisches Burial ist unmöglich — deine ehrliche Reihenfolge ist immer die beste Strategie.',
    pillars: [
      'Drag & Drop Rangliste per Ballot',
      'Schulze-Methode: Condorcet-Sieger',
      'Burial-sicher: ehrliche Reihenfolge gewinnt immer',
      'DJ-Ballots beeinflussen zu 33,3 % den Gesamt-Score',
    ],
    cta: 'DJ Ballot einreichen',
  },
  peer: {
    title:       'Peer Review',
    subtitle:    'Band-zu-Band Bewertung · Anti-Kollusions-Algorithmus',
    description: 'Bands bewerten sich gegenseitig anonym. Kliquen-Erkennung durch statistische Analyse (Mahalanobis-Distanz) und Netzwerk-Topologie (Triadic Census) verhindert koordinierte Voting-Ringe automatisch.',
    pillars: [
      'Nur Bands können am Peer Review teilnehmen',
      'Anonyme Bewertungen — keine gegenseitige Absprache',
      'Kliquen-Erkennung verhindert Voting-Ringe',
      'Peer-Scores beeinflussen zu 33,3 % den Gesamt-Score',
    ],
    cta: 'Band registrieren & teilnehmen',
  },
}

/**
 * Inner component that reads search params and renders the voting content.
 * Must be wrapped in Suspense because useSearchParams() is used.
 */
function VoteContent() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const tabParam      = searchParams.get('tab') as VoteTab | null
  const [active, setActive] = useState<VoteTab>(tabParam ?? 'fan')

  useEffect(() => {
    if (tabParam && (VALID_VOTE_TABS as readonly string[]).includes(tabParam)) {
      setActive(tabParam as VoteTab)
    }
  }, [tabParam])

  const content   = TAB_CONTENT[active]
  const activeTab = TABS.find(t => t.id === active)!

  const handleTabChange = (id: VoteTab) => {
    setActive(id)
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', id)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 md:px-8 py-12">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-white tracking-tight mb-2">Abstimmen</h1>
        <p className="text-muted-foreground text-sm">
          Drei unabhängige Voting-Säulen · Je 33,3 % Gewichtung im Gesamt-Score
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={[
              'flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
              active === tab.id
                ? 'bg-primary text-white'
                : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
            ].join(' ')}
            aria-pressed={active === tab.id}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      <Card className="glassmorphism p-6 sm:p-8 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
            {activeTab.icon}
          </div>
          <div>
            <h2 className="text-xl font-display font-semibold text-white mb-0.5">{content.title}</h2>
            <p className="text-sm text-muted-foreground">{content.subtitle}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{content.description}</p>

        <ul className="space-y-2 mb-8">
          {content.pillars.map(pillar => (
            <li key={pillar} className="flex items-start gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
              {pillar}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="text-sm">
            <Link href={activeTab.protectedHref}>{content.cta}</Link>
          </Button>
          <Button asChild variant="outline" className="text-sm border-white/15 text-white/60 hover:text-white hover:bg-white/5">
            <Link href="/how-it-works">Mehr zum Algorithmus →</Link>
          </Button>
        </div>
      </Card>

      {/* Score pillar overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TABS.map(tab => {
          const c       = TAB_CONTENT[tab.id]
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={[
                'text-left p-4 rounded-md border transition-all duration-200',
                isActive
                  ? 'border-primary/40 bg-primary/10'
                  : 'border-white/[0.06] bg-card/50 hover:bg-card/80',
              ].join(' ')}
            >
              <div className={`mb-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{tab.icon}</div>
              <p className="text-xs font-display text-white mb-1">{c.title}</p>
              <p className="text-[10px] text-muted-foreground">33,3 % Gewichtung</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Unified public voting landing page.
 *
 * Shows an overview of all three voting pillars (Fan, DJ, Peer) with a tab
 * switcher. Authenticated users are linked to their respective protected
 * voting routes. The `tab` query parameter allows deep-linking from external
 * redirects (e.g. /vote?tab=dj).
 */
export default function UnifiedVotePage() {
  return (
    <main className="min-h-screen gradient-mesh">
      <Suspense fallback={
        <div className="max-w-[900px] mx-auto px-4 py-12">
          <div className="h-8 w-48 rounded skeleton-shimmer mb-4" />
          <div className="h-4 w-72 rounded skeleton-shimmer" />
        </div>
      }>
        <VoteContent />
      </Suspense>
    </main>
  )
}
