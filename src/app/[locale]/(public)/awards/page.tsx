import type { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Award, Trophy, Star, Mic2, ShieldCheck, BookOpen } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Community Awards · DarkTunes',
  description: 'Die DarkTunes Community Awards — demokratische Auszeichnungen für Dark-Music-Künstler.',
  openGraph: {
    title: 'DarkTunes Community Awards',
    description: 'Demokratische Auszeichnungen für die Dark-Music-Szene.',
  },
}

type AwardStatus = 'nominating' | 'voting' | 'closed'

interface AwardCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  status: AwardStatus
  color: string
  nominees?: string[]
  winner?: string
}

const AWARD_CATEGORIES: AwardCategory[] = [
  {
    id: 'chronicler',
    name: 'Chronicler of the Scene',
    description: 'Für den DJ oder Journalisten, der die Szene am besten dokumentiert und vermittelt.',
    icon: <BookOpen size={20} />,
    status: 'nominating',
    color: '#7C3AED',
  },
  {
    id: 'dark-integrity',
    name: 'Dark Integrity Award',
    description: 'Für außergewöhnliches soziales Engagement und Integrität innerhalb der Szene.',
    icon: <ShieldCheck size={20} />,
    status: 'voting',
    color: '#10B981',
    nominees: ['Ost+Front', 'Combichrist', 'She Wants Revenge'],
  },
  {
    id: 'newcomer',
    name: 'Newcomer of the Year',
    description: 'Für den aufregendsten neuen Act des Jahres mit < 10.000 monatlichen Hörern.',
    icon: <Star size={20} />,
    status: 'voting',
    color: '#F59E0B',
    nominees: ['Void Hammer', 'Signal Decay', 'The Pale Archive'],
  },
  {
    id: 'compilation-track',
    name: 'Best Compilation Track',
    description: 'Der definitive Track der diesjährigen DarkTunes Compilation.',
    icon: <Trophy size={20} />,
    status: 'closed',
    color: '#D30000',
    winner: 'The Iron Testament — Xordia',
  },
  {
    id: 'dj-of-the-year',
    name: 'DJ of the Year',
    description: 'Der einflussreichste und engagierteste DJ in der DACH-Darkmusik-Szene.',
    icon: <Mic2 size={20} />,
    status: 'nominating',
    color: '#00F0FF',
  },
]

const STATUS_LABELS: Record<AwardStatus, string> = {
  nominating: 'Nominierungen offen',
  voting: 'Voting läuft',
  closed: 'Abgeschlossen',
}

const STATUS_COLORS: Record<AwardStatus, string> = {
  nominating: 'text-[#F59E0B]',
  voting: 'text-[#00FF66]',
  closed: 'text-white/30',
}

export default function AwardsPage() {
  return (
    <main className="min-h-screen gradient-mesh py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Award size={32} className="text-[#7C3AED]" />
            <h1
              className="text-4xl font-display text-white"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
            >
              Community Awards 2026
            </h1>
          </div>
          <p className="text-sm text-white/40 max-w-xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
            Demokratische Auszeichnungen für die Dark-Music-Szene —
            gewählt von der Community mit Quadratic Voting.
          </p>
        </div>

        {/* Awards Cards */}
        <div className="space-y-4">
          {AWARD_CATEGORIES.map((award) => (
            <AwardCard key={award.id} award={award} />
          ))}
        </div>

        {/* How it works */}
        <section className="mt-12 border border-white/[0.06] rounded-sm p-6 bg-[#141414]">
          <h2
            className="text-sm font-display text-white tracking-[0.14em] mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Wie funktioniert das Voting?
          </h2>
          <ol className="space-y-2 text-sm text-white/50" style={{ fontFamily: 'var(--font-body)' }}>
            <li>1. <strong className="text-white/70">Nominierung:</strong> Community-Mitglieder können Künstler nominieren.</li>
            <li>2. <strong className="text-white/70">Endorsements:</strong> Andere können Nominierungen unterstützen.</li>
            <li>3. <strong className="text-white/70">Quadratic Voting:</strong> Finale Abstimmung mit Voice Credits (wie Fan-Voting).</li>
            <li>4. <strong className="text-white/70">Transparenz:</strong> Alle Ergebnisse und Gewichtungen sind öffentlich.</li>
          </ol>
        </section>

      </div>
    </main>
  )
}

function AwardCard({ award }: { award: AwardCategory }) {
  const statusLabel = STATUS_LABELS[award.status]
  const statusColor = STATUS_COLORS[award.status]

  return (
    <Card className="bg-[#141414] border border-white/[0.06] p-6">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-sm mt-0.5"
          style={{ backgroundColor: `${award.color}18`, color: award.color }}
        >
          {award.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <h2
              className="text-base font-display text-white"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
            >
              {award.name}
            </h2>
            <span
              className={`text-[10px] uppercase tracking-wider shrink-0 ${statusColor}`}
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              {statusLabel}
            </span>
          </div>

          <p className="text-sm text-white/45 mb-3 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
            {award.description}
          </p>

          {/* Nominees */}
          {award.nominees && award.nominees.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-body)' }}>
                Nominiert
              </p>
              <div className="flex flex-wrap gap-2">
                {award.nominees.map((nominee) => (
                  <Badge key={nominee} variant="outline" className="text-[10px]">
                    {nominee}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Winner */}
          {award.winner && (
            <div className="flex items-center gap-2 py-2 px-3 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-sm">
              <Trophy size={12} className="text-[#7C3AED] shrink-0" />
              <span className="text-xs text-white/70" style={{ fontFamily: 'var(--font-body)' }}>
                Gewinner: <strong className="text-white">{award.winner}</strong>
              </span>
            </div>
          )}

          {/* Actions */}
          {award.status === 'nominating' && (
            <Button size="sm" variant="outline" className="mt-3" asChild>
              <Link href="/login?redirectTo=/awards">Nominierung einreichen</Link>
            </Button>
          )}
          {award.status === 'voting' && (
            <Button size="sm" className="mt-3" asChild>
              <Link href="/login?redirectTo=/awards">Jetzt abstimmen</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
