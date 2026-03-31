import { useMemo, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Disc, UsersThree, TrendUp, TrendDown, Minus, SpotifyLogo, ArrowSquareOut, LinkSimple, Trophy, ChartBar } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Band, Track, FanVote, Genre } from '@/lib/types'
import { cn, seededRandom, getCountryFlag, getTierBadgeVariant, GENRE_GRADIENTS } from '@/lib/utils'
import { getCachedImageUrl } from '@/lib/imageCache'
import { ArtistSpotlight } from '@/features/spotlight/ArtistSpotlight'
import { SpecialAwards } from '@/features/charts/SpecialAwards'
import { calculateWeightedScore, resolveWeights } from '@/domain/voting/combined'

type ChartFilter = 'overall' | Genre

interface ChartsViewProps {
  bands: Band[]
  tracks: Track[]
  fanVotes: Record<string, FanVote>
}

const CHART_TABS: { value: ChartFilter; label: string }[] = [
  { value: 'overall',      label: 'Overall' },
  { value: 'Dark Electro', label: 'Dark Electro' },
  { value: 'Metal',        label: 'Metal' },
  { value: 'Goth',         label: 'Gothic' },
]

function EmptyCharts({ genre }: { genre: ChartFilter }) {
  return (
    <Card className="p-12 glassmorphism text-center">
      <Disc className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" weight="duotone" />
      <h3 className="font-display text-xl font-semibold mb-2">Keine Tracks</h3>
      <p className="text-muted-foreground text-sm">
        {genre === 'overall'
          ? 'Reiche deine Band in einer Kategorie ein, um in den Charts zu erscheinen.'
          : `Noch keine ${genre}-Tracks in diesem Monat eingereicht.`}
      </p>
    </Card>
  )
}

interface ChartRow {
  track: Track
  band: Band
  fanCredits: number
  djScore: number
  peerScore: number
  compositeScore: number
}

/**
 * Score algorithm constants for the three voting pillars.
 * DJ and peer scores are seeded until real ballot data is connected.
 * The multipliers (30, 5, 20, 3) scale the seeded pseudo-random values
 * into the same rough range as fan credit spending.
 */
const DJ_SCORE_RANGE = 30
const DJ_SCORE_BASE = 5
const PEER_SCORE_RANGE = 20
const PEER_SCORE_BASE = 3

/** Equal weight in percent for display when all pillars carry the same share. */
const EQUAL_PILLAR_PERCENT = 100 / 3

function buildChartRows(
  tracks: Track[],
  bands: Band[],
  fanVotes: Record<string, FanVote>,
  genreFilter: ChartFilter,
): ChartRow[] {
  // Overall chart uses equal 1/3 weights; genre sub-tabs also use equal weights
  // since genre ≠ AllCategory. Category-specific weights are applied when the
  // platform exposes a per-category chart view in a future iteration.
  const weights = resolveWeights()

  const filtered = genreFilter === 'overall'
    ? tracks
    : tracks.filter(t => {
        const band = bands.find(b => b.id === t.bandId)
        return band?.genre === genreFilter
      })

  return filtered
    .map((track, idx) => {
      const band = bands.find(b => b.id === track.bandId)
      if (!band) return null

      const fanCredits = fanVotes[track.id]?.creditsSpent ?? 0
      const djScore = Math.floor(seededRandom(idx * 3 + 1) * DJ_SCORE_RANGE + idx * DJ_SCORE_BASE)
      const peerScore = Math.floor(seededRandom(idx * 3 + 2) * PEER_SCORE_RANGE + idx * PEER_SCORE_BASE)
      const compositeScore = calculateWeightedScore(fanCredits, djScore, peerScore, weights)

      return { track, band, fanCredits, djScore, peerScore, compositeScore }
    })
    .filter((row): row is ChartRow => row !== null)
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 10)
}

type ViewMode = 'rankings' | 'awards'

/**
 * Main Charts view with genre-specific tabs, artist spotlight, and special awards.
 *
 * Displays Overall + per-genre rankings (Dark Electro, Metal, Gothic).
 * Fan credits are sourced from real KV vote data; DJ and peer scores are
 * deterministically seeded until the respective voting pillars are connected.
 * The layout uses a 2-column grid on desktop: charts on the left,
 * special awards + artist spotlight on the right.
 */
export function ChartsView({ bands, tracks, fanVotes }: ChartsViewProps) {
  const [activeFilter, setActiveFilter] = useState<ChartFilter>('overall')
  const [viewMode, setViewMode] = useState<ViewMode>('rankings')

  const handleFilterChange = useCallback((value: string) => {
    setActiveFilter(value as ChartFilter)
  }, [])

  const chartRows = useMemo(
    () => buildChartRows(tracks, bands, fanVotes, activeFilter),
    [tracks, bands, fanVotes, activeFilter],
  )

  // Weights for the subtitle — overall/genre tabs always use equal thirds
  const activeWeights = resolveWeights()
  const fanWeightPct = Math.round(activeWeights.fan * 100)
  const djWeightPct  = Math.round(activeWeights.dj  * 100)
  const peerWeightPct = Math.round(activeWeights.peer * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight mb-1">
            {activeFilter === 'overall' ? 'OVERALL CHARTS' : `${activeFilter.toUpperCase()} CHARTS`}
          </h2>
          <p className="text-muted-foreground text-sm">
            Kombination aller drei Voting-Säulen · Fan {fanWeightPct} % · DJ {djWeightPct} % · Peer {peerWeightPct} %
          </p>
        </div>
        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'rankings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('rankings')}
            className="text-xs"
          >
            <ChartBar className="w-4 h-4 mr-1.5" weight="bold" /> Rankings
          </Button>
          <Button
            variant={viewMode === 'awards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('awards')}
            className="text-xs"
          >
            <Trophy className="w-4 h-4 mr-1.5" weight="bold" /> Awards
          </Button>
        </div>
      </div>

      {/* Genre tabs — only shown in rankings mode */}
      {viewMode === 'rankings' && (
        <Tabs value={activeFilter} onValueChange={handleFilterChange}>
          <TabsList className="w-full sm:w-auto">
            {CHART_TABS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value} className="flex-1 sm:flex-none">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Main layout: chart list + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Chart list or Awards */}
        <div className="space-y-3">
          {viewMode === 'awards' ? (
            <SpecialAwards bands={bands} tracks={tracks} fanVotes={fanVotes} />
          ) : chartRows.length === 0 ? (
            <EmptyCharts genre={activeFilter} />
          ) : (
            chartRows.map(({ track, band, fanCredits, djScore, peerScore }, rank) => (
              <ChartCard
                key={track.id}
                track={track}
                band={band}
                fanCredits={fanCredits}
                djScore={djScore}
                peerScore={peerScore}
                rank={rank}
              />
            ))
          )}
        </div>

        {/* Sidebar: Special Awards + Artist Spotlight */}
        {viewMode === 'rankings' && (
          <aside className="space-y-6">
            <SpecialAwards bands={bands} tracks={tracks} fanVotes={fanVotes} />
            <ArtistSpotlight bands={bands} tracks={tracks} />
          </aside>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ChartCard — single chart entry with micro-interactions
// ---------------------------------------------------------------------------

interface ChartCardProps {
  track: Track
  band: Band
  fanCredits: number
  djScore: number
  peerScore: number
  rank: number
}

/** Simulates a movement indicator; in production this would compare to previous week's rank. */
function RankMovement({ rank, seed }: { rank: number; seed: number }) {
  const r = seededRandom(seed + rank * 17)
  if (r < 0.33) return <TrendUp className="w-3.5 h-3.5 text-green-400" weight="bold" />
  if (r < 0.66) return <TrendDown className="w-3.5 h-3.5 text-red-400" weight="bold" />
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" weight="bold" />
}

function ChartCard({ track, band, fanCredits, djScore, peerScore, rank }: ChartCardProps) {
  const weights = resolveWeights()
  const compositeScore = calculateWeightedScore(fanCredits, djScore, peerScore, weights)
  const totalScore = fanCredits + djScore + peerScore
  const fanPercent  = totalScore > 0 ? (fanCredits / totalScore) * 100 : EQUAL_PILLAR_PERCENT
  const djPercent   = totalScore > 0 ? (djScore   / totalScore) * 100 : EQUAL_PILLAR_PERCENT
  const peerPercent = totalScore > 0 ? (peerScore  / totalScore) * 100 : EQUAL_PILLAR_PERCENT

  const artworkSrc = track.coverArtUrl ?? band.coverArtUrl ?? band.logoUrl ?? null

  return (
    <Card
      className={cn(
        'p-4 sm:p-5 glassmorphism transition-all duration-300',
        'hover:bg-card/70 hover:-translate-y-0.5 hover:shadow-lg',
        rank === 0 && 'hover:shadow-primary/20 ring-1 ring-primary/20',
        rank === 1 && 'hover:shadow-primary/10',
        rank === 2 && 'hover:shadow-accent/10',
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Rank number */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div
            className={cn(
              'w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center',
              'font-display font-bold text-lg sm:text-xl transition-all duration-300',
              rank === 0 && 'glow-primary bg-primary/30 text-primary-foreground',
              rank === 1 && 'bg-secondary/80 text-foreground',
              rank === 2 && 'bg-accent/20 text-accent-foreground',
              rank >= 3 && 'bg-secondary/40 text-muted-foreground',
            )}
          >
            {rank + 1}
          </div>
          <RankMovement rank={rank} seed={track.id.charCodeAt(0)} />
        </div>

        {/* Album Artwork */}
        <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-md overflow-hidden relative">
          {artworkSrc ? (
            <Image
              src={getCachedImageUrl(artworkSrc, { width: 112, height: 112, fit: 'cover' }) ?? artworkSrc}
              alt={`${track.title} artwork`}
              fill
              sizes="56px"
              className="object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className={cn(
                'w-full h-full bg-gradient-to-br flex items-center justify-center',
                GENRE_GRADIENTS[band.genre],
              )}
            >
              <Disc className="w-5 h-5 text-white/30" weight="duotone" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title + badges */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-base sm:text-lg leading-tight truncate">
                {track.title}
              </h3>
              <Link
                href={`/band/${band.id}`}
                className="text-sm text-muted-foreground truncate hover:text-foreground transition-colors"
              >
                {band.name}
              </Link>
            </div>
            <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
              <Badge variant={getTierBadgeVariant(band.tier)} className="text-xs px-1.5 py-0">
                {band.tier}
              </Badge>
              <Badge variant="outline" className="text-xs px-1.5 py-0 hidden sm:inline-flex">
                {band.genre}
              </Badge>
              {band.country && (
                <span className="text-xs" title={band.country}>
                  {getCountryFlag(band.country)}
                </span>
              )}
            </div>
          </div>

          {/* Streaming Links */}
          <div className="flex items-center gap-2 mb-2">
            {band.spotifyUrl && (
              <a
                href={band.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#1DB954] transition-colors"
                title="Spotify"
                aria-label={`${band.name} auf Spotify`}
              >
                <SpotifyLogo className="w-3.5 h-3.5" weight="fill" />
              </a>
            )}
            {band.bandcampUrl && (
              <a
                href={band.bandcampUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#1DA0C3] transition-colors"
                title="Bandcamp"
                aria-label={`${band.name} auf Bandcamp`}
              >
                <ArrowSquareOut className="w-3.5 h-3.5" weight="bold" />
              </a>
            )}
            {track.odesliUrl && (
              <a
                href={track.odesliUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Überall anhören"
                aria-label={`${track.title} überall anhören`}
              >
                <LinkSimple className="w-3.5 h-3.5" weight="bold" />
              </a>
            )}
            {band.spotifyMonthlyListeners > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground/60 ml-auto">
                {band.spotifyMonthlyListeners.toLocaleString('de-DE')} listeners
              </span>
            )}
          </div>

          {/* Score pillars */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <PillarScore
              icon={<Heart className="w-3.5 h-3.5 text-primary" />}
              label="Fan"
              value={fanCredits}
            />
            <PillarScore
              icon={<Disc className="w-3.5 h-3.5 text-accent" />}
              label="DJ"
              value={djScore}
            />
            <PillarScore
              icon={<UsersThree className="w-3.5 h-3.5 text-destructive" />}
              label="Peer"
              value={peerScore}
            />
          </div>

          {/* Stacked score bar — Phase 4.3 */}
          <div className="flex h-1.5 rounded-full overflow-hidden bg-secondary/30">
            <div
              className="bg-primary transition-all duration-500"
              style={{ width: `${fanPercent}%` }}
              title={`Fan: ${fanCredits}`}
            />
            <div
              className="bg-accent transition-all duration-500"
              style={{ width: `${djPercent}%` }}
              title={`DJ: ${djScore}`}
            />
            <div
              className="bg-destructive transition-all duration-500"
              style={{ width: `${peerPercent}%` }}
              title={`Peer: ${peerScore}`}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" /> Fan
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" /> DJ
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block" /> Peer
              </span>
            </div>
            <span className="text-xs font-mono font-bold">{compositeScore.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

/** Skeleton loading placeholder for a single ChartCard entry. */
export function ChartCardSkeleton() {
  return (
    <Card className="p-4 sm:p-5 glassmorphism">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg skeleton-shimmer" />
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-md skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded skeleton-shimmer" />
          <div className="h-3 w-1/2 rounded skeleton-shimmer" />
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="h-10 rounded-md skeleton-shimmer" />
            <div className="h-10 rounded-md skeleton-shimmer" />
            <div className="h-10 rounded-md skeleton-shimmer" />
          </div>
          <div className="h-1.5 w-full rounded-full skeleton-shimmer mt-3" />
        </div>
      </div>
    </Card>
  )
}

interface PillarScoreProps {
  icon: React.ReactNode
  label: string
  value: number
}

function PillarScore({ icon, label, value }: PillarScoreProps) {
  return (
    <div className="flex items-center gap-1.5 p-2 bg-secondary/30 rounded-md group hover:bg-secondary/50 transition-colors duration-200">
      {icon}
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
        <p className="font-mono font-bold text-sm leading-tight">{value}</p>
      </div>
    </div>
  )
}
