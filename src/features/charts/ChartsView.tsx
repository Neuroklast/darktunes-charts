import { useMemo, useState, useCallback } from 'react'
import { Heart, Disc, UsersThree, TrendUp, TrendDown, Minus } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Band, Track, FanVote, Genre } from '@/lib/types'
import { cn, seededRandom } from '@/lib/utils'
import { ArtistSpotlight } from '@/features/spotlight/ArtistSpotlight'
import { SpecialAwards } from '@/features/charts/SpecialAwards'

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

function getTierBadgeVariant(tier: string): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (tier) {
    case 'Macro':         return 'destructive'
    case 'International': return 'destructive'
    case 'Established':   return 'default'
    case 'Emerging':      return 'secondary'
    default:              return 'outline'
  }
}

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
const PILLAR_WEIGHT = 0.333

/**
 * Maximum achievable composite score under current seed parameters.
 * Used to normalise the progress bar to 0–100%.
 */
const MAX_COMPOSITE_SCORE = 60

function buildChartRows(
  tracks: Track[],
  bands: Band[],
  fanVotes: Record<string, FanVote>,
  genreFilter: ChartFilter,
): ChartRow[] {
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
      const compositeScore = (fanCredits * PILLAR_WEIGHT) + (djScore * PILLAR_WEIGHT) + (peerScore * PILLAR_WEIGHT)

      return { track, band, fanCredits, djScore, peerScore, compositeScore }
    })
    .filter((row): row is ChartRow => row !== null)
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 10)
}

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

  const handleFilterChange = useCallback((value: string) => {
    setActiveFilter(value as ChartFilter)
  }, [])

  const chartRows = useMemo(
    () => buildChartRows(tracks, bands, fanVotes, activeFilter),
    [tracks, bands, fanVotes, activeFilter],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold tracking-tight mb-1">
            {activeFilter === 'overall' ? 'OVERALL CHARTS' : `${activeFilter.toUpperCase()} CHARTS`}
          </h2>
          <p className="text-muted-foreground text-sm">
            Kombination aller drei Voting-Säulen · Fan 33,3 % · DJ 33,3 % · Peer 33,3 %
          </p>
        </div>
      </div>

      {/* Genre tabs */}
      <Tabs value={activeFilter} onValueChange={handleFilterChange}>
        <TabsList className="w-full sm:w-auto">
          {CHART_TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="flex-1 sm:flex-none">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Main layout: chart list + sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Chart list */}
        <div className="space-y-3">
          {chartRows.length === 0 ? (
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
        <aside className="space-y-6">
          <SpecialAwards bands={bands} tracks={tracks} fanVotes={fanVotes} />
          <ArtistSpotlight bands={bands} tracks={tracks} />
        </aside>
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
  const compositeScore = (fanCredits * PILLAR_WEIGHT) + (djScore * PILLAR_WEIGHT) + (peerScore * PILLAR_WEIGHT)

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

        <div className="flex-1 min-w-0">
          {/* Title + badges */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-base sm:text-lg leading-tight truncate">
                {track.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate">{band.name}</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <Badge variant={getTierBadgeVariant(band.tier)} className="text-xs px-1.5 py-0">
                {band.tier}
              </Badge>
              <Badge variant="outline" className="text-xs px-1.5 py-0 hidden sm:inline-flex">
                {band.genre}
              </Badge>
            </div>
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

          {/* Composite score bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Gesamt-Score</span>
              <span className="text-xs font-mono font-bold">
                {compositeScore.toFixed(1)}
              </span>
            </div>
            <Progress
              value={Math.min((compositeScore / MAX_COMPOSITE_SCORE) * 100, 100)}
              className="h-1.5"
            />
          </div>
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
