import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { HelpButton } from '@/presentation/components/atoms/HelpButton'
import { ClientArtwork } from './ClientArtwork'
import { DemoBannerWrapper } from './DemoBannerWrapper'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Music2,
  Star,
  Award,
  Flame,
  Heart,
  Zap,
  Package,
  Film,
  ShieldCheck,
  Mic2,
} from 'lucide-react'

export const metadata = { title: 'Charts · DarkTunes' }

const TIER_HELP = {
  title: 'Das Tier-System erklärt',
  description:
    'Tiers basieren auf monatlichen Spotify-Streamzahlen:\n\n• MAJOR: > 1.000.000 Streams/Monat\n• INDIE: 100.000 – 1.000.000 Streams/Monat\n• MICRO: 10.000 – 100.000 Streams/Monat\n• UNDERGROUND: < 10.000 Streams/Monat\n\nDas Tier-System verhindert, dass Major-Labels kleinere Bands verdrängen. Voting-Pools sind nach Tiers getrennt.',
}

/* ── Seed data — replaced by real API data once votes are submitted ── */
const PLACEHOLDER_ENTRIES: ChartEntry[] = [
  {
    rank: 1, prev: 1, title: 'The Iron Testament', artist: 'Xordia',
    tier: 'Micro', genre: 'Metal', fanScore: 0, djScore: 766,
    total: 488.9, trend: 'up',
  },
  {
    rank: 2, prev: 2, title: 'Nocturnal Requiem', artist: 'Vioflesh',
    tier: 'Micro', genre: 'Goth', fanScore: 0, djScore: 752,
    total: 483.6, trend: 'down',
  },
  {
    rank: 3, prev: 4, title: 'System Override', artist: 'X-Rx',
    tier: 'Emerging', genre: 'Dark Electro', fanScore: 0, djScore: 756,
    total: 481.9, trend: 'up',
  },
  {
    rank: 4, prev: 3, title: 'Siege of Eternity', artist: 'White Ritual',
    tier: 'Micro', genre: 'Metal', fanScore: 0, djScore: 751,
    total: 399.9, trend: 'down',
  },
  {
    rank: 5, prev: 5, title: 'The Pale Archive', artist: 'TOAL',
    tier: 'Micro', genre: 'Goth', fanScore: 0, djScore: 756,
    total: 399.6, trend: 'neutral',
  },
  {
    rank: 6, prev: 8, title: "Titan's Wrath", artist: 'The Silverblack',
    tier: 'Emerging', genre: 'Metal', fanScore: 0, djScore: 749,
    total: 381.2, trend: 'up',
  },
]

const SPECIAL_AWARDS: SpecialAward[] = [
  {
    icon: <Film     size={16} />,
    label: 'Best Cover Art',
    sublabel: 'Bestes Artwork / Packaging',
    winner: 'Vioflesh',
    track: 'Nocturnal Requiem',
    genre: 'Goth',
    color: '#7C3AED',
  },
  {
    icon: <Package  size={16} />,
    label: 'Best Merch',
    sublabel: 'Bestes Merchandise-Design',
    winner: 'Breed Machine',
    track: 'March-Kollektion',
    genre: 'Micro',
    color: '#6B7280',
  },
  {
    icon: <Film     size={16} />,
    label: 'Best Music Video',
    sublabel: 'Bestes Musikvideo / Visualizer',
    winner: 'Nocturnal Requiem',
    track: 'Vioflesh',
    genre: 'Goth',
    color: '#7C3AED',
  },
  {
    icon: <ShieldCheck size={16} />,
    label: 'Dark Integrity Award',
    sublabel: 'Soziales Engagement in der Szene',
    winner: 'Ost+Front',
    track: 'Anti-Mobbing & Mental Health',
    genre: 'Community',
    color: '#10B981',
  },
  {
    icon: <Mic2    size={16} />,
    label: 'Underground Anthem',
    sublabel: 'Bester Track < 10k Listeners',
    winner: 'Void Hammer',
    track: 'Aevum',
    genre: 'Micro',
    color: '#6B7280',
  },
  {
    icon: <Heart   size={16} />,
    label: 'Fan Favourite',
    sublabel: 'Meiste Voice Credits aller Fans',
    winner: 'Signal Decay',
    track: '25 Credits',
    genre: 'Aesthetic Perfection',
    color: '#D30000',
  },
  {
    icon: <Zap     size={16} />,
    label: 'Rising Star',
    sublabel: 'Stärkster Momentum-Anstieg',
    winner: 'SynthAttack',
    track: '21,300 Listener',
    genre: 'Dark Electro',
    color: '#F59E0B',
  },
  {
    icon: <Star    size={16} />,
    label: 'Scene Legend',
    sublabel: 'Szene-Ikone des Monats',
    winner: 'Combichrist',
    track: '324,000 Listener',
    genre: 'Metal',
    color: '#7C3AED',
  },
]

interface ChartEntry {
  rank: number
  prev: number
  title: string
  artist: string
  tier: string
  genre: string
  fanScore: number
  djScore: number
  total: number
  trend: 'up' | 'down' | 'neutral'
  artworkUrl?: string
  spotifyUrl?: string
}

interface SpecialAward {
  icon: React.ReactNode
  label: string
  sublabel: string
  winner: string
  track: string
  genre: string
  color: string
}

const GENRE_COLORS: Record<string, string> = {
  'Metal':       '#6B7280',
  'Goth':        '#7C3AED',
  'Dark Electro':'#00F0FF',
  'Gothic':      '#7C3AED',
  'Alternative': '#10B981',
  'Emerging':    '#F59E0B',
  'Micro':       '#6B7280',
}

const CATEGORY_TABS = ['Overall', 'Dark Electro', 'Metal', 'Gothic'] as const

/* ──────────────────────────────────────────────────────────────────────── */

export default function ChartsPage() {
  return (
    <main className="min-h-screen gradient-mesh">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8">

        {/* ── Demo Data Banner ── */}
        <DemoBannerWrapper />

        {/* ── Page Header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1
              className="text-4xl font-display text-white"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
            >
              Overall Charts
            </h1>
            <HelpButton
              title={TIER_HELP.title}
              description={TIER_HELP.description}
              ariaLabel="Hilfe zum Tier-System"
            />
          </div>
          <p className="text-sm text-white/40" style={{ fontFamily: 'var(--font-body)' }}>
            Kombination aller drei Voting-Säulen · Fan 33,3&nbsp;% · DJ 33,3&nbsp;% · Peer 33,3&nbsp;%
          </p>
        </div>

        {/* ── Category Tabs ── */}
        <CategoryTabs />

        {/* ── Main Layout: Chart List + Sidebar ── */}
        <div className="flex gap-6 mt-6">

          {/* Chart List */}
          <div className="flex-1 min-w-0 space-y-2">
            <Suspense fallback={<ChartSkeleton />}>
              {PLACEHOLDER_ENTRIES.map((entry) => (
                <ChartEntryCard key={entry.rank} entry={entry} />
              ))}
            </Suspense>
          </div>

          {/* Special Awards Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <SpecialAwardsSidebar />
          </aside>

        </div>
      </div>
    </main>
  )
}

/* ── Category Tabs ──────────────────────────────────────────────────────── */

function CategoryTabs() {
  return (
    <div className="flex items-center gap-0 border border-white/[0.07] rounded-sm overflow-hidden w-fit bg-[#141414]">
      {CATEGORY_TABS.map((tab, i) => (
        <button
          key={tab}
          className={`px-5 py-2 text-[12px] uppercase tracking-wider transition-colors ${
            i === 0
              ? 'bg-white/8 text-white'
              : 'text-white/40 hover:text-white/70 hover:bg-white/4'
          }`}
          style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

/* ── Chart Entry Card ───────────────────────────────────────────────────── */

function ChartEntryCard({ entry }: { entry: ChartEntry }) {
  const maxScore = 500
  const progress = Math.min((entry.total / maxScore) * 100, 100)

  return (
    <div className="bg-[#141414] border border-white/[0.06] rounded-sm p-4 card-hover">
      <div className="flex items-start gap-4">

        {/* Rank */}
        <div className="flex flex-col items-center shrink-0 w-8">
          <span
            className="text-2xl font-display text-white leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {entry.rank}
          </span>
          <TrendIndicator trend={entry.trend} prev={entry.prev} />
        </div>

        {/* Artwork */}
        {entry.artworkUrl && <ClientArtwork src={entry.artworkUrl} alt={`${entry.title} cover`} />}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0 flex items-center gap-2">
              <div>
                <h3
                  className="text-base font-display text-white leading-tight truncate flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
                >
                  {entry.title}
                  {entry.spotifyUrl && (
                    <a href={entry.spotifyUrl} target="_blank" rel="noopener noreferrer" className="text-[#1DB954] hover:opacity-80 transition-opacity" title="Play on Spotify">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                    </a>
                  )}
                </h3>
                <p className="text-xs text-white/45 mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
                  {entry.artist}
                </p>
              </div>
            </div>
            {/* Genre tags */}
            <div className="flex items-center gap-1.5 shrink-0">
              <GenreTag label={entry.tier} />
              <GenreTag label={entry.genre} />
            </div>
          </div>

          {/* Scores row */}
          <div className="flex items-center gap-6 mb-3">
            <ScoreCell icon={<Users size={12} className="text-white/30" />} label="Fan" value={entry.fanScore} />
            <ScoreCell icon={<Music2 size={12} className="text-[#00F0FF]/70" />} label="DJ" value={entry.djScore} />
          </div>

          {/* Progress + total */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[3px] bg-white/6 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7C3AED] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span
              className="text-sm font-mono text-white/70 shrink-0 tabular-nums"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {entry.total.toFixed(1)}
            </span>
          </div>
          <p className="text-[10px] text-white/25 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
            Gesamt-Score
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'neutral'; prev: number }) {
  if (trend === 'up')      return <TrendingUp   size={11} className="text-[#00FF66] mt-1" />
  if (trend === 'down')    return <TrendingDown  size={11} className="text-[#D30000] mt-1" />
  return <Minus size={11} className="text-white/25 mt-1" />
}

function GenreTag({ label }: { label: string }) {
  const color = GENRE_COLORS[label] ?? '#6B7280'
  return (
    <span
      className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider rounded-sm border"
      style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        color,
        borderColor: `${color}40`,
        backgroundColor: `${color}10`,
      }}
    >
      {label}
    </span>
  )
}

function ScoreCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[10px] text-white/30 uppercase tracking-wider" style={{ fontFamily: 'var(--font-body)' }}>
          {label}
        </span>
      </div>
      <span
        className="text-sm font-mono text-white tabular-nums"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {value}
      </span>
    </div>
  )
}

/* ── Special Awards Sidebar ─────────────────────────────────────────────── */

function SpecialAwardsSidebar() {
  return (
    <div className="bg-[#0F0F0F] border border-white/[0.06] rounded-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <Award size={14} className="text-[#7C3AED]" />
        <h2
          className="text-xs font-display text-white tracking-[0.16em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Special Awards
        </h2>
      </div>

      <div className="space-y-3">
        {SPECIAL_AWARDS.map((award) => (
          <SpecialAwardCard key={award.label} award={award} />
        ))}
      </div>

      {/* Artist Spotlight teaser */}
      <div className="mt-5 pt-4 border-t border-white/[0.06]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Flame size={12} className="text-[#7C3AED]" />
            <span
              className="text-[10px] font-display text-white tracking-[0.14em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Artist Spotlight
            </span>
          </div>
          <span className="text-[9px] text-white/30 uppercase tracking-wider" style={{ fontFamily: 'var(--font-body)' }}>
            täglich neu
          </span>
        </div>
      </div>
    </div>
  )
}

function SpecialAwardCard({ award }: { award: SpecialAward }) {
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-white/[0.04] last:border-0">
      <div
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-sm mt-0.5"
        style={{ backgroundColor: `${award.color}18`, color: award.color }}
      >
        {award.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <span
            className="text-[11px] font-display text-white leading-tight"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}
          >
            {award.label}
          </span>
          <span
            className="text-[9px] uppercase tracking-wider shrink-0"
            style={{ fontFamily: 'var(--font-body)', color: award.color }}
          >
            {award.genre}
          </span>
        </div>
        <p className="text-[10px] text-white/30 mt-0.5 leading-tight" style={{ fontFamily: 'var(--font-body)' }}>
          {award.sublabel}
        </p>
        <p className="text-[11px] text-white/80 font-medium mt-1 truncate" style={{ fontFamily: 'var(--font-body)' }}>
          {award.winner}
        </p>
        <p className="text-[10px] text-white/35 truncate" style={{ fontFamily: 'var(--font-body)' }}>
          {award.track}
        </p>
      </div>
    </div>
  )
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */

function ChartSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-[100px] w-full bg-white/[0.04]" />
      ))}
    </div>
  )
}

